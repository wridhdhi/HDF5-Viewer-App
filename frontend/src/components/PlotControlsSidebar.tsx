import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  TextField, 
  Slider, 
  FormControlLabel, 
  Switch, 
  Grid 
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import { styled } from '@mui/system';

interface PlotControlsSidebarProps {
  activeTab: 'heatmap' | 'series1d';
  children: React.ReactNode;
}

// Define interface for PlotImprovements settings
export interface PlotImprovementsSettings {
  titleText: string;
  xAxisLabel: string;
  yAxisLabel: string;
  fontSize: number;
  tickSize: number;
  tickThickness: number;
  legendSize: number;
  legendPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showBorder: boolean;
  useLatexFonts: boolean;
}

// Default settings for plot improvements
export const defaultPlotImprovements: PlotImprovementsSettings = {
  titleText: '',
  xAxisLabel: '',
  yAxisLabel: '',
  fontSize: 14,
  tickSize: 12,
  tickThickness: 1,
  legendSize: 12,
  legendPosition: 'top-right',
  showBorder: false,
  useLatexFonts: true
};

// Styled slider container similar to what's used in other components
const SliderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: '8px',
  marginBottom: '8px'
}));

const SliderLabel = styled(Typography)(({ theme }) => ({
  width: '120px',
  fontSize: '14px'
}));

const SliderValue = styled(Typography)(({ theme }) => ({
  width: '40px',
  textAlign: 'center',
  marginLeft: '8px',
  fontSize: '14px',
  fontFamily: 'monospace',
  backgroundColor: '#f3f2f1',
  padding: '2px 4px',
  borderRadius: '4px'
}));

// Plot Improvements component
export const PlotImprovements: React.FC<{
  settings: PlotImprovementsSettings;
  onSettingsChange: (settings: PlotImprovementsSettings) => void;
}> = ({ settings, onSettingsChange }) => {
  
  const handleChange = (key: keyof PlotImprovementsSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <Box sx={{ mt: 1 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <TextField
          label="Plot Title"
          size="small"
          value={settings.titleText}
          onChange={(e) => handleChange('titleText', e.target.value)}
          placeholder="Enter custom plot title"
        />
      </FormControl>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <TextField
              label="X-Axis Label"
              size="small"
              value={settings.xAxisLabel}
              onChange={(e) => handleChange('xAxisLabel', e.target.value)}
              placeholder="X Axis"
            />
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <TextField
              label="Y-Axis Label"
              size="small"
              value={settings.yAxisLabel}
              onChange={(e) => handleChange('yAxisLabel', e.target.value)}
              placeholder="Y Axis"
            />
          </FormControl>
        </Grid>
      </Grid>

      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
        Font & Size Settings
      </Typography>

      <SliderContainer>
        <SliderLabel>Text Font Size:</SliderLabel>
        <Slider
          size="small"
          min={8}
          max={24}
          step={1}
          value={settings.fontSize}
          onChange={(_, value) => handleChange('fontSize', value as number)}
          sx={{ mx: 1, flex: 1 }}
        />
        <SliderValue>{settings.fontSize}px</SliderValue>
      </SliderContainer>

      <SliderContainer>
        <SliderLabel>Tick Size:</SliderLabel>
        <Slider
          size="small"
          min={8}
          max={20}
          step={1}
          value={settings.tickSize}
          onChange={(_, value) => handleChange('tickSize', value as number)}
          sx={{ mx: 1, flex: 1 }}
        />
        <SliderValue>{settings.tickSize}px</SliderValue>
      </SliderContainer>

      <SliderContainer>
        <SliderLabel>Tick Thickness:</SliderLabel>
        <Slider
          size="small"
          min={0.5}
          max={3}
          step={0.5}
          value={settings.tickThickness}
          onChange={(_, value) => handleChange('tickThickness', value as number)}
          sx={{ mx: 1, flex: 1 }}
        />
        <SliderValue>{settings.tickThickness}</SliderValue>
      </SliderContainer>

      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
        Legend Settings
      </Typography>

      <SliderContainer>
        <SliderLabel>Legend Font Size:</SliderLabel>
        <Slider
          size="small"
          min={8}
          max={20}
          step={1}
          value={settings.legendSize}
          onChange={(_, value) => handleChange('legendSize', value as number)}
          sx={{ mx: 1, flex: 1 }}
        />
        <SliderValue>{settings.legendSize}px</SliderValue>
      </SliderContainer>

      <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
        <InputLabel id="legend-position-label">Legend Position</InputLabel>
        <Select
          labelId="legend-position-label"
          size="small"
          value={settings.legendPosition}
          label="Legend Position"
          onChange={(e) => handleChange('legendPosition', e.target.value)}
        >
          <MenuItem value="top-left">Top Left</MenuItem>
          <MenuItem value="top-right">Top Right</MenuItem>
          <MenuItem value="bottom-left">Bottom Left</MenuItem>
          <MenuItem value="bottom-right">Bottom Right</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
        Appearance
      </Typography>

      <Box sx={{ mt: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.showBorder}
              onChange={(e) => handleChange('showBorder', e.target.checked)}
              size="small"
            />
          }
          label="Show Border around Plot"
        />
      </Box>

      <Box sx={{ mt: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.useLatexFonts}
              onChange={(e) => handleChange('useLatexFonts', e.target.checked)}
              size="small"
            />
          }
          label="Use LaTeX-style Fonts"
        />
      </Box>
    </Box>
  );
};

const PlotControlsSidebar: React.FC<PlotControlsSidebarProps> = ({ activeTab, children }) => {
  return (
    <div className="govuk-width-container" style={{ padding: 0 }}>
      <div className="govuk-heading-m" style={{ marginTop: 0 }}>
        {activeTab === 'heatmap' ? 'Heatmap Controls' : '1D Series Controls'}
      </div>
      
      <div className="govuk-!-padding-bottom-6">
        {children || (
          <p className="govuk-body">
            Select a dataset to configure plot options
          </p>
        )}
      </div>
    </div>
  );
};

// GOV.UK styled Accordion for plot controls with enhanced styling
export const ControlAccordion: React.FC<{
  title: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultExpanded = false, children }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isHovered, setIsHovered] = useState(false);
  const accordionId = `accordion-${title.replace(/\s+/g, '-').toLowerCase()}`;

  // Initialize GOV.UK Frontend JS if available when component is mounted
  useEffect(() => {
    if (window.GOVUKFrontend && window.GOVUKFrontend.Accordion) {
      try {
        const accordionElement = document.getElementById(accordionId);
        if (accordionElement) {
          // Try to initialize GOV.UK accordion
          new window.GOVUKFrontend.Accordion(accordionElement);
        }
      } catch (error) {
        console.warn('Could not initialize GOV.UK Frontend JS for accordion', error);
      }
    }
  }, [accordionId]);

  return (
    <div 
      className="govuk-accordion" 
      id={accordionId} 
      style={{
        marginBottom: '15px',
        marginTop: 0, // Remove top margin
        border: isHovered ? '2px solid #0b0c0c' : '1px solid #b1b4b6',
        borderRadius: '4px',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`govuk-accordion__section ${expanded ? 'govuk-accordion__section--expanded' : ''}`}
        style={{
          backgroundColor: expanded ? '#f8f8f8' : 'transparent',
          margin: 0, // Remove any margin
          padding: 0, // Remove any padding
        }}
      >
        <div 
          className="govuk-accordion__section-header" 
          style={{
            backgroundColor: isHovered ? '#ffdd00' : (expanded ? '#f3f2f1' : 'transparent'),
            borderBottom: expanded ? '1px solid #b1b4b6' : 'none',
            transition: 'background-color 0.2s ease',
            margin: 0, // Remove any margin
            padding: 0, // Remove any padding
          }}
        >
          <h2 className="govuk-accordion__section-heading" style={{ margin: 0 }}>
            <span 
              className="govuk-accordion__section-button" 
              id={`${accordionId}-heading`}
              onClick={() => setExpanded(!expanded)}
              style={{ 
                cursor: 'pointer',
                padding: '10px 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                fontWeight: 'bold',
                textDecoration: 'none',
                color: '#0b0c0c',
                position: 'relative',
                margin: 0, // Remove any margin
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {icon && <span style={{ marginRight: '10px' }}>{icon}</span>}
                {title}
              </span>
              {expanded ? 
                <KeyboardArrowUpIcon fontSize="small" /> : 
                <KeyboardArrowDownIcon fontSize="small" />
              }
            </span>
          </h2>
        </div>
        
        <div 
          id={`${accordionId}-content`} 
          className="govuk-accordion__section-content"
          aria-labelledby={`${accordionId}-heading`}
          style={{
            padding: '15px',
            display: expanded ? 'block' : 'none',
            borderTop: expanded ? '1px solid #b1b4b6' : 'none',
            margin: 0, // Remove any margin
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PlotControlsSidebar;