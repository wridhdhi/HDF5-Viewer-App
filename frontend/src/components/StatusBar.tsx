import React from 'react';
import { Box, Typography } from '@mui/material';
import { StatusMessage } from '../types';

interface StatusBarProps {
  status: StatusMessage | null;
  datasetInfo: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ status, datasetInfo }) => {
  const getStatusClass = () => {
    if (!status) return '';
    
    switch (status.type) {
      case 'error':
        return 'govuk-error-message';
      case 'success':
        return 'govuk-success-message';
      default:
        return 'govuk-body-s';
    }
  };
  
  return (
    <footer 
      className="govuk-footer" 
      role="contentinfo"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f3f2f1',
        borderTop: '4px solid #1d70b8', // Blue border above statusbar
        padding: '3px 0',
        zIndex: 100,
        width: '100%',
        height: '24px', // Reduced height even more
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '0 15px', 
        width: '100%',
        maxHeight: '20px',
        overflow: 'hidden'
      }}>
        <div className={getStatusClass()} style={{ 
          fontFamily: '"GDS Transport", Arial, sans-serif',
          fontSize: '12px', // Reduced font size
          fontWeight: 400,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '30%' // Reduced to make room for copyright text
        }}>
          {status?.message || ''}
        </div>
        <div style={{ 
          fontFamily: '"GDS Transport", Arial, sans-serif',
          fontSize: '12px', // Reduced font size
          fontWeight: 600, // Bold font
          color: '#505a5f', // Grey color
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
          flex: 1,
          opacity: 0.5
        }}>
          Designed by Wridhdhisom Karar |  Quantum Circuits Group ©
        </div>
        <div style={{ 
          fontFamily: '"GDS Transport", Arial, sans-serif',
          fontSize: '12px', // Reduced font size
          fontWeight: 400,
          color: '#505a5f',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '30%' // Reduced to make room for copyright text
        }}>
          {datasetInfo || ''}
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;