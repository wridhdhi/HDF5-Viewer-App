import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Dataset, PlotType, Series1DSettings } from '../types';

interface Series1DPlotProps {
  filePath: string;
  allDatasets: Record<string, Dataset>;
  selectedDataset: Dataset | null;
}

const Series1DPlot: React.FC<Series1DPlotProps> = ({ filePath, allDatasets, selectedDataset }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  const [seriesSettings, setSeriesSettings] = useState<Series1DSettings[]>([]);
  const [plotData, setPlotData] = useState<any[]>([]);
  
  // For n-dimensional dataset slicing
  const [showNDimOptions, setShowNDimOptions] = useState(false);
  const [sliceAxis, setSliceAxis] = useState<number>(0);
  const [sliceIndex, setSliceIndex] = useState<number>(0);
  const [sliceMaxDimension, setSliceMaxDimension] = useState<number>(0);
  const [sliceSettings, setSliceSettings] = useState<Record<string, number>>({});

  // Available plot types
  const plotTypes: PlotType[] = ['scatter', 'line', 'line+marker'];
  
  // Available colors for series
  const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ];

  // Check if we have a multi-dimensional dataset selected
  useEffect(() => {
    if (!selectedDataset) {
      setShowNDimOptions(false);
      return;
    }

    // Check if dataset has more than 1 dimension
    if (selectedDataset.shape && selectedDataset.shape.length > 1) {
      setShowNDimOptions(true);
      
      // Initialize slice settings for each dimension
      const newSliceSettings: Record<string, number> = {};
      for (let i = 0; i < selectedDataset.shape.length; i++) {
        if (i !== sliceAxis) {
          newSliceSettings[i.toString()] = Math.floor(selectedDataset.shape[i] / 2);
        }
      }
      setSliceSettings(newSliceSettings);
      
      // Set max dimension for the current slice axis
      if (selectedDataset.shape[sliceAxis]) {
        setSliceMaxDimension(selectedDataset.shape[sliceAxis] - 1);
      }
      
      // Reset slice index to valid value
      setSliceIndex(0);
    } else {
      setShowNDimOptions(false);
    }
  }, [selectedDataset, sliceAxis]);

  // Filter datasets to show only 1D datasets
  useEffect(() => {
    if (!allDatasets) return;

    const oneDimDatasets = Object.values(allDatasets).filter(d => 
      d.type === 'dataset' && 
      d.shape && 
      ((d.shape.length === 1) || 
       (d.shape.length === 2 && (d.shape[0] === 1 || d.shape[1] === 1)))
    );
    
    setAvailableDatasets(oneDimDatasets);
  }, [allDatasets]);

  // Handle slice axis selection change
  const handleSliceAxisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const axis = parseInt(e.target.value);
    setSliceAxis(axis);
    
    if (selectedDataset?.shape && selectedDataset.shape.length > axis) {
      // Update max dimension for the new axis
      setSliceMaxDimension(selectedDataset.shape[axis] - 1);
      // Reset slice index to valid value
      setSliceIndex(0);
    }
  };

  // Add a new series to plot
  const addSeries = () => {
    if (availableDatasets.length === 0) return;
    
    const newSeries: Series1DSettings = {
      seriesPath: availableDatasets[0].path,
      xDataset: '',
      plotType: 'line',
      color: colors[seriesSettings.length % colors.length],
      name: `Series ${seriesSettings.length + 1}`
    };
    
    setSeriesSettings([...seriesSettings, newSeries]);
  };

  // Add the selected N-dimensional dataset slice
  const addNDimSlice = () => {
    if (!selectedDataset || !selectedDataset.shape) return;
    
    // Create slice settings for all dimensions except the slice axis
    const slicesForBackend: Record<string, number> = {};
    for (let i = 0; i < selectedDataset.shape.length; i++) {
      if (i !== sliceAxis) {
        slicesForBackend[i.toString()] = sliceSettings[i.toString()] || 0;
      }
    }
    
    const sliceLabel = `${selectedDataset.path} (Axis ${sliceAxis} slice)`;
    
    const newSeries: Series1DSettings = {
      seriesPath: selectedDataset.path,
      xDataset: '',
      plotType: 'line',
      color: colors[seriesSettings.length % colors.length],
      name: sliceLabel,
      // Adding metadata for slicing
      isNDimSlice: true,
      sliceAxis,
      slicesForOtherDimensions: slicesForBackend
    } as any;
    
    setSeriesSettings([...seriesSettings, newSeries]);
  };

  // Remove a series from the plot
  const removeSeries = (index: number) => {
    const newSettings = [...seriesSettings];
    newSettings.splice(index, 1);
    setSeriesSettings(newSettings);
  };

  // Update series settings
  const updateSeriesSetting = (index: number, key: keyof Series1DSettings, value: string) => {
    const newSettings = [...seriesSettings];
    newSettings[index] = {
      ...newSettings[index],
      [key]: value
    };
    setSeriesSettings(newSettings);
  };

  // Update slice settings for other dimensions
  const handleOtherDimensionSliceChange = (dimension: string, value: number) => {
    setSliceSettings(prev => ({
      ...prev,
      [dimension]: value
    }));
  };

  // Fetch data for all series
  useEffect(() => {
    if (seriesSettings.length === 0 || !filePath) return;
    
    const fetchAllSeriesData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const plotDataArray = [];
        
        for (const series of seriesSettings) {
          // Different handling for different types of data sources
          let seriesData;
          
          if ((series as any).isNDimSlice) {
            // This is a N-dimensional dataset slice
            const sliceAxis = (series as any).sliceAxis;
            const slices = (series as any).slicesForOtherDimensions;
            
            // Convert slices to JSON string
            const slicesStr = JSON.stringify(slices);
            
            // Fetch data along the specified axis with slices for other dimensions
            const response = await fetch(
              `http://localhost:8000/dataset?file=${encodeURIComponent(filePath)}&path=${encodeURIComponent(series.seriesPath)}&x_axis=${sliceAxis}&slices_str=${encodeURIComponent(slicesStr)}`
            );
            
            if (!response.ok) {
              throw new Error(`Failed to fetch dataset slice: ${response.statusText}`);
            }
            
            seriesData = await response.json();
          } 
          else {
            // Regular 1D dataset
            const response = await fetch(
              `http://localhost:8000/dataset?file=${encodeURIComponent(filePath)}&path=${encodeURIComponent(series.seriesPath)}`
            );
            
            if (!response.ok) {
              throw new Error(`Failed to fetch dataset: ${response.statusText}`);
            }
            
            seriesData = await response.json();
          }
          
          // X values - either from a specified dataset or use indices
          let xValues;
          
          if (series.xDataset) {
            // Use custom X dataset
            const xResponse = await fetch(
              `http://localhost:8000/dataset?file=${encodeURIComponent(filePath)}&path=${encodeURIComponent(series.xDataset)}`
            );
            
            if (xResponse.ok) {
              const xData = await xResponse.json();
              xValues = xData.data.y_data;
            } else {
              // Fallback to indices if X dataset fetch fails
              xValues = seriesData.data.x_data;
            }
          } else {
            // Use default indices from the data
            xValues = seriesData.data.x_data;
          }
          
          // Construct Plotly data object based on plot type
          const plotObject: any = {
            x: xValues,
            y: seriesData.data.y_data,
            type: series.plotType === 'line+marker' ? 'scatter' : series.plotType,
            name: series.name,
            line: { color: series.color }
          };
          
          // Add markers for scatter or line+marker
          if (series.plotType === 'scatter' || series.plotType === 'line+marker') {
            plotObject.mode = series.plotType === 'scatter' ? 'markers' : 'lines+markers';
            plotObject.marker = { color: series.color };
          } else {
            plotObject.mode = 'lines';
          }
          
          plotDataArray.push(plotObject);
        }
        
        setPlotData(plotDataArray);
      } catch (err) {
        console.error('Error fetching series data:', err);
        setError(`Failed to load series data: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllSeriesData();
  }, [seriesSettings, filePath]);

  return (
    <div className="series-plot">
      <h2>1D Series Plot</h2>
      
      <div className="plot-controls">
        {/* Controls for N-dimensional dataset slicing */}
        {showNDimOptions && selectedDataset && (
          <div className="ndim-slice-controls">
            <h3>Plot {selectedDataset.path} as 1D Slice</h3>
            
            <div className="form-group">
              <label>Extract data along axis:</label>
              <select
                value={sliceAxis}
                onChange={handleSliceAxisChange}
              >
                {selectedDataset.shape?.map((size, idx) => (
                  <option key={idx} value={idx}>
                    Axis {idx} (size: {size})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Show slice controls for other dimensions */}
            <div className="other-dimensions">
              <h4>Select values for other dimensions:</h4>
              {selectedDataset.shape?.map((size, idx) => {
                // Only show controls for dimensions other than the slice axis
                if (idx !== sliceAxis) {
                  return (
                    <div key={`dim-${idx}`} className="dimension-slice">
                      <label>Dimension {idx} (size: {size}):</label>
                      <div className="slice-input">
                        <input 
                          type="range"
                          min={0}
                          max={size - 1}
                          value={sliceSettings[idx.toString()] || 0}
                          onChange={(e) => handleOtherDimensionSliceChange(idx.toString(), parseInt(e.target.value))}
                        />
                        <span>{sliceSettings[idx.toString()] || 0}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
            
            <button onClick={addNDimSlice} className="add-ndim-slice-btn">
              Add to Plot
            </button>
          </div>
        )}
        
        <div className="series-controls">
          <h3>Add 1D Dataset Series</h3>
          <button onClick={addSeries} className="add-series-btn">
            Add 1D Dataset
          </button>
          
          {seriesSettings.map((series, idx) => (
            <div key={`series-${idx}`} className="series-config">
              <h4>Series {idx + 1}</h4>
              <div className="series-form">
                <div className="form-group">
                  <label>Dataset:</label>
                  <select
                    value={series.seriesPath}
                    onChange={(e) => updateSeriesSetting(idx, 'seriesPath', e.target.value)}
                  >
                    {availableDatasets.map(d => (
                      <option key={d.path} value={d.path}>
                        {d.path} {d.shape ? `[${d.shape.join(', ')}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>X Values (Optional):</label>
                  <select
                    value={series.xDataset}
                    onChange={(e) => updateSeriesSetting(idx, 'xDataset', e.target.value)}
                  >
                    <option value="">Default (indices)</option>
                    {availableDatasets.map(d => (
                      <option key={d.path} value={d.path}>
                        {d.path} {d.shape ? `[${d.shape.join(', ')}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Plot Type:</label>
                  <select
                    value={series.plotType}
                    onChange={(e) => updateSeriesSetting(idx, 'plotType', e.target.value as PlotType)}
                  >
                    {plotTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Color:</label>
                  <input
                    type="color"
                    value={series.color}
                    onChange={(e) => updateSeriesSetting(idx, 'color', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={series.name}
                    onChange={(e) => updateSeriesSetting(idx, 'name', e.target.value)}
                  />
                </div>
                
                <button onClick={() => removeSeries(idx)} className="remove-series-btn">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {loading && <p>Loading series data...</p>}
      {error && <p className="error">{error}</p>}
      
      {plotData.length > 0 && !loading && (
        <div className="plot-container">
          <Plot
            data={plotData}
            layout={{
              title: '1D Series Plot',
              width: 800,
              height: 600,
              xaxis: {
                title: 'X Axis',
                showgrid: true,
                zeroline: true,
              },
              yaxis: {
                title: 'Y Axis',
                showgrid: true,
                zeroline: true,
              },
              legend: {
                x: 1,
                xanchor: 'right',
                y: 1
              }
            }}
            config={{
              responsive: true,
              displayModeBar: true,
              scrollZoom: true
            }}
          />
        </div>
      )}
      
      {plotData.length === 0 && !loading && !showNDimOptions && (
        <div className="no-data">
          <p>Add datasets or heatmap slices to create a plot</p>
        </div>
      )}
      
      {plotData.length === 0 && !loading && showNDimOptions && (
        <div className="no-data">
          <p>Configure the slice settings for the selected {selectedDataset?.path} dataset and click "Add to Plot"</p>
        </div>
      )}
    </div>
  );
};

export default Series1DPlot;