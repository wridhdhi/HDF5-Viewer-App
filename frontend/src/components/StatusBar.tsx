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
    <footer className="govuk-footer" role="contentinfo">
      <div className="govuk-width-container" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 15px' }}>
        <div className={getStatusClass()}>
          {status?.message || ''}
        </div>
        <div className="govuk-body-s">
          {datasetInfo || ''}
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;