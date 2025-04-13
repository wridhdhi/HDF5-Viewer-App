import React from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Divider
} from '@mui/material';
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
  const handleTabChange = (event: React.SyntheticEvent, newValue: 'heatmap' | 'series1d') => {
    onTabChange(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ 
          minHeight: '48px',
          borderBottom: 1, 
          borderColor: 'divider',
          '& .MuiTab-root': {
            minHeight: '48px',
            textTransform: 'none',
            fontSize: '0.875rem'
          }
        }}
      >
        <Tab 
          icon={<GridOnIcon sx={{ fontSize: 20 }} />} 
          iconPosition="start"
          label="Heatmap" 
          value="heatmap"
        />
        <Tab 
          icon={<ShowChartIcon sx={{ fontSize: 20 }} />} 
          iconPosition="start"
          label="1D Series" 
          value="series1d"
        />
      </Tabs>

      <Box sx={{ p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            mb: 2, 
            fontWeight: 500,
            fontSize: '0.875rem',
            color: 'text.primary' 
          }}
        >
          {activeTab === 'heatmap' ? 'Select a 2D+ dataset' : 'Select a dataset'}
        </Typography>
        
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          <DatasetList 
            datasets={datasets} 
            onSelectDataset={onSelectDataset} 
            filterDimensions={filterDimensions}
            selectedDataset={null}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default PlotTypeSidebar;