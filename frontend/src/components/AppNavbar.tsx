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
    <header 
      className="govuk-header" 
      role="banner" 
      data-module="govuk-header"
      style={{ 
        width: '100%', 
        backgroundColor: '#ffdd00', // GOV.UK yellow
        borderBottom: '4px solid #1d70b8', // Strong blue border
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: '60px', // Fixed height
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{ 
        width: '100%', 
        padding: '0 20px', 
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%'
      }}>
        {/* Left section - Logo/Title */}
        <div style={{ 
          paddingRight: '15px', 
          display: 'flex', 
          alignItems: 'center',
          width: '300px'
        }}>
          <a href="#" 
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span style={{ 
              color: '#0b0c0c', 
              fontWeight: 'bold',
              fontSize: '1.5rem',
              fontFamily: '"GDS Transport", Arial, sans-serif',
            }}>
              {title}
            </span>
          </a>
        </div>

        {/* Center section - Main action buttons */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flex: 1
        }}>
          <Tooltip title="Upload HDF5 File">
            <Button
              color="inherit"
              startIcon={<UploadFileIcon />}
              onClick={onFileUpload}
              sx={{ 
                mx: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                color: '#ffffff',
                backgroundColor: '#00703c', // GOV.UK green
                '&:hover': {
                  backgroundColor: '#005a30'
                },
                padding: '8px 15px',
                borderRadius: '4px'
              }}
              className="govuk-button govuk-button--secondary"
            >
              Upload File
            </Button>
          </Tooltip>
          
          <Tooltip title="Save Plot as PNG">
            <Button
              color="inherit"
              startIcon={<SaveAltIcon />}
              onClick={onSavePlot}
              disabled={!onSavePlot}
              sx={{ 
                mx: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                color: '#ffffff',
                backgroundColor: onSavePlot ? '#1d70b8' : '#b1b4b6', // GOV.UK blue or grey if disabled
                '&:hover': {
                  backgroundColor: onSavePlot ? '#003078' : '#b1b4b6'
                },
                padding: '8px 15px',
                borderRadius: '4px'
              }}
              className="govuk-button"
            >
              Save Plot
            </Button>
          </Tooltip>
        </Box>
        
        {/* Right section - Utility icons */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end',
          width: '300px'
        }}>
          <Tooltip title="Settings">
            <IconButton 
              color="inherit"
              size="small"
              sx={{ 
                color: '#0b0c0c', 
                ml: 1,
                '&:hover': {
                  backgroundColor: 'rgba(11, 12, 12, 0.1)'
                }
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Help">
            <IconButton 
              color="inherit"
              size="small"
              sx={{ 
                color: '#0b0c0c', 
                ml: 1,
                '&:hover': {
                  backgroundColor: 'rgba(11, 12, 12, 0.1)'
                }
              }}
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="About">
            <IconButton 
              color="inherit"
              size="small"
              sx={{ 
                color: '#0b0c0c', 
                ml: 1,
                '&:hover': {
                  backgroundColor: 'rgba(11, 12, 12, 0.1)'
                }
              }}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="View on GitHub">
            <IconButton 
              color="inherit"
              size="small"
              component="a" 
              href="https://github.com/yourusername/Hd5_heatmap" 
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: '#0b0c0c', 
                ml: 1,
                '&:hover': {
                  backgroundColor: 'rgba(11, 12, 12, 0.1)'
                }
              }}
            >
              <GitHubIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </div>
    </header>
  );
};

export default AppNavbar;