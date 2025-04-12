from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
import h5py
import os
import tempfile
from fastapi.responses import JSONResponse
import logging
import numpy as np
import json
from typing import List, Optional, Dict, Any, Union
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Increase timeout for the app
app.middleware_stack = None  # Clear existing middleware to rebuild with new settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rebuild middleware with timeout settings
app.middleware_stack = app.build_middleware_stack()

UPLOAD_DIR = tempfile.gettempdir()
# Ensure uploads directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Increase the maximum upload file size (to 1GB)
app.dependency_overrides = {
    UploadFile: lambda: UploadFile(upload_file_max_size=1024*1024*1024)
}

# Custom JSON encoder to handle NumPy arrays and other non-JSON serializable types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.bool_):
            return bool(obj)
        if isinstance(obj, (complex, np.complex_)):
            return [obj.real, obj.imag]
        # Handle h5py attributes which might be ndarray or other special types
        if isinstance(obj, bytes):
            return obj.decode('utf-8', errors='replace')
        return super().default(obj)

def get_hdf5_structure(filename):
    structure = {}

    try:
        def visit(name, node):
            if isinstance(node, h5py.Dataset):
                # Convert shape to regular Python list if it's a numpy array
                shape = list(node.shape) if isinstance(node.shape, tuple) else node.shape
                
                # Add more information about dimensionality for the frontend
                ndims = len(shape) if isinstance(shape, list) else (1 if shape > 0 else 0)
                axes_info = []
                for i, dim_size in enumerate(shape if isinstance(shape, list) else [shape]):
                    axes_info.append({
                        "axis": i,
                        "size": dim_size,
                        "name": f"Axis {i}"  # Default name
                    })
                
                structure[name] = {
                    "type": "dataset",
                    "shape": shape,
                    "ndims": ndims,
                    "axes": axes_info,
                    "dtype": str(node.dtype)
                }
            elif isinstance(node, h5py.Group):
                structure[name] = {"type": "group"}

        with h5py.File(filename, 'r') as f:
            f.visititems(visit)
            
            # Handle attributes properly
            attrs_dict = {}
            for key, value in f.attrs.items():
                # Convert numpy types to Python native types
                if isinstance(value, (np.ndarray, np.integer, np.floating, np.bool_)):
                    attrs_dict[key] = json.loads(json.dumps(value, cls=NumpyEncoder))
                else:
                    try:
                        # Try regular JSON serialization
                        attrs_dict[key] = value
                    except (TypeError, OverflowError):
                        # If not serializable, convert to string
                        attrs_dict[key] = str(value)
            
            structure["comments"] = attrs_dict

        return structure
    except Exception as e:
        logger.error(f"Error reading HDF5 file structure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to read HDF5 file structure: {str(e)}")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        logger.info(f"Receiving file upload: {file.filename}")
        
        # Ensure upload directory exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        logger.info(f"Saving file to: {file_location}")
        
        # Process the file in chunks to avoid memory issues
        CHUNK_SIZE = 4 * 1024 * 1024  # Increased to 4MB chunks for better performance
        
        # Use a more efficient way to copy the file
        with open(file_location, "wb") as buffer:
            # Copy file content with progress logging
            received_size = 0
            logger.info(f"Starting chunked file upload...")
            
            start_time = time.time()
            last_log_time = start_time
            
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break
                
                received_size += len(chunk)
                buffer.write(chunk)
                
                # Log progress every 10MB or every 5 seconds, whichever comes first
                current_time = time.time()
                if received_size % (10 * CHUNK_SIZE) == 0 or (current_time - last_log_time) > 5:
                    elapsed = current_time - start_time
                    speed = received_size / (1024 * 1024 * elapsed) if elapsed > 0 else 0
                    logger.info(f"Uploaded {received_size / (1024 * 1024):.2f} MB so far, speed: {speed:.2f} MB/s")
                    last_log_time = current_time
        
        total_time = time.time() - start_time
        logger.info(f"File saved ({received_size / (1024 * 1024):.2f} MB in {total_time:.2f} seconds), getting structure")
        
        # Check if the file exists and is readable before processing
        if not os.path.exists(file_location) or os.path.getsize(file_location) == 0:
            raise HTTPException(status_code=500, detail="File was not saved properly or is empty")
            
        try:
            # Try to open the file first to verify it's a valid HDF5 file
            with h5py.File(file_location, 'r') as test_file:
                pass  # Just testing if the file opens successfully
                
            # Now get the full structure - but with a timeout for large files
            start_time = time.time()
            structure = get_hdf5_structure(file_location)
            logger.info(f"Structure extraction took {time.time() - start_time:.2f} seconds")
            
        except (OSError, IOError) as e:
            logger.error(f"Invalid HDF5 file: {str(e)}")
            # Remove the invalid file
            if os.path.exists(file_location):
                os.remove(file_location)
            raise HTTPException(status_code=400, detail=f"Invalid HDF5 file: {str(e)}")
        
        logger.info(f"Returning response with structure containing {len(structure)} items")
        
        # Use the custom encoder to handle NumPy types
        return JSONResponse(
            content=json.loads(json.dumps(
                {"structure": structure, "path": file_location}, 
                cls=NumpyEncoder
            ))
        )
    
    except Exception as e:
        logger.error(f"Error in upload_file: {str(e)}")
        # Try to clean up if there was an error
        if 'file_location' in locals() and os.path.exists(file_location):
            try:
                os.remove(file_location)
                logger.info(f"Removed incomplete file after error")
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dataset")
def read_dataset(
    file: str, 
    path: str,
    x_axis: Optional[int] = Query(0, description="Axis to plot along for multi-dimensional data"),
    x_dataset: Optional[str] = Query(None, description="Optional dataset to use for X values"),
    slices_str: Optional[str] = Query(None, description="Slice indices as JSON string: {'0': 1, '2': 3}"),
    start_idx: Optional[int] = Query(0, description="Starting index for slicing"),
    end_idx: Optional[int] = Query(None, description="Ending index for slicing (None = all data)"),
    stride: Optional[int] = Query(1, description="Step size for data sampling"),
    num_points: Optional[int] = Query(None, description="Maximum number of points to return")
):
    try:
        logger.info(f"Reading dataset from file: {file}, path: {path}")
        logger.info(f"Parameters: x_axis={x_axis}, slices_str={slices_str}, stride={stride}")
        
        # Parse slices from string if provided
        slices = None
        if slices_str:
            try:
                slices = json.loads(slices_str)
            except json.JSONDecodeError:
                logger.warning(f"Invalid slices JSON string: {slices_str}")
                slices = None
        
        if not os.path.exists(file):
            logger.error(f"File not found: {file}")
            raise HTTPException(status_code=404, detail=f"File not found: {file}")
        
        result = {}
        
        with h5py.File(file, 'r') as f:
            if path not in f:
                logger.error(f"Dataset path not found: {path}")
                raise HTTPException(status_code=404, detail=f"Dataset path not found: {path}")
            
            dataset = f[path]
            data = dataset[()]
            
            # Handle multi-dimensional data
            if isinstance(data, np.ndarray):
                # Get dataset info
                shape = list(data.shape)
                ndims = len(shape)
                
                # Basic validation
                if x_axis >= ndims:
                    raise HTTPException(status_code=400, detail=f"X-axis index {x_axis} out of bounds for dataset with {ndims} dimensions")
                
                # Process custom X dataset if provided
                x_data = None
                if x_dataset and x_dataset in f:
                    x_data_array = f[x_dataset][()]
                    if isinstance(x_data_array, np.ndarray):
                        # Use the specified axis of the x dataset
                        if ndims == 1:
                            x_data = x_data_array
                        else:
                            # Extract the appropriate axis
                            slices_x = [0] * ndims
                            slices_x[x_axis] = slice(None)
                            x_data = np.take(x_data_array, indices=0, axis=tuple([i for i in range(ndims) if i != x_axis]))
                
                # Handle different dimensionality cases
                if ndims == 1:
                    # 1D data: simple slicing
                    y_data = data[start_idx:end_idx:stride]
                    
                    # Apply point limit if specified
                    if num_points and len(y_data) > num_points:
                        # Calculate new stride to get close to num_points
                        new_stride = max(1, len(y_data) // num_points)
                        y_data = y_data[::new_stride]
                    
                    result["y_data"] = y_data.tolist()
                    
                    # Use custom X data or generate indices
                    if x_data is not None:
                        # Ensure x_data matches y_data in length
                        if len(x_data) >= len(y_data):
                            result["x_data"] = x_data[:len(y_data)].tolist()
                        else:
                            # Pad x_data if necessary
                            padded_x = np.pad(x_data, (0, len(y_data) - len(x_data)), 'edge')
                            result["x_data"] = padded_x.tolist()
                    else:
                        # Use indices as x values
                        result["x_data"] = list(range(start_idx, start_idx + len(y_data) * stride, stride))[:len(y_data)]
                
                elif ndims == 2:
                    # 2D data: extract a line along specified axis
                    if x_axis == 0:
                        # Extract rows
                        y_data = data[start_idx:end_idx:stride, :]
                    else:
                        # Extract columns
                        y_data = data[:, start_idx:end_idx:stride]
                    
                    # Apply point limit if specified
                    if num_points and y_data.shape[x_axis] > num_points:
                        # Calculate new stride to get close to num_points
                        new_stride = max(1, y_data.shape[x_axis] // num_points)
                        if x_axis == 0:
                            y_data = y_data[::new_stride, :]
                        else:
                            y_data = y_data[:, ::new_stride]
                    
                    # Flatten to 1D for easier plotting
                    y_data = np.squeeze(y_data)
                    result["y_data"] = y_data.tolist()
                    
                    # Use custom X data or generate indices
                    if x_data is not None:
                        # Ensure x_data matches y_data in length
                        if len(x_data) >= len(y_data):
                            result["x_data"] = x_data[:len(y_data)].tolist()
                        else:
                            # Pad x_data if necessary
                            padded_x = np.pad(x_data, (0, len(y_data) - len(x_data)), 'edge')
                            result["x_data"] = padded_x.tolist()
                    else:
                        # Use indices as x values
                        result["x_data"] = list(range(start_idx, start_idx + y_data.size * stride, stride))[:y_data.size]
                
                elif ndims == 3:
                    # 3D data: extract a line along specified axis with slices for other dimensions
                    
                    # Parse slices from query params
                    slice_indices = {}
                    if slices:
                        for key, value in slices.items():
                            try:
                                axis = int(key)
                                if 0 <= axis < ndims and axis != x_axis:
                                    slice_indices[axis] = int(value)
                            except (ValueError, TypeError):
                                logger.warning(f"Invalid slice specification: {key}={value}")
                    
                    # Set default slice indices for dimensions not specified
                    for axis in range(ndims):
                        if axis != x_axis and axis not in slice_indices:
                            slice_indices[axis] = shape[axis] // 2  # Default to middle slice
                    
                    # Create the slice tuple
                    slice_tuple = [0] * ndims
                    for axis in range(ndims):
                        if axis == x_axis:
                            slice_tuple[axis] = slice(start_idx, end_idx, stride)
                        else:
                            slice_tuple[axis] = slice_indices.get(axis, 0)
                    
                    logger.info(f"Using slice tuple: {slice_tuple}")
                    
                    # Extract the data
                    y_data = np.squeeze(data[tuple(slice_tuple)])
                    
                    # Apply point limit if specified
                    if num_points and y_data.size > num_points:
                        # Calculate new stride
                        new_stride = max(1, y_data.size // num_points)
                        y_data = y_data[::new_stride]
                    
                    result["y_data"] = y_data.tolist()
                    
                    # Use custom X data or generate indices
                    if x_data is not None:
                        # Ensure x_data matches y_data in length
                        if len(x_data) >= len(y_data):
                            result["x_data"] = x_data[:len(y_data)].tolist()
                        else:
                            # Pad x_data if necessary
                            padded_x = np.pad(x_data, (0, len(y_data) - len(x_data)), 'edge')
                            result["x_data"] = padded_x.tolist()
                    else:
                        # Use indices as x values
                        result["x_data"] = list(range(start_idx, start_idx + y_data.size * stride, stride))[:y_data.size]
                
                else:
                    # Higher dimensional data: similar approach to 3D but generalized
                    slice_tuple = [0] * ndims
                    for axis in range(ndims):
                        if axis == x_axis:
                            slice_tuple[axis] = slice(start_idx, end_idx, stride)
                        else:
                            # Use middle index by default
                            slice_tuple[axis] = shape[axis] // 2
                    
                    # Extract the data
                    y_data = np.squeeze(data[tuple(slice_tuple)])
                    
                    # Apply point limit if specified
                    if num_points and y_data.size > num_points:
                        new_stride = max(1, y_data.size // num_points)
                        y_data = y_data[::new_stride]
                    
                    result["y_data"] = y_data.tolist()
                    
                    # Use custom X data or generate indices
                    if x_data is not None:
                        # Ensure x_data matches y_data in length
                        if len(x_data) >= len(y_data):
                            result["x_data"] = x_data[:len(y_data)].tolist()
                        else:
                            # Pad x_data if necessary
                            padded_x = np.pad(x_data, (0, len(y_data) - len(x_data)), 'edge')
                            result["x_data"] = padded_x.tolist()
                    else:
                        # Use indices as x values
                        result["x_data"] = list(range(start_idx, start_idx + y_data.size * stride, stride))[:y_data.size]
            else:
                # Simple scalar data
                result["y_data"] = [float(data) if isinstance(data, (int, float, np.number)) else data]
                result["x_data"] = [0]
            
            # Add metadata for the frontend
            result["datasetInfo"] = {
                "path": path,
                "shape": shape if isinstance(data, np.ndarray) else None,
                "ndims": ndims if isinstance(data, np.ndarray) else 0,
                "dtype": str(dataset.dtype),
                "plotAxis": x_axis,
                "sliceIndices": slices if slices else {}
            }
            
            # Use custom encoder to handle numpy types
            json_data = json.loads(json.dumps({"data": result}, cls=NumpyEncoder))
            
        logger.info(f"Successfully read dataset")
        return json_data
    
    except Exception as e:
        logger.error(f"Error in read_dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dataset_info")
def get_dataset_info(file: str, path: str):
    """Get detailed information about a specific dataset including shape, dimensions, etc."""
    try:
        if not os.path.exists(file):
            raise HTTPException(status_code=404, detail=f"File not found: {file}")
        
        with h5py.File(file, 'r') as f:
            if path not in f:
                raise HTTPException(status_code=404, detail=f"Dataset path not found: {path}")
                
            dataset = f[path]
            if not isinstance(dataset, h5py.Dataset):
                raise HTTPException(status_code=400, detail=f"Path does not refer to a dataset: {path}")
            
            # Get basic info
            shape = list(dataset.shape) if dataset.shape else []
            ndims = len(shape)
            
            # Get sample data for each axis
            axis_samples = {}
            if ndims > 0:
                for axis in range(ndims):
                    # Get a sample of values along this axis
                    slices = [0] * ndims
                    slices[axis] = slice(0, min(10, shape[axis]))
                    samples = dataset[tuple(slices)]
                    if isinstance(samples, np.ndarray) and samples.ndim > 1:
                        # Reduce other dimensions to first element
                        for i in range(samples.ndim - 1):
                            samples = samples[0]
                    axis_samples[f"axis_{axis}"] = samples.tolist() if isinstance(samples, np.ndarray) else [samples]
            
            info = {
                "path": path,
                "shape": shape,
                "ndims": ndims,
                "size": dataset.size,
                "dtype": str(dataset.dtype),
                "chunks": dataset.chunks,
                "compression": dataset.compression,
                "axis_samples": axis_samples
            }
            
            return JSONResponse(content=json.loads(json.dumps(info, cls=NumpyEncoder)))
    
    except Exception as e:
        logger.error(f"Error getting dataset info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dataset_preview")
def get_dataset_preview(
    file: str, 
    path: str,
    max_items: Optional[int] = Query(10, description="Maximum number of items to preview")
):
    """Get a preview of the dataset content, limited to a small sample."""
    try:
        if not os.path.exists(file):
            raise HTTPException(status_code=404, detail=f"File not found: {file}")
        
        with h5py.File(file, 'r') as f:
            if path not in f:
                raise HTTPException(status_code=404, detail=f"Dataset path not found: {path}")
                
            dataset = f[path]
            if not isinstance(dataset, h5py.Dataset):
                raise HTTPException(status_code=400, detail=f"Path does not refer to a dataset: {path}")
            
            # Get a preview of the data
            preview = None
            if dataset.shape == ():
                # Scalar dataset
                preview = dataset[()]
            elif dataset.size <= max_items:
                # Small dataset, return all
                preview = dataset[()].tolist() if isinstance(dataset[()], np.ndarray) else dataset[()]
            else:
                # Larger dataset, return a sample
                if len(dataset.shape) == 1:
                    # 1D data
                    step = max(1, dataset.shape[0] // max_items)
                    preview = dataset[0:dataset.shape[0]:step][:max_items].tolist()
                else:
                    # Multi-dimensional data
                    # Take first elements in each dimension except the last
                    slices = [0] * len(dataset.shape)
                    slices[-1] = slice(0, min(max_items, dataset.shape[-1]))
                    try:
                        sample = dataset[tuple(slices)]
                        # Simplify if possible
                        if isinstance(sample, np.ndarray):
                            preview = sample.tolist()
                        else:
                            preview = sample
                    except Exception as ex:
                        logger.error(f"Error sampling dataset: {ex}")
                        # Fallback: just get the first max_items elements
                        flat_data = dataset[()].flatten()
                        preview = flat_data[:max_items].tolist()
            
            return JSONResponse(content=json.loads(json.dumps(
                {"preview": preview, "total_size": dataset.size}, 
                cls=NumpyEncoder
            )))
    
    except Exception as e:
        logger.error(f"Error getting dataset preview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/heatmap_data")
def get_heatmap_data(
    file: str,
    path: str,
    x_axis: Optional[int] = Query(0, description="X axis for the heatmap"),
    y_axis: Optional[int] = Query(1, description="Y axis for the heatmap"),
    slices_str: Optional[str] = Query(None, description="Slice indices for dimensions beyond x and y as JSON string"),
    max_size: Optional[int] = Query(1000000, description="Maximum number of elements to return to prevent memory issues")
):
    """Get 2D data specifically formatted for heatmap visualization."""
    try:
        logger.info(f"Reading heatmap dataset from file: {file}, path: {path}")
        logger.info(f"Parameters: x_axis={x_axis}, y_axis={y_axis}, slices_str={slices_str}")
        
        if not os.path.exists(file):
            raise HTTPException(status_code=404, detail=f"File not found: {file}")
        
        # Parse slices from string if provided
        slices = {}
        if slices_str:
            try:
                slices = json.loads(slices_str)
            except json.JSONDecodeError:
                logger.warning(f"Invalid slices JSON string: {slices_str}")
        
        with h5py.File(file, 'r') as f:
            if path not in f:
                raise HTTPException(status_code=404, detail=f"Dataset path not found: {path}")
            
            dataset = f[path]
            
            # Validate dimensions
            if not isinstance(dataset, h5py.Dataset):
                raise HTTPException(status_code=400, detail=f"Path does not refer to a dataset: {path}")
            
            shape = list(dataset.shape)
            ndims = len(shape)
            
            if ndims < 2:
                raise HTTPException(status_code=400, detail=f"Dataset must have at least 2 dimensions for heatmap, found {ndims}")
            
            if x_axis >= ndims or y_axis >= ndims:
                raise HTTPException(status_code=400, detail=f"Axis indices out of bounds: x_axis={x_axis}, y_axis={y_axis}, ndims={ndims}")
            
            if x_axis == y_axis:
                raise HTTPException(status_code=400, detail=f"X and Y axes must be different")
            
            # Check if data size is manageable
            x_size = shape[x_axis]
            y_size = shape[y_axis]
            total_elements = x_size * y_size
            
            if total_elements > max_size:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Dataset too large for heatmap: {x_size}x{y_size}={total_elements} elements. Max allowed: {max_size}"
                )
            
            # Create slice specification for dataset
            slice_spec = [0] * ndims
            
            # For each dimension, decide how to slice:
            # - For x_axis and y_axis, take all values
            # - For other dimensions, use provided slice or middle value
            for dim in range(ndims):
                if dim == x_axis or dim == y_axis:
                    slice_spec[dim] = slice(None)  # Take all values
                else:
                    # Use provided slice or default to middle of dimension
                    if str(dim) in slices:
                        slice_spec[dim] = int(slices[str(dim)])
                    else:
                        slice_spec[dim] = shape[dim] // 2
            
            # Read the data with our slice specification
            data = dataset[tuple(slice_spec)]
            
            # The data may not be in the expected x,y order, so we need to transpose it correctly
            # Determine which dimensions in the result correspond to x and y
            # This mapping depends on how numpy handles slicing with both full slices (slice(None)) and single indices
            axis_order = []
            for dim in range(ndims):
                if dim == x_axis or dim == y_axis:
                    axis_order.append(dim)
            
            # If we need to transpose, ensure x_axis comes first in our output
            if len(axis_order) == 2:
                if axis_order[0] == y_axis:
                    # Transpose needed - x should be first dimension in heatmap
                    data = np.transpose(data)
            
            # Create the result dict with the data and axis information
            result = {
                "heatmap_data": data.tolist() if isinstance(data, np.ndarray) else data,
                "x_axis": {
                    "index": x_axis,
                    "size": shape[x_axis],
                    "values": list(range(shape[x_axis]))  # Default to indices
                },
                "y_axis": {
                    "index": y_axis,
                    "size": shape[y_axis],
                    "values": list(range(shape[y_axis]))  # Default to indices
                },
                "slices": slices,
                "dataset_info": {
                    "path": path,
                    "shape": shape,
                    "ndims": ndims,
                    "dtype": str(dataset.dtype)
                }
            }
            
            logger.info(f"Successfully read heatmap data with shape: {data.shape if hasattr(data, 'shape') else 'scalar'}")
            return JSONResponse(content=json.loads(json.dumps(result, cls=NumpyEncoder)))
    
    except Exception as e:
        logger.error(f"Error in get_heatmap_data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/slice_1d")
def get_slice_1d(
    file: str,
    path: str,
    direction: str = Query(..., description="Slice direction: 'row' or 'column'"),
    index: int = Query(..., description="Index of the row or column to extract")
):
    """Get a 1D slice (row or column) from a 2D dataset."""
    try:
        logger.info(f"Extracting 1D slice from file: {file}, path: {path}, direction: {direction}, index: {index}")
        
        if not os.path.exists(file):
            raise HTTPException(status_code=404, detail=f"File not found: {file}")
        
        with h5py.File(file, 'r') as f:
            if path not in f:
                raise HTTPException(status_code=404, detail=f"Dataset path not found: {path}")
            
            dataset = f[path]
            
            # Validate dimensions
            if not isinstance(dataset, h5py.Dataset):
                raise HTTPException(status_code=400, detail=f"Path does not refer to a dataset: {path}")
            
            shape = list(dataset.shape)
            
            if len(shape) != 2:
                raise HTTPException(status_code=400, detail=f"Dataset must be 2D for slicing, found shape: {shape}")
            
            # Extract the slice based on direction
            if direction == 'row':
                if index >= shape[0]:
                    raise HTTPException(status_code=400, detail=f"Row index {index} out of bounds (max: {shape[0]-1})")
                
                # Extract the row
                slice_data = dataset[index, :]
                
                # Generate x values (column indices)
                x_data = list(range(shape[1]))
            
            elif direction == 'column':
                if index >= shape[1]:
                    raise HTTPException(status_code=400, detail=f"Column index {index} out of bounds (max: {shape[1]-1})")
                
                # Extract the column
                slice_data = dataset[:, index]
                
                # Generate x values (row indices)
                x_data = list(range(shape[0]))
            
            else:
                raise HTTPException(status_code=400, detail=f"Invalid slice direction. Must be 'row' or 'column'")
            
            # Prepare response
            result = {
                "data": {
                    "x_data": x_data,
                    "y_data": slice_data.tolist() if isinstance(slice_data, np.ndarray) else slice_data,
                    "datasetInfo": {
                        "path": path,
                        "shape": shape,
                        "direction": direction,
                        "index": index
                    }
                }
            }
            
            logger.info(f"Successfully extracted 1D slice with {len(x_data)} points")
            return JSONResponse(content=json.loads(json.dumps(result, cls=NumpyEncoder)))
    
    except Exception as e:
        logger.error(f"Error in get_slice_1d: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


