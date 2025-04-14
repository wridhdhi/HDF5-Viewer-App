import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { 
  Box, 
  Typography, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  TextField, 
  Slider, 
  Button, 
  IconButton, 
  CircularProgress,
  Paper,
  styled,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent
} from '@mui/material';

// Material-UI icon imports
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import TuneIcon from '@mui/icons-material/Tune';
import SettingsIcon from '@mui/icons-material/Settings';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';

import { ControlAccordion, PlotImprovements, PlotImprovementsSettings, defaultPlotImprovements } from './PlotControlsSidebar';
import { Dataset, PlotType, Series1DSettings, StatusMessage } from '../types';

const ColorInput = styled('input')({
  width: '100%',
  padding: '4px',
  border: '1px solid #b1b4b6',
  borderRadius: '4px'
});

const ActionButton = styled(Button)(({ theme }) => ({
  marginTop: '8px',
  marginBottom: '8px',
  textTransform: 'none',
}));

const SliderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: '8px',
  marginBottom: '8px'
}));

const SliderLabel = styled(Typography)(({ theme }) => ({
  width: '100px',
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

interface Series1DPlotProps {
  filePath: string;
  allDatasets: Record<string, Dataset>;
  selectedDataset: Dataset | null;
  controlsOnly?: boolean;
  setStatus?: (status: StatusMessage | null) => void;
  // New props for shared state
  seriesSettings?: Series1DSettings[];
  setSeriesSettings?: (settings: Series1DSettings[]) => void;
  showNDimOptions?: boolean;
  sliceAxis?: number;
  setSliceAxis?: (axis: number) => void;
  sliceSettings?: Record<string, number>;
  setSliceSettings?: (settings: Record<string, number>) => void;
  plotImprovements?: PlotImprovementsSettings;
  setPlotImprovements?: (settings: PlotImprovementsSettings) => void;
  // Renamed parameters to match HomePage
  seriesPlotImprovements?: PlotImprovementsSettings;
  setSeriesPlotImprovements?: (settings: PlotImprovementsSettings) => void;
}

// Helper function to calculate statistics for a data array
const calculateStatistics = (data: number[]) => {
  if (!data || data.length === 0) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const sum = data.reduce((acc, val) => acc + val, 0);
  const mean = sum / data.length;
  
  // Calculate standard deviation
  const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    min,
    max,
    mean,
    stdDev,
    count: data.length
  };
};

const Series1DPlot: React.FC<Series1DPlotProps> = ({ 
  filePath, 
  allDatasets, 
  selectedDataset,
  controlsOnly = false,
  setStatus,
  // External state props
  seriesSettings: externalSeriesSettings,
  setSeriesSettings: setExternalSeriesSettings,
  showNDimOptions: externalShowNDimOptions,
  sliceAxis: externalSliceAxis,
  setSliceAxis: setExternalSliceAxis,
  sliceSettings: externalSliceSettings,
  setSliceSettings: setExternalSliceSettings,
  plotImprovements: externalPlotImprovements,
  setPlotImprovements: setExternalPlotImprovements,
  seriesPlotImprovements: externalSeriesPlotImprovements,
  setSeriesPlotImprovements: externalSetSeriesPlotImprovements
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  
  // Internal state to use if external state is not provided
  const [internalSeriesSettings, setInternalSeriesSettings] = useState<Series1DSettings[]>([]);
  const [internalShowNDimOptions, setInternalShowNDimOptions] = useState(false);
  const [internalSliceAxis, setInternalSliceAxis] = useState<number>(0);
  const [internalSliceMaxDimension, setSliceMaxDimension] = useState<number>(0);
  const [internalSliceSettings, setInternalSliceSettings] = useState<Record<string, number>>({});
  const [internalPlotImprovements, setInternalPlotImprovements] = useState<PlotImprovementsSettings>(defaultPlotImprovements);
  const [plotData, setPlotData] = useState<any[]>([]);

  // Use external state if provided, otherwise use internal state
  const seriesSettings = externalSeriesSettings || internalSeriesSettings;
  const setSeriesSettings = setExternalSeriesSettings || setInternalSeriesSettings;
  const showNDimOptions = externalShowNDimOptions !== undefined ? externalShowNDimOptions : internalShowNDimOptions;
  const sliceAxis = externalSliceAxis !== undefined ? externalSliceAxis : internalSliceAxis;
  const setSliceAxis = setExternalSliceAxis || setInternalSliceAxis;
  const sliceSettings = externalSliceSettings || internalSliceSettings;
  const setSliceSettings = setExternalSliceSettings || setInternalSliceSettings;
  
  // Prioritize seriesPlotImprovements from HomePage over others
  const plotImprovements = externalSeriesPlotImprovements || externalPlotImprovements || internalPlotImprovements;
  const setPlotImprovements = externalSetSeriesPlotImprovements || setExternalPlotImprovements || setInternalPlotImprovements;

  // Available plot types
  const plotTypes: PlotType[] = ['scatter', 'line', 'line+marker'];
  
  // Available colors for series
  const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ];

  // Check if we have a multi-dimensional dataset selected
  useEffect(() => {
    if (!selectedDataset) {
      if (!externalShowNDimOptions) {
        setInternalShowNDimOptions(false);
      }
      return;
    }

    // Check if dataset has more than 1 dimension
    if (selectedDataset.shape && selectedDataset.shape.length > 1) {
      if (!externalShowNDimOptions) {
        setInternalShowNDimOptions(true);
      }
      
      // Initialize slice settings for each dimension
      if (!externalSliceSettings) {
        const newSliceSettings: Record<string, number> = {};
        for (let i = 0; i < selectedDataset.shape.length; i++) {
          if (i !== sliceAxis) {
            newSliceSettings[i.toString()] = Math.floor(selectedDataset.shape[i] / 2);
          }
        }
        setInternalSliceSettings(newSliceSettings);
      }
      
      // Set max dimension for the current slice axis
      if (selectedDataset.shape[sliceAxis]) {
        setSliceMaxDimension(selectedDataset.shape[sliceAxis] - 1);
      }
    } else {
      if (!externalShowNDimOptions) {
        setInternalShowNDimOptions(false);
      }
    }
  }, [selectedDataset, sliceAxis, externalShowNDimOptions, externalSliceSettings]);

  // Filter datasets to show only 1D datasets
  useEffect(() => {
    if (!allDatasets) return;

    const oneDimDatasets = Object.values(allDatasets).filter(d => 
      d.type === 'dataset' && 
      d.shape && 
      ((d.shape.length === 1) || 
       (d.shape.length === 2 && (d.shape[0] === 1 || d.shape[1] === 1)))
    );
    
    setAvailableDatasets(oneDimDatasets);
  }, [allDatasets]);

  // Handle slice axis selection change
  const handleSliceAxisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const axis = parseInt(e.target.value);
    setSliceAxis(axis);
    
    if (selectedDataset?.shape && selectedDataset.shape.length > axis) {
      // Update max dimension for the new axis
      setSliceMaxDimension(selectedDataset.shape[axis] - 1);
    }
  };

  // Add a new series to plot
  const addSeries = () => {
    if (availableDatasets.length === 0) return;
    
    const newSeries: Series1DSettings = {
      seriesPath: availableDatasets[0].path,
      xDataset: '',
      plotType: 'line',
      color: colors[seriesSettings.length % colors.length],
      name: `Series ${seriesSettings.length + 1}`
    };
    
    setSeriesSettings([...seriesSettings, newSeries]);
    
    if (setStatus) {
      setStatus({
        message: 'Added new series',
        type: 'info'
      });
    }
  };

  // Add the selected N-dimensional dataset slice
  const addNDimSlice = () => {
    if (!selectedDataset || !selectedDataset.shape) return;
    
    // Create slice settings for all dimensions except the slice axis
    const slicesForBackend: Record<string, number> = {};
    for (let i = 0; i < selectedDataset.shape.length; i++) {
      if (i !== sliceAxis) {
        slicesForBackend[i.toString()] = sliceSettings[i.toString()] || 0;
      }
    }
    
    const sliceLabel = `${selectedDataset.path} (Axis ${sliceAxis} slice)`;
    
    const newSeries: Series1DSettings = {
      seriesPath: selectedDataset.path,
      xDataset: '',
      plotType: 'line',
      color: colors[seriesSettings.length % colors.length],
      name: sliceLabel,
      // Adding metadata for slicing
      isNDimSlice: true,
      sliceAxis,
      slicesForOtherDimensions: slicesForBackend
    };
    
    setSeriesSettings([...seriesSettings, newSeries]);
    
    if (setStatus) {
      setStatus({
        message: `Added slice from ${selectedDataset.path}`,
        type: 'info'
      });
    }
  };

  // Remove a series from the plot
  const removeSeries = (index: number) => {
    const newSettings = [...seriesSettings];
    newSettings.splice(index, 1);
    setSeriesSettings(newSettings);
    
    if (setStatus) {
      setStatus({
        message: 'Removed series',
        type: 'info'
      });
    }
  };

  // Update series settings
  const updateSeriesSetting = (index: number, key: keyof Series1DSettings, value: string) => {
    const newSettings = [...seriesSettings];
    newSettings[index] = {
      ...newSettings[index],
      [key]: value
    };
    setSeriesSettings(newSettings);
  };

  // Update slice settings for other dimensions
  const handleOtherDimensionSliceChange = (dimension: string, value: number) => {
    setSliceSettings(prev => ({
      ...prev,
      [dimension]: value
    }));
  };

  // Fetch data for all series
  useEffect(() => {
    if (seriesSettings.length === 0 || !filePath || controlsOnly) return;
    
    const fetchAllSeriesData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const plotDataArray = [];
        
        for (const series of seriesSettings) {
          // Different handling for different types of data sources
          let seriesData;
          
          if (series.isNDimSlice) {
            // This is a N-dimensional dataset slice
            const sliceAxis = series.sliceAxis;
            const slices = series.slicesForOtherDimensions;
            
            // Convert slices to JSON string
            const slicesStr = JSON.stringify(slices);
            
            // Fetch data along the specified axis with slices for other dimensions
            const response = await fetch(
              `http://localhost:8000/dataset?file=${encodeURIComponent(filePath)}&path=${encodeURIComponent(series.seriesPath)}&x_axis=${sliceAxis}&slices_str=${encodeURIComponent(slicesStr)}`
            );
            
            if (!response.ok) {
              throw new Error(`Failed to fetch dataset slice: ${response.statusText}`);
            }
            
            seriesData = await response.json();
          } 
          else {
            // Regular 1D dataset
            const response = await fetch(
              `http://localhost:8000/dataset?file=${encodeURIComponent(filePath)}&path=${encodeURIComponent(series.seriesPath)}`
            );
            
            if (!response.ok) {
              throw new Error(`Failed to fetch dataset: ${response.statusText}`);
            }
            
            seriesData = await response.json();
          }
          
          // X values - either from a specified dataset or use indices
          let xValues;
          
          if (series.xDataset) {
            // Use custom X dataset
            const xResponse = await fetch(
              `http://localhost:8000/dataset?file=${encodeURIComponent(filePath)}&path=${encodeURIComponent(series.xDataset)}`
            );
            
            if (xResponse.ok) {
              const xData = await xResponse.json();
              xValues = xData.data.y_data;
            } else {
              // Fallback to indices if X dataset fetch fails
              xValues = seriesData.data.x_data;
            }
          } else {
            // Use default indices from the data
            xValues = seriesData.data.x_data;
          }
          
          // Construct Plotly data object based on plot type
          const plotObject: any = {
            x: xValues,
            y: seriesData.data.y_data,
            type: series.plotType === 'line+marker' ? 'scatter' : series.plotType,
            name: series.name,
            line: { color: series.color }
          };
          
          // Add markers for scatter or line+marker
          if (series.plotType === 'scatter' || series.plotType === 'line+marker') {
            plotObject.mode = series.plotType === 'scatter' ? 'markers' : 'lines+markers';
            plotObject.marker = { color: series.color };
          } else {
            plotObject.mode = 'lines';
          }
          
          plotDataArray.push(plotObject);
        }
        
        setPlotData(plotDataArray);
        
        if (setStatus) {
          setStatus({
            message: 'Series data loaded successfully',
            type: 'success'
          });
        }
      } catch (err) {
        console.error('Error fetching series data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load series data';
        setError(errorMessage);
        
        if (setStatus) {
          setStatus({
            message: errorMessage,
            type: 'error'
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllSeriesData();
  }, [seriesSettings, filePath, controlsOnly]);

  // Render controls for the sidebar
  if (controlsOnly) {
    return (
      <Box sx={{ mb: 2 }}>
        {/* Controls for N-dimensional dataset slicing */}
        {showNDimOptions && selectedDataset && (
          <ControlAccordion 
            title="Extract 1D Slice" 
            icon={<ViewStreamIcon sx={{ color: '#1d70b8' }} />}
            defaultExpanded={true}
          >
            <Typography variant="body2" gutterBottom>
              Extract a 1D slice from {selectedDataset.path}
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel id="slice-axis-label">Extract along axis</InputLabel>
              <Select
                labelId="slice-axis-label"
                value={sliceAxis}
                label="Extract along axis"
                onChange={(e) => setSliceAxis(Number(e.target.value))}
                size="small"
              >
                {selectedDataset.shape?.map((size, idx) => (
                  <MenuItem key={idx} value={idx}>
                    Axis {idx} (size: {size})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
              Set values for other dimensions:
            </Typography>
            
            {selectedDataset.shape?.map((size, idx) => {
              // Only show controls for dimensions other than the slice axis
              if (idx !== sliceAxis) {
                return (
                  <Box key={`dim-${idx}`} sx={{ mb: 2 }}>
                    <SliderContainer>
                      <SliderLabel>
                        Dimension {idx}:
                      </SliderLabel>
                      <Slider
                        size="small"
                        min={0}
                        max={size - 1}
                        value={sliceSettings[idx.toString()] || 0}
                        onChange={(_, value) => handleOtherDimensionSliceChange(idx.toString(), value as number)}
                        sx={{ mx: 1, flex: 1 }}
                      />
                      <SliderValue>
                        {sliceSettings[idx.toString()] || 0}
                      </SliderValue>
                    </SliderContainer>
                  </Box>
                );
              }
              return null;
            })}
            
            <ActionButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addNDimSlice}
              fullWidth
              sx={{ 
                backgroundColor: '#1d70b8',
                '&:hover': {
                  backgroundColor: '#003078'
                }
              }}
            >
              Add Slice to Plot
            </ActionButton>
          </ControlAccordion>
        )}
        
        {/* Controls for adding and configuring 1D series */}
        <ControlAccordion 
          title="Series Settings" 
          icon={<ShowChartIcon sx={{ color: '#1d70b8' }} />}
          defaultExpanded={!showNDimOptions}
        >
          <Typography variant="body2" gutterBottom>
            Add and configure 1D data series
          </Typography>
          
          <ActionButton
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addSeries}
            fullWidth
            sx={{ mb: 3 }}
          >
            Add Dataset Series
          </ActionButton>
          
          {seriesSettings.map((series, idx) => (
            <Paper 
              key={`series-${idx}`} 
              elevation={0}
              sx={{ 
                mb: 3, 
                p: 2, 
                border: '1px solid #b1b4b6',
                position: 'relative'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Series {idx + 1}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => removeSeries(idx)}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id={`dataset-select-${idx}`}>Dataset</InputLabel>
                <Select
                  labelId={`dataset-select-${idx}`}
                  size="small"
                  value={series.seriesPath}
                  label="Dataset"
                  onChange={(e) => updateSeriesSetting(idx, 'seriesPath', e.target.value as string)}
                >
                  {availableDatasets.map(d => (
                    <MenuItem key={d.path} value={d.path}>
                      {d.path} {d.shape ? `[${d.shape.join(', ')}]` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id={`x-values-select-${idx}`}>X Values (Optional)</InputLabel>
                <Select
                  labelId={`x-values-select-${idx}`}
                  size="small"
                  value={series.xDataset}
                  label="X Values (Optional)"
                  onChange={(e) => updateSeriesSetting(idx, 'xDataset', e.target.value as string)}
                >
                  <MenuItem value="">Default (indices)</MenuItem>
                  {availableDatasets.map(d => (
                    <MenuItem key={d.path} value={d.path}>
                      {d.path} {d.shape ? `[${d.shape.join(', ')}]` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id={`plot-type-select-${idx}`}>Plot Type</InputLabel>
                <Select
                  labelId={`plot-type-select-${idx}`}
                  size="small"
                  value={series.plotType}
                  label="Plot Type"
                  onChange={(e) => updateSeriesSetting(idx, 'plotType', e.target.value as PlotType)}
                >
                  {plotTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" gutterBottom>
                    Color
                  </Typography>
                  <ColorInput
                    type="color"
                    value={series.color}
                    onChange={(e) => updateSeriesSetting(idx, 'color', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <TextField
                      label="Name"
                      size="small"
                      value={series.name}
                      onChange={(e) => updateSeriesSetting(idx, 'name', e.target.value)}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          ))}
          
          {seriesSettings.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              No series added yet. Use the buttons above to add data.
            </Typography>
          )}
        </ControlAccordion>
        
        {/* Plot Improvements Accordion */}
        <ControlAccordion 
          title="Plot Improvements" 
          icon={<FormatPaintIcon />}
          defaultExpanded={false}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customize plot appearance and improve visual presentation.
          </Typography>
          
          <PlotImprovements 
            settings={plotImprovements}
            onSettingsChange={(newSettings) => {
              setPlotImprovements(newSettings);
            }}
          />
        </ControlAccordion>
      </Box>
    );
  }

  // Render the main plot area
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {loading ? (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress />
          <Typography>Loading series data...</Typography>
        </Box>
      ) : error ? (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%'
        }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid #d32f2f',
              borderRadius: '4px',
              backgroundColor: '#fdeded',
              textAlign: 'center',
              width: '80%'
            }}
          >
            <Typography color="error" variant="h6" gutterBottom>
              Error
            </Typography>
            <Typography>{error}</Typography>
          </Paper>
        </Box>
      ) : plotData.length > 0 ? (
        <Box 
          sx={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Stats Panel - Optional, can be hidden if screen space is limited */}
          {plotData.map((series, idx) => {
            const stats = calculateStatistics(series.y);
            if (!stats) return null;
            
            return (
              <Card key={`stats-${idx}`} sx={{ mb: 2, maxWidth: 350, display: 'none' }}>
                <CardContent>
                  <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                    Series Statistics
                  </Typography>
                  <Typography variant="h6" component="div" sx={{ mb: 1.5 }}>
                    {series.name}
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2">Min: {stats.min.toFixed(4)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">Max: {stats.max.toFixed(4)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">Mean: {stats.mean.toFixed(4)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">Std Dev: {stats.stdDev.toFixed(4)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2">Data Points: {stats.count}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            );
          })}
          
          <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            <Plot
              data={plotData}
              layout={{
                title: {
                  text: plotImprovements?.titleText || '1D Series Plot',
                  font: {
                    family: plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                    size: plotImprovements?.fontSize || 24
                  }
                },
                autosize: true,
                margin: { 
                  l: 50, 
                  r: 50, 
                  t: 60, 
                  b: 80  // Increased bottom margin to ensure x-label is visible above status bar
                },
                xaxis: {
                  title: {
                    text: plotImprovements?.xAxisLabel || 'X Axis',
                    font: {
                      family: plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                      size: plotImprovements?.fontSize || 16
                    },
                    standoff: 20  // Add standoff to ensure better spacing for the x-axis title
                  },
                  showgrid: true,
                  zeroline: true,
                  tickfont: {
                    family: plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                    size: plotImprovements?.tickSize || 12
                  },
                  ticks: 'inside',
                  tickwidth: plotImprovements?.tickThickness || 1,
                  ticksuffix: '  ',  // Add space after tick labels
                  tickprefix: '  '   // Add space before tick labels
                },
                yaxis: {
                  title: {
                    text: plotImprovements?.yAxisLabel || 'Y Axis',
                    font: {
                      family: plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                      size: plotImprovements?.fontSize || 16
                    },
                    standoff: 20  // Add standoff to ensure better spacing for the x-axis title
                  },
                  showgrid: true,
                  zeroline: true,
                  tickfont: {
                    family: plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                    size: plotImprovements?.tickSize || 12
                  },
                  ticks: 'inside',
                  tickwidth: plotImprovements?.tickThickness || 1,
                  ticksuffix: '  ',  // Add space after tick labels
                  tickprefix: '  '   // Add space before tick labels
                },
                legend: {
                  font: {
                    family: plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                    size: plotImprovements?.legendSize || 12
                  },
                  x: plotImprovements?.legendPosition?.includes('right') ? 1 : 0,
                  y: plotImprovements?.legendPosition?.includes('top') ? 1 : 0,
                  xanchor: plotImprovements?.legendPosition?.includes('right') ? 'right' : 'left',
                  yanchor: plotImprovements?.legendPosition?.includes('top') ? 'top' : 'bottom',
                  bordercolor: 'rgba(0,0,0,0.3)',
                  borderwidth: 1,
                  bgcolor: 'rgba(255,255,255,0.9)'
                },
                ...(plotImprovements?.showBorder && {
                  plot_bgcolor: 'white',
                  paper_bgcolor: 'white',
                  shapes: [
                    {
                      type: 'rect',
                      xref: 'paper',
                      yref: 'paper',
                      x0: 0,
                      y0: 0,
                      x1: 1,
                      y1: 1,
                      line: {
                        color: 'black',
                        width: 2
                      },
                      fillcolor: 'rgba(0,0,0,0)'
                    }
                  ]
                })
              }}
              config={{
                responsive: true,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'series_plot',
                  scale: 2
                },
                displayModeBar: true,
                displaylogo: false,
                scrollZoom: true
              }}
              style={{ 
                width: '100%', 
                height: 'calc(100% - 28px)', // Adjust height to account for status bar (24px height + 4px border)
                position: 'absolute',
                top: 0,
                left: 0
              }}
              useResizeHandler={true}
            />
          </Box>
        </Box>
      ) : (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            px: 4,
            textAlign: 'center'
          }}
        >
          {showNDimOptions ? (
            <>
              <Typography variant="h6" gutterBottom>
                N-Dimensional Dataset Selected
              </Typography>
              <Typography>
                Use the controls in the left sidebar to extract a 1D slice from the selected dataset
                and add it to the plot.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                No Series Added
              </Typography>
              <Typography>
                Use the controls in the left sidebar to add datasets or slices to create a plot.
              </Typography>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Series1DPlot;