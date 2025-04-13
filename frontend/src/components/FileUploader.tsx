import React, { useState } from 'react';
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
    <div className="govuk-!-margin-bottom-6">
      <h2 className="govuk-heading-m">Upload HDF5 File</h2>
      
      <div 
        className={`govuk-file-upload__area ${dragActive ? 'govuk-file-upload__area--dragover' : ''}`}
        style={{
          border: dragActive ? '2px dashed #1d70b8' : '2px dashed #b1b4b6',
          padding: '30px',
          textAlign: 'center',
          backgroundColor: dragActive ? '#f3f2f1' : '#ffffff',
          cursor: 'pointer',
          borderRadius: '4px',
          margin: '20px 0'
        }}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="govuk-!-margin-bottom-4">
          <CloudUploadIcon 
            style={{ 
              fontSize: 48, 
              color: dragActive ? '#1d70b8' : '#505a5f',
              marginBottom: '16px'
            }} 
          />

          <p className="govuk-body">
            Drag and drop your HDF5 file here, or
            <label
              htmlFor="file-uploader-input"
              className="govuk-link govuk-!-margin-left-1"
              style={{ cursor: 'pointer' }}
            >
              browse to upload
            </label>
          </p>

          <p className="govuk-body-s govuk-!-margin-bottom-0" style={{ color: '#505a5f' }}>
            Accepted file types: .h5, .hdf5
          </p>
        </div>

        <input
          className="govuk-visually-hidden"
          id="file-uploader-input"
          type="file"
          accept=".h5,.hdf5"
          key={fileInputKey}
          onChange={handleFileInputChange}
          disabled={loading}
        />
      </div>
      
      {loading && (
        <div className="govuk-inset-text">
          <div className="loading-spinner" style={{ marginRight: '10px', display: 'inline-block', verticalAlign: 'middle' }}></div>
          <span className="govuk-body">Uploading file... This may take a moment for large files.</span>
        </div>
      )}
      
      {error && (
        <div className="govuk-error-summary" role="alert" tabIndex={-1}>
          <h2 className="govuk-error-summary__title">There is a problem</h2>
          <div className="govuk-error-summary__body">
            <ul className="govuk-list govuk-error-summary__list">
              <li>{error}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;