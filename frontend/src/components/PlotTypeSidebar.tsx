import React from 'react';
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
  const handleTabChange = (tab: 'heatmap' | 'series1d') => {
    onTabChange(tab);
  };

  return (
    <div className="govuk-grid-column-full">
      <div className="govuk-tabs" data-module="govuk-tabs">
        <ul className="govuk-tabs__list">
          <li className={`govuk-tabs__list-item ${activeTab === 'heatmap' ? 'govuk-tabs__list-item--selected' : ''}`}>
            <a 
              className="govuk-tabs__tab" 
              href="#heatmap"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange('heatmap');
              }}
            >
              <span className="govuk-!-margin-right-1">
                <GridOnIcon fontSize="small" />
              </span>
              Heatmap
            </a>
          </li>
          <li className={`govuk-tabs__list-item ${activeTab === 'series1d' ? 'govuk-tabs__list-item--selected' : ''}`}>
            <a 
              className="govuk-tabs__tab" 
              href="#series1d"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange('series1d');
              }}
            >
              <span className="govuk-!-margin-right-1">
                <ShowChartIcon fontSize="small" />
              </span>
              1D Series
            </a>
          </li>
        </ul>

        <div className="govuk-tabs__panel" id="heatmap" 
          style={{ display: activeTab === 'heatmap' ? 'block' : 'none' }}>
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

        <div className="govuk-tabs__panel" id="series1d" 
          style={{ display: activeTab === 'series1d' ? 'block' : 'none' }}>
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