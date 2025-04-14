import React, { useState } from 'react';
import GridOnIcon from '@mui/icons-material/GridOn';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DatasetList from './DatasetList';
import { Dataset, HDF5File } from '../types';

interface PlotTypeSidebarProps {
  activeTab: 'heatmap' | 'series1d';
  onTabChange: (tab: 'heatmap' | 'series1d') => void;
  file: HDF5File | null;
  datasets: Record<string, Dataset> | null;
  onSelectDataset: (dataset: Dataset) => void;
  filterDimensions?: number;
}

const PlotTypeSidebar: React.FC<PlotTypeSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  file, 
  datasets, 
  onSelectDataset,
  filterDimensions
}) => {
  const [hoveredTab, setHoveredTab] = useState<'heatmap' | 'series1d' | null>(null);

  const handleTabChange = (tab: 'heatmap' | 'series1d') => {
    onTabChange(tab);
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <div 
          style={{ 
            display: 'flex',
            marginBottom: '20px',
            borderBottom: '2px solid #1d70b8'
          }}
        >
          <button 
            className={`govuk-button ${activeTab === 'heatmap' ? 'govuk-button--secondary' : ''}`}
            onClick={() => handleTabChange('heatmap')}
            onMouseEnter={() => setHoveredTab('heatmap')}
            onMouseLeave={() => setHoveredTab(null)}
            style={{ 
              margin: 0,
              fontWeight: activeTab === 'heatmap' ? 'bold' : 'normal',
              borderRadius: '0',
              borderBottom: activeTab === 'heatmap' ? '4px solid #1d70b8' : 'none',
              backgroundColor: activeTab === 'heatmap' 
                ? '#ffffff' 
                : (hoveredTab === 'heatmap' ? '#ffdd00' : '#f3f2f1'),
              border: 'none',
              color: '#0b0c0c',
              outline: hoveredTab === 'heatmap' && activeTab !== 'heatmap' 
                ? '2px solid #0b0c0c' 
                : 'none',
              outlineOffset: '-2px',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
              width: '50%',
              height: '60px', // Set fixed height to make it square
              textAlign: 'center'
            }}
          >
            <GridOnIcon style={{ marginBottom: '5px' }} />
            <span>Heatmap</span>
          </button>
          
          <button 
            className={`govuk-button ${activeTab === 'series1d' ? 'govuk-button--secondary' : ''}`}
            onClick={() => handleTabChange('series1d')}
            onMouseEnter={() => setHoveredTab('series1d')}
            onMouseLeave={() => setHoveredTab(null)}
            style={{ 
              margin: 0,
              fontWeight: activeTab === 'series1d' ? 'bold' : 'normal',
              borderRadius: '0',
              borderBottom: activeTab === 'series1d' ? '4px solid #1d70b8' : 'none',
              backgroundColor: activeTab === 'series1d' 
                ? '#ffffff' 
                : (hoveredTab === 'series1d' ? '#ffdd00' : '#f3f2f1'),
              border: 'none',
              color: '#0b0c0c',
              outline: hoveredTab === 'series1d' && activeTab !== 'series1d' 
                ? '2px solid #0b0c0c' 
                : 'none',
              outlineOffset: '-2px',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
              width: '50%',
              height: '60px', // Set fixed height to make it square
              textAlign: 'center'
            }}
          >
            <ShowChartIcon style={{ marginBottom: '5px' }} />
            <span>1D Series</span>
          </button>
        </div>

        <div style={{ display: activeTab === 'heatmap' ? 'block' : 'none' }}>
          <h2 className="govuk-heading-s">Select a 2D+ dataset</h2>
          <div className="govuk-!-margin-bottom-6">
            <DatasetList 
              datasets={datasets} 
              onSelectDataset={onSelectDataset} 
              filterDimensions={filterDimensions}
              selectedDataset={null}
            />
          </div>
        </div>

        <div style={{ display: activeTab === 'series1d' ? 'block' : 'none' }}>
          <h2 className="govuk-heading-s">Select a dataset</h2>
          <div className="govuk-!-margin-bottom-6">
            <DatasetList 
              datasets={datasets} 
              onSelectDataset={onSelectDataset} 
              filterDimensions={undefined}
              selectedDataset={null}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlotTypeSidebar;