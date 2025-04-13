import React from 'react';
import { Box, Typography, Alert, Paper } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface StatusBarProps {
  status: {
    message: string;
    type: 'info' | 'error' | 'success';
  } | null;
  datasetInfo?: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ status, datasetInfo }) => {
  return (
    <Paper
      square
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #e0e0e0',
        zIndex: 1000,
        height: '34px'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {status && (
          <>
            {status.type === 'info' && <InfoIcon sx={{ mr: 1, color: '#1976d2', fontSize: 20 }} />}
            {status.type === 'error' && <ErrorIcon sx={{ mr: 1, color: '#d32f2f', fontSize: 20 }} />}
            {status.type === 'success' && <CheckCircleIcon sx={{ mr: 1, color: '#2e7d32', fontSize: 20 }} />}
            <Typography 
              variant="body2" 
              sx={{ 
                color: status.type === 'error' ? '#d32f2f' : 
                      status.type === 'success' ? '#2e7d32' : 
                      '#1976d2' 
              }}
            >
              {status.message}
            </Typography>
          </>
        )}
      </Box>
      
      {datasetInfo && (
        <Typography variant="body2" color="text.secondary">
          {datasetInfo}
        </Typography>
      )}
    </Paper>
  );
};

export default StatusBar;