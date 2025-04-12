import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import DatasetList from '../components/DatasetList';
import HeatmapPlot from '../components/HeatmapPlot';
import { Dataset, HDF5File } from '../types';

const HomePage: React.FC = () => {
  const [file, setFile] = useState<HDF5File | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const handleFileUploaded = (uploadedFile: HDF5File) => {
    setFile(uploadedFile);
    setSelectedDataset(null);
  };

  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
  };

  return (
    <div className="home-page">
      <h1>HDF5 Heatmap Viewer</h1>
      
      <div className="app-container">
        <div className="sidebar">
          <FileUploader onFileUploaded={handleFileUploaded} />
          
          {file && (
            <DatasetList 
              datasets={file.structure} 
              onSelectDataset={handleSelectDataset} 
            />
          )}
        </div>
        
        <div className="main-content">
          {selectedDataset && file ? (
            <HeatmapPlot 
              filePath={file.path} 
              dataset={selectedDataset} 
            />
          ) : (
            <div className="no-dataset-selected">
              <h2>No Dataset Selected</h2>
              <p>
                Upload an HDF5 file and select a dataset from the list to visualize it as a heatmap.
              </p>
              <p>
                Only multi-dimensional datasets (2D or higher) can be visualized as heatmaps.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;