import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  ListItemIcon,
  Paper,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import FolderIcon from '@mui/icons-material/Folder';
import { Dataset } from '../types';

interface DatasetListProps {
  datasets: Record<string, Dataset> | null;
  onSelectDataset: (dataset: Dataset) => void;
  filterDimensions?: number;
  selectedDataset: Dataset | null;
}

const DatasetList: React.FC<DatasetListProps> = ({ 
  datasets, 
  onSelectDataset, 
  filterDimensions,
  selectedDataset
}) => {
  if (!datasets) {
    return (
      <Box sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
        <Typography variant="body2">
          No file loaded. Please upload an HDF5 file.
        </Typography>
      </Box>
    );
  }

  const filteredDatasets = Object.values(datasets).filter(dataset => {
    if (filterDimensions === undefined) {
      return true;
    }
    return dataset.shape && dataset.shape.length >= filterDimensions;
  });

  if (filteredDatasets.length === 0) {
    return (
      <Box sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
        <Typography variant="body2">
          No suitable datasets found in this file.
          {filterDimensions && (
            <span> Looking for datasets with {filterDimensions}+ dimensions.</span>
          )}
        </Typography>
      </Box>
    );
  }

  // Group datasets by their parent groups for better organization
  const groupedDatasets: { [key: string]: Dataset[] } = {};
  filteredDatasets.forEach(dataset => {
    const pathParts = dataset.path.split('/');
    // Skip the empty first part from the split
    const groupPath = pathParts.slice(0, -1).join('/') || '/';
    
    if (!groupedDatasets[groupPath]) {
      groupedDatasets[groupPath] = [];
    }
    groupedDatasets[groupPath].push(dataset);
  });

  const isSelected = (dataset: Dataset) => {
    return selectedDataset && selectedDataset.path === dataset.path;
  };

  return (
    <List dense disablePadding sx={{ width: '100%' }}>
      {Object.entries(groupedDatasets).map(([groupPath, datasets], index) => (
        <React.Fragment key={groupPath}>
          {index > 0 && <Divider sx={{ my: 1 }} />}
          
          <ListItem dense disablePadding>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <FolderIcon color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary={groupPath === '/' ? 'Root' : groupPath}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: 'medium',
                color: 'primary'
              }}
            />
          </ListItem>
          
          {datasets.map(dataset => (
            <ListItemButton
              key={dataset.path}
              selected={isSelected(dataset)}
              onClick={() => onSelectDataset(dataset)}
              dense
              sx={{ 
                pl: 4,
                borderRadius: 1,
                my: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <TableChartIcon fontSize="small" 
                  sx={{ 
                    color: isSelected(dataset) ? 'primary.contrastText' : 'inherit'
                  }} 
                />
              </ListItemIcon>
              <ListItemText
                primary={dataset.path.split('/').pop()}
                secondary={
                  <Box component="span" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {dataset.shape && (
                      <Chip 
                        label={`${dataset.shape.join(' × ')}`}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          height: 20,
                          '& .MuiChip-label': { 
                            px: 1,
                            fontSize: '0.675rem',
                            color: isSelected(dataset) ? 'primary.contrastText' : 'text.secondary'
                          },
                          borderColor: isSelected(dataset) ? 'primary.contrastText' : 'divider'
                        }}
                      />
                    )}
                    {dataset.dtype && (
                      <Chip 
                        label={dataset.dtype}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          height: 20,
                          '& .MuiChip-label': { 
                            px: 1,
                            fontSize: '0.675rem',
                            color: isSelected(dataset) ? 'primary.contrastText' : 'text.secondary'
                          },
                          borderColor: isSelected(dataset) ? 'primary.contrastText' : 'divider'
                        }}
                      />
                    )}
                  </Box>
                }
                primaryTypographyProps={{
                  variant: 'body2',
                  sx: { 
                    fontWeight: isSelected(dataset) ? 'medium' : 'regular',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
                secondaryTypographyProps={{
                  variant: 'body2',
                  sx: { mt: 0.5 }
                }}
              />
            </ListItemButton>
          ))}
        </React.Fragment>
      ))}
    </List>
  );
};

export default DatasetList;