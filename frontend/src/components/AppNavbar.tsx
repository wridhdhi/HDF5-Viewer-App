import React from 'react';
import { 
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoDevIcon from '@mui/icons-material/LogoDev';
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
    <AppBar 
      position="static" 
      color="primary" 
      elevation={0}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`
      }}
    >
      <Toolbar sx={{ minHeight: '56px !important' }}>
        <LogoDevIcon sx={{ mr: 1.5, fontSize: 24 }} />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            fontWeight: 500,
            fontSize: '1.125rem'
          }}
        >
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Upload HDF5 File">
            <Button
              color="inherit"
              startIcon={<UploadFileIcon />}
              onClick={onFileUpload}
              sx={{ 
                mr: 1,
                textTransform: 'none',
                fontWeight: 'normal',
                borderRadius: '4px'
              }}
            >
              Upload File
            </Button>
          </Tooltip>
          
          <Tooltip title="Save Plot as PNG">
            <IconButton 
              color="inherit" 
              size="small"
              onClick={onSavePlot}
              sx={{ ml: 1 }}
              disabled={!onSavePlot}
            >
              <SaveAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Settings">
            <IconButton 
              color="inherit" 
              size="small"
              sx={{ ml: 1 }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Help">
            <IconButton 
              color="inherit" 
              size="small"
              sx={{ ml: 1 }}
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="About">
            <IconButton 
              color="inherit" 
              size="small"
              sx={{ ml: 1 }}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="View on GitHub">
            <IconButton 
              color="inherit" 
              size="small"
              sx={{ ml: 1 }}
              component="a" 
              href="https://github.com/yourusername/Hd5_heatmap" 
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppNavbar;