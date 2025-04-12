import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import DatasetList from '../components/DatasetList';
import HeatmapPlot from '../components/HeatmapPlot';
import Series1DPlot from '../components/Series1DPlot';
import { Dataset, HDF5File } from '../types';

const HomePage: React.FC = () => {
  const [file, setFile] = useState<HDF5File | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'series1d'>('heatmap');

  const handleFileUploaded = (uploadedFile: HDF5File) => {
    setFile(uploadedFile);
    setSelectedDataset(null);
  };

  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    // No longer auto-switching tabs based on dimensionality
  };

  return (
    <div className="home-page">
      <h1>HDF5 Data Viewer</h1>
      
      <div className="app-container">
        <div className="sidebar">
          <FileUploader onFileUploaded={handleFileUploaded} />
          
          {/* First show tab selection */}
          <div className="plot-type-selector">
            <h2>Select Plot Type</h2>
            <div className="plot-type-buttons">
              <button 
                className={`plot-type-button ${activeTab === 'heatmap' ? 'active' : ''}`}
                onClick={() => setActiveTab('heatmap')}
              >
                Heatmap Plot
              </button>
              <button 
                className={`plot-type-button ${activeTab === 'series1d' ? 'active' : ''}`}
                onClick={() => setActiveTab('series1d')}
              >
                1D Series Plot
              </button>
            </div>
          </div>
          
          {/* Then show dataset selection */}
          {file && (
            <DatasetList 
              datasets={file.structure} 
              onSelectDataset={handleSelectDataset}
              // Only filter datasets based on tab type if actively viewing a plot
              filterDimensions={activeTab === 'heatmap' ? 2 : undefined}
            />
          )}
        </div>
        
        <div className="main-content">
          {file ? (
            <div className="tab-content">
              {activeTab === 'heatmap' && (
                selectedDataset && selectedDataset.shape && selectedDataset.shape.length >= 2 ? (
                  <HeatmapPlot 
                    filePath={file.path} 
                    dataset={selectedDataset}
                    allDatasets={file.structure}
                  />
                ) : (
                  <div className="no-dataset-selected">
                    <h2>No 2D+ Dataset Selected</h2>
                    <p>
                      Select a multi-dimensional dataset (2D or higher) from the list to visualize it as a heatmap.
                    </p>
                  </div>
                )
              )}
              
              {activeTab === 'series1d' && (
                <Series1DPlot
                  filePath={file.path}
                  allDatasets={file.structure}
                  selectedDataset={selectedDataset}
                />
              )}
            </div>
          ) : (
            <div className="no-file-selected">
              <h2>No File Uploaded</h2>
              <p>
                Upload an HDF5 file to begin visualizing its contents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;