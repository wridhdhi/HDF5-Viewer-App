import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select,
  Slider,
  CircularProgress, 
  Paper,
  styled 
} from '@mui/material';
import GridOnIcon from '@mui/icons-material/GridOn';
import PaletteIcon from '@mui/icons-material/Palette';
import ViewSlider from '@mui/icons-material/ViewStream';
import LabelIcon from '@mui/icons-material/Label';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import { Dataset, PlotSettings, StatusMessage } from '../types';
import { ControlAccordion, PlotImprovements, PlotImprovementsSettings, defaultPlotImprovements } from './PlotControlsSidebar';

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

interface HeatmapPlotProps {
  filePath: string;
  dataset: Dataset;
  allDatasets: Record<string, Dataset>;
  controlsOnly?: boolean;
  setStatus?: (status: StatusMessage | null) => void;
  plotSettings?: PlotSettings;
  setPlotSettings?: (settings: PlotSettings) => void;
}

const HeatmapPlot: React.FC<HeatmapPlotProps> = ({ 
  filePath, 
  dataset, 
  allDatasets, 
  controlsOnly = false,
  setStatus,
  plotSettings: externalSettings,
  setPlotSettings: setExternalSettings
}) => {
  const [internalPlotSettings, setInternalPlotSettings] = useState<PlotSettings>({
    xAxis: 0,
    yAxis: 1,
    slices: {},
    colorscale: 'Viridis',
    xTicksDataset: '',
    yTicksDataset: '',
    plotImprovements: defaultPlotImprovements
  });
  const [plotData, setPlotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compatibleXDatasets, setCompatibleXDatasets] = useState<Dataset[]>([]);
  const [compatibleYDatasets, setCompatibleYDatasets] = useState<Dataset[]>([]);

  const plotSettings = externalSettings || internalPlotSettings;
  const setPlotSettings = setExternalSettings || setInternalPlotSettings;

  const colorscales = [
    'Viridis', 'Plasma', 'Inferno', 'Magma', 'Cividis',
    'Jet', 'Hot', 'Cool', 'Greys', 'YlGnBu', 'RdBu', 'Portland'
  ];

  useEffect(() => {
    if (!dataset || !dataset.shape || !allDatasets) return;

    const xAxisLength = dataset.shape[plotSettings.xAxis];
    const matchingXDatasets = Object.values(allDatasets).filter(d => 
      d.type === 'dataset' && 
      d.shape && 
      ((d.shape.length === 1 && d.shape[0] === xAxisLength) ||
       (d.shape.length === 2 && d.shape[0] === 1 && d.shape[1] === xAxisLength) ||
       (d.shape.length === 2 && d.shape[1] === 1 && d.shape[0] === xAxisLength))
    );
    setCompatibleXDatasets(matchingXDatasets);

    const yAxisLength = dataset.shape[plotSettings.yAxis];
    const matchingYDatasets = Object.values(allDatasets).filter(d => 
      d.type === 'dataset' && 
      d.shape && 
      ((d.shape.length === 1 && d.shape[0] === yAxisLength) ||
       (d.shape.length === 2 && d.shape[0] === 1 && d.shape[1] === yAxisLength) ||
       (d.shape.length === 2 && d.shape[1] === 1 && d.shape[0] === yAxisLength))
    );
    setCompatibleYDatasets(matchingYDatasets);
  }, [dataset, allDatasets, plotSettings.xAxis, plotSettings.yAxis]);

  useEffect(() => {
    if (!dataset || !filePath) return;

    if (dataset.shape && dataset.shape.length > 2) {
      const newSlices: Record<string, number> = {};
      for (let i = 0; i < dataset.shape.length; i++) {
        if (i !== plotSettings.xAxis && i !== plotSettings.yAxis) {
          newSlices[i.toString()] = Math.floor(dataset.shape[i] / 2);
        }
      }
      setPlotSettings(prev => ({ ...prev, slices: newSlices }));
    } else if (dataset.shape && dataset.shape.length === 2) {
      setPlotSettings(prev => ({
        ...prev,
        xAxis: 1,
        yAxis: 0,
      }));
    }
  }, [dataset, filePath]);

  useEffect(() => {
    if (!dataset || !filePath || controlsOnly) return;
    
    fetchDataForHeatmap();
  }, [dataset, filePath, plotSettings, controlsOnly]);

  const generateSpacedTicks = (totalPoints: number, maxTicks: number = 10): number[] => {
    if (totalPoints <= maxTicks) {
      return Array.from({ length: totalPoints }, (_, i) => i);
    }
    
    const step = Math.ceil(totalPoints / maxTicks);
    const ticks: number[] = [];
    
    for (let i = 0; totalPoints; i += step) {
      ticks.push(i);
    }
    
    if (ticks[ticks.length - 1] !== totalPoints - 1) {
      ticks.push(totalPoints - 1);
    }
    
    return ticks;
  };

  const fetchDataForHeatmap = async () => {
    if (!dataset.shape || dataset.shape.length < 2) {
      const errorMsg = 'Dataset must have at least 2 dimensions for heatmap visualization';
      setError(errorMsg);
      setStatus?.({
        message: errorMsg,
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const slicesStr = JSON.stringify(plotSettings.slices);
      let url = `http://localhost:8000/heatmap_data?file=${encodeURIComponent(filePath)}&path=${encodeURIComponent(dataset.path)}&x_axis=${plotSettings.xAxis}&y_axis=${plotSettings.yAxis}&slices_str=${encodeURIComponent(slicesStr)}`;
      
      // Additional parameters for custom tick datasets
      if (plotSettings.xTicksDataset && allDatasets[plotSettings.xTicksDataset]) {
        const xTicksPath = allDatasets[plotSettings.xTicksDataset].path;
        url += `&x_ticks_dataset=${encodeURIComponent(xTicksPath)}`;
      }
      
      if (plotSettings.yTicksDataset && allDatasets[plotSettings.yTicksDataset]) {
        const yTicksPath = allDatasets[plotSettings.yTicksDataset].path;
        url += `&y_ticks_dataset=${encodeURIComponent(yTicksPath)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // The backend now ensures the data is properly oriented with rows as y-axis, columns as x-axis
      const zValues = data.heatmap_data;
      
      // Use custom tick datasets if they were returned or use default indices
      let xValues = data.x_ticks?.values || data.x_axis.values || Array.from({ length: zValues[0].length }, (_, i) => i);
      let yValues = data.y_ticks?.values || data.y_axis.values || Array.from({ length: zValues.length }, (_, i) => i);
      
      const heatmapData = [{
        z: zValues,
        x: xValues,
        y: yValues,
        type: 'heatmap',
        colorscale: plotSettings.colorscale,
        colorbar: {
          title: dataset.path.split('/').pop(),
          thickness: 20,
          len: 0.9
        }
      }];
      
      setPlotData(heatmapData);
      setStatus?.({
        message: 'Heatmap data loaded successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error fetching heatmap data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch heatmap data';
      setError(errorMessage);
      setStatus?.({
        message: `Error fetching heatmap data: ${errorMessage}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAxisSelectionChange = (axis: 'xAxis' | 'yAxis', value: number) => {
    if (value === plotSettings.xAxis || value === plotSettings.yAxis) {
      if (axis === 'xAxis') {
        setPlotSettings(prev => ({
          ...prev,
          xAxis: value,
          yAxis: prev.xAxis,
          slices: {}
        }));
      } else {
        setPlotSettings(prev => ({
          ...prev,
          xAxis: prev.yAxis,
          yAxis: value,
          slices: {}
        }));
      }
    } else {
      setPlotSettings(prev => ({
        ...prev,
        [axis]: value,
        slices: {}
      }));
    }
  };

  const handleSliceChange = (dimension: string, value: number) => {
    setPlotSettings(prev => ({
      ...prev,
      slices: {
        ...prev.slices,
        [dimension]: value
      }
    }));
  };

  const handleColorscaleChange = (value: string) => {
    setPlotSettings(prev => ({
      ...prev,
      colorscale: value
    }));
  };

  const handleTicksDatasetChange = (axis: 'xTicksDataset' | 'yTicksDataset', value: string) => {
    setPlotSettings(prev => ({
      ...prev,
      [axis]: value
    }));
  };

  if (controlsOnly) {
    return (
      <Box sx={{ mb: 2 }}>
        <ControlAccordion 
          title="Axis Configuration" 
          icon={<GridOnIcon />}
          defaultExpanded={true}
        >
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="x-axis-select-label">X Axis (Dimension)</InputLabel>
            <Select
              labelId="x-axis-select-label"
              id="x-axis-select"
              value={plotSettings.xAxis}
              label="X Axis (Dimension)"
              onChange={(e) => handleAxisSelectionChange('xAxis', Number(e.target.value))}
              size="small"
            >
              {dataset.shape && dataset.shape.map((dim, index) => (
                <MenuItem key={`x-${index}`} value={index}>
                  Dimension {index} (Size: {dim})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="y-axis-select-label">Y Axis (Dimension)</InputLabel>
            <Select
              labelId="y-axis-select-label"
              id="y-axis-select"
              value={plotSettings.yAxis}
              label="Y Axis (Dimension)"
              onChange={(e) => handleAxisSelectionChange('yAxis', Number(e.target.value))}
              size="small"
            >
              {dataset.shape && dataset.shape.map((dim, index) => (
                <MenuItem key={`y-${index}`} value={index}>
                  Dimension {index} (Size: {dim})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </ControlAccordion>

        <ControlAccordion 
          title="Color Settings"
          icon={<PaletteIcon />}
          defaultExpanded={true}
        >
          <FormControl fullWidth>
            <InputLabel id="colorscale-select-label">Colorscale</InputLabel>
            <Select
              labelId="colorscale-select-label"
              id="colorscale-select"
              value={plotSettings.colorscale}
              label="Colorscale"
              onChange={(e) => handleColorscaleChange(e.target.value)}
              size="small"
            >
              {colorscales.map(scale => (
                <MenuItem key={scale} value={scale}>
                  {scale}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </ControlAccordion>

        {dataset.shape && dataset.shape.length > 2 && (
          <ControlAccordion 
            title="Slice Controls"
            icon={<ViewSlider />}
            defaultExpanded={true}
          >
            {dataset.shape.map((dim, index) => {
              if (index !== plotSettings.xAxis && index !== plotSettings.yAxis) {
                return (
                  <Box key={`slice-${index}`} sx={{ mb: 2 }}>
                    <SliderContainer>
                      <SliderLabel>
                        Dimension {index}:
                      </SliderLabel>
                      <Slider
                        size="small"
                        min={0}
                        max={dim-1}
                        value={plotSettings.slices[index.toString()] || 0}
                        onChange={(_, value) => handleSliceChange(index.toString(), value as number)}
                        sx={{ mx: 1, flex: 1 }}
                      />
                      <SliderValue>
                        {plotSettings.slices[index.toString()] || 0}
                      </SliderValue>
                    </SliderContainer>
                  </Box>
                );
              }
              return null;
            })}
          </ControlAccordion>
        )}

        <ControlAccordion 
          title="Custom Ticks" 
          icon={<LabelIcon />}
          defaultExpanded={false}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Replace default axis ticks with values from compatible datasets.
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="x-ticks-dataset-label">X-Axis Ticks</InputLabel>
            <Select
              labelId="x-ticks-dataset-label"
              id="x-ticks-dataset"
              value={plotSettings.xTicksDataset}
              label="X-Axis Ticks"
              onChange={(e) => handleTicksDatasetChange('xTicksDataset', e.target.value)}
              size="small"
            >
              <MenuItem value="">Default indices</MenuItem>
              {compatibleXDatasets.map(d => (
                <MenuItem key={d.path} value={d.path}>
                  {d.path.split('/').pop()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="y-ticks-dataset-label">Y-Axis Ticks</InputLabel>
            <Select
              labelId="y-ticks-dataset-label"
              id="y-ticks-dataset"
              value={plotSettings.yTicksDataset}
              label="Y-Axis Ticks"
              onChange={(e) => handleTicksDatasetChange('yTicksDataset', e.target.value)}
              size="small"
            >
              <MenuItem value="">Default indices</MenuItem>
              {compatibleYDatasets.map(d => (
                <MenuItem key={d.path} value={d.path}>
                  {d.path.split('/').pop()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </ControlAccordion>

        <ControlAccordion 
          title="Plot Improvements" 
          icon={<FormatPaintIcon />}
          defaultExpanded={false}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customize plot appearance and improve visual presentation.
          </Typography>
          
          <PlotImprovements 
            settings={plotSettings.plotImprovements || defaultPlotImprovements}
            onSettingsChange={(newImproveSettings) => {
              setPlotSettings(prev => ({
                ...prev,
                plotImprovements: newImproveSettings
              }));
            }}
          />
        </ControlAccordion>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flexDirection: 'column',
          height: '100%',
          width: '100%'
        }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading heatmap data...</Typography>
        </Box>
      ) : error ? (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          p: 3
        }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid #d32f2f',
              borderRadius: '4px',
              backgroundColor: '#fdeded',
              width: '80%',
            }}
          >
            <Typography variant="h6" color="error" gutterBottom>Error</Typography>
            <Typography>{error}</Typography>
          </Paper>
        </Box>
      ) : plotData ? (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
          <Plot
            data={plotData}
            layout={{
              title: {
                text: plotSettings.plotImprovements?.titleText || dataset.path.split('/').pop() || '',
                font: {
                  family: plotSettings.plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                  size: plotSettings.plotImprovements?.fontSize || 24
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
                  text: plotSettings.plotImprovements?.xAxisLabel || 
                        `Dimension ${plotSettings.xAxis} ${plotSettings.xTicksDataset ? `(${plotSettings.xTicksDataset.split('/').pop()})` : ''}`,
                  font: {
                    family: plotSettings.plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                    size: plotSettings.plotImprovements?.fontSize || 16
                  },
                  standoff: 20  // Increased standoff for better spacing between axis title and ticks
                },
                showgrid: true,
                zeroline: true,
                tickfont: {
                  family: plotSettings.plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                  size: plotSettings.plotImprovements?.tickSize || 12
                },
                ticks: 'inside',
                tickwidth: plotSettings.plotImprovements?.tickThickness || 1,
                ticksuffix: '  ',  // Add space after tick labels
                tickprefix: '  '   // Add space before tick labels
              },
              yaxis: {
                title: {
                  text: plotSettings.plotImprovements?.yAxisLabel || 
                        `Dimension ${plotSettings.yAxis} ${plotSettings.yTicksDataset ? `(${plotSettings.yTicksDataset.split('/').pop()})` : ''}`,
                  font: {
                    family: plotSettings.plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                    size: plotSettings.plotImprovements?.fontSize || 16
                  },
                  standoff: 20  // Increased standoff for better spacing between axis title and ticks
                },
                showgrid: true,
                zeroline: true,
                tickfont: {
                  family: plotSettings.plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                  size: plotSettings.plotImprovements?.tickSize || 12
                },
                ticks: 'inside',
                tickwidth: plotSettings.plotImprovements?.tickThickness || 1,
                ticksuffix: '  ',  // Add space after tick labels
                tickprefix: '  '   // Add space before tick labels
              },
              coloraxis: {
                colorbar: {
                  tickfont: {
                    family: plotSettings.plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                    size: plotSettings.plotImprovements?.tickSize || 12
                  },
                  title: {
                    font: {
                      family: plotSettings.plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                      size: plotSettings.plotImprovements?.fontSize || 16
                    }
                  }
                }
              },
              legend: {
                font: {
                  family: plotSettings.plotImprovements?.useLatexFonts ? 'Computer Modern, serif' : 'Arial, sans-serif',
                  size: plotSettings.plotImprovements?.legendSize || 12
                },
                x: plotSettings.plotImprovements?.legendPosition?.includes('right') ? 1 : 0,
                y: plotSettings.plotImprovements?.legendPosition?.includes('top') ? 1 : 0,
                xanchor: plotSettings.plotImprovements?.legendPosition?.includes('right') ? 'right' : 'left',
                yanchor: plotSettings.plotImprovements?.legendPosition?.includes('top') ? 'top' : 'bottom',
                bordercolor: 'rgba(0,0,0,0.3)',
                borderwidth: 1,
                bgcolor: 'rgba(255,255,255,0.9)'
              },
              ...(plotSettings.plotImprovements?.showBorder && {
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
                filename: `heatmap_${dataset.path.split('/').pop()}`,
                scale: 2
              },
              displayModeBar: true,
              displaylogo: false,
              modeBarButtonsToRemove: ['lasso2d', 'select2d']
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
      ) : (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          color: 'text.secondary',
          p: 3
        }}>
          <Typography variant="h6" gutterBottom>No data available</Typography>
          <Typography>Please adjust plot settings to visualize the data.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default HeatmapPlot;