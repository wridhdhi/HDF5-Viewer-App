import React from 'react';
import { 
  Box,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SaveAltIcon from '@mui/icons-material/SaveAlt';

interface AppNavbarProps {
  title?: string;
  onFileUpload?: () => void;
  onSavePlot?: () => void;
}

const AppNavbar: React.FC<AppNavbarProps> = ({ 
  title = "HDF5 Viewer", 
  onFileUpload,
  onSavePlot
}) => {
  return (
    <header className="govuk-header" role="banner" data-module="govuk-header">
      <div className="govuk-header__container govuk-width-container">
        <div className="govuk-header__logo">
          <a href="#" className="govuk-header__link govuk-header__link--homepage">
            <span className="govuk-header__logotype">
              <span className="govuk-header__logotype-text">
                
              </span>
            </span>
            <span className="govuk-header__product-name">
              {title}
            </span>
          </a>
        </div>
        <div className="govuk-header__content">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Tooltip title="Upload HDF5 File">
              <Button
                color="inherit"
                startIcon={<UploadFileIcon />}
                onClick={onFileUpload}
                sx={{ 
                  mr: 1,
                  textTransform: 'none',
                  fontWeight: 'normal',
                  color: '#fff'
                }}
                className="govuk-button govuk-button--secondary"
              >
                Upload File
              </Button>
            </Tooltip>
            
            <Tooltip title="Save Plot as PNG">
              <IconButton 
                color="inherit"
                onClick={onSavePlot}
                disabled={!onSavePlot}
                sx={{ color: '#fff', ml: 1 }}
              >
                <SaveAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings">
              <IconButton 
                color="inherit"
                sx={{ color: '#fff', ml: 1 }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Help">
              <IconButton 
                color="inherit"
                sx={{ color: '#fff', ml: 1 }}
              >
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="About">
              <IconButton 
                color="inherit"
                sx={{ color: '#fff', ml: 1 }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="View on GitHub">
              <IconButton 
                color="inherit"
                component="a" 
                href="https://github.com/yourusername/Hd5_heatmap" 
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#fff', ml: 1 }}
              >
                <GitHubIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;