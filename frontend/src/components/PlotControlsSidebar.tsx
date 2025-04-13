import React from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Divider
} from '@mui/material';

interface PlotControlsSidebarProps {
  activeTab: 'heatmap' | 'series1d';
  children: React.ReactNode;
}

const PlotControlsSidebar: React.FC<PlotControlsSidebarProps> = ({ activeTab, children }) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6">
          {activeTab === 'heatmap' ? 'Heatmap Controls' : '1D Series Controls'}
        </Typography>
      </Box>
      
      <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
        {children || (
          <Typography color="text.secondary">
            Select a dataset to configure plot options
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// Material UI styled Accordion for plot controls
export const ControlAccordion: React.FC<{
  title: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultExpanded = false, children }) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1.5,
          backgroundColor: '#f5f5f5',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid #e0e0e0' : 'none'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {icon && <Box sx={{ mr: 1.5 }}>{icon}</Box>}
        <Typography variant="subtitle1" fontWeight="medium">
          {title}
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          {expanded ? '−' : '+'}
        </Box>
      </Box>
      
      {expanded && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </Paper>
  );
};

export default PlotControlsSidebar;