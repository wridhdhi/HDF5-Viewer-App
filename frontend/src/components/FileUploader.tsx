import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadFile } from '../services/api';
import { HDF5File } from '../types';

interface FileUploaderProps {
  onFileUploaded: (file: HDF5File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUploaded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.h5') && !file.name.endsWith('.hdf5')) {
      setError('Please upload a valid HDF5 file (.h5 or .hdf5)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await uploadFile(file);

      const datasets: Record<string, any> = {};

      // Process the structure and add path to each dataset
      Object.entries(response.structure).forEach(([path, dataset]) => {
        datasets[path] = {
          ...dataset,
          path
        };
      });

      onFileUploaded({
        path: response.path,
        structure: datasets
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e);
      // Reset file input
      setFileInputKey(prevKey => prevKey + 1);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Create a synthetic event to pass to the handleFileUpload handler
      const syntheticEvent = {
        target: {
          files: e.dataTransfer.files
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      handleFileUpload(syntheticEvent);
      setFileInputKey(prevKey => prevKey + 1);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Upload HDF5 File</Typography>
      
      <Paper
        elevation={0}
        sx={{
          border: dragActive ? '2px dashed #1976d2' : '2px dashed #bbbbbb',
          borderRadius: 1,
          p: 4,
          textAlign: 'center',
          backgroundColor: dragActive ? '#f0f7ff' : '#fafafa',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <CloudUploadIcon 
          sx={{ 
            fontSize: 48, 
            color: dragActive ? '#1976d2' : '#757575',
            mb: 2
          }} 
        />

        <Typography variant="body1" sx={{ mb: 1 }}>
          Drag and drop your HDF5 file here, or
          <Box
            component="label"
            htmlFor="file-uploader-input"
            sx={{ 
              color: '#1976d2',
              cursor: 'pointer',
              fontWeight: 'medium',
              ml: 0.5,
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            browse to upload
          </Box>
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Accepted file types: .h5, .hdf5
        </Typography>

        <input
          className="visually-hidden"
          id="file-uploader-input"
          type="file"
          accept=".h5,.hdf5"
          key={fileInputKey}
          onChange={handleFileInputChange}
          disabled={loading}
        />
      </Paper>
      
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography>Uploading file... This may take a moment for large files.</Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileUploader;