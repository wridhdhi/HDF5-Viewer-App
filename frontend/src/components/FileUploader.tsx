import React, { useState } from 'react';
import { uploadFile } from '../services/api';
import { HDF5File } from '../types';

interface FileUploaderProps {
  onFileUploaded: (file: HDF5File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUploaded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="file-uploader">
      <h2>Upload HDF5 File</h2>
      <input
        type="file"
        accept=".h5,.hdf5"
        onChange={handleFileUpload}
        disabled={loading}
      />
      {loading && <p>Uploading file... This may take a moment for large files.</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default FileUploader;