import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Dialog, Fade, Backdrop, Typography } from '@mui/material';
import AppNavbar from '../components/AppNavbar';
import PlotTypeSidebar from '../components/PlotTypeSidebar';
import PlotControlsSidebar from '../components/PlotControlsSidebar';
import StatusBar from '../components/StatusBar';
import HeatmapPlot from '../components/HeatmapPlot';
import Series1DPlot from '../components/Series1DPlot';
import FileUploader from '../components/FileUploader';
import { Dataset, HDF5File, PlotSettings, Series1DSettings } from '../types';

const HomePage: React.FC = () => {
  const [file, setFile] = useState<HDF5File | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'series1d'>('heatmap');
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  
  // Lift state up for HeatmapPlot
  const [heatmapSettings, setHeatmapSettings] = useState<PlotSettings>({
    xAxis: 0,
    yAxis: 1,
    slices: {},
    colorscale: 'Viridis',
    xTicksDataset: '',
    yTicksDataset: ''
  });
  
  // Lift state up for Series1DPlot
  const [seriesSettings, setSeriesSettings] = useState<Series1DSettings[]>([]);
  const [showNDimOptions, setShowNDimOptions] = useState(false);
  const [sliceAxis, setSliceAxis] = useState<number>(0);
  const [sliceSettings, setSliceSettings] = useState<Record<string, number>>({});

  // References to the plot components for saving the plot
  const heatmapPlotRef = useRef<any>(null);
  const seriesPlotRef = useRef<any>(null);

  // Function to handle saving the plot as PNG
  const handleSavePlot = () => {
    if (selectedDataset) {
      try {
        const plotName = selectedDataset.path.split('/').pop() || 'plot';
        
        // Create a custom filename
        const timestamp = new Date().toISOString().replace(/[:T.]/g, '-').slice(0, -5);
        const filename = `${plotName}_${timestamp}`;
        
        // Get the Plotly div element
        const plotElement = document.querySelector('.js-plotly-plot') as HTMLElement;
        
        if (!plotElement) {
          throw new Error("Plot element not found");
        }
        
        // Access the global Plotly object and use it to download the image
        if (window.Plotly) {
          window.Plotly.downloadImage(plotElement, {
            format: 'png',
            width: 1200,
            height: 800,
            filename: filename
          });
          
          setStatus({
            message: `Plot saved as ${filename}.png`,
            type: 'success'
          });
        } else {
          throw new Error("Plotly library not available");
        }
      } catch (error) {
        console.error("Error saving plot:", error);
        setStatus({
          message: `Failed to save plot: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        });
      }
    } else {
      setStatus({
        message: "No dataset selected to save plot",
        type: 'error'
      });
    }
  };

  const handleFileUploaded = (uploadedFile: HDF5File) => {
    setFile(uploadedFile);
    setSelectedDataset(null);
    setStatus({
      message: `File "${uploadedFile.path}" loaded successfully`,
      type: 'success'
    });
    setUploadDialogOpen(false);
  };

  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setStatus({
      message: `Dataset "${dataset.path}" selected`,
      type: 'info'
    });
    
    // Reset the series settings when a new dataset is selected
    setSeriesSettings([]);
    
    // Initialize heatmap settings for the new dataset
    if (dataset.shape && dataset.shape.length >= 2) {
      const newHeatmapSettings = { ...heatmapSettings };
      
      if (dataset.shape.length === 2) {
        newHeatmapSettings.xAxis = 1;
        newHeatmapSettings.yAxis = 0;
      } else {
        newHeatmapSettings.xAxis = 0;
        newHeatmapSettings.yAxis = 1;
      }
      
      // Initialize slices for dimensions beyond x and y
      const newSlices: Record<string, number> = {};
      for (let i = 0; i < dataset.shape.length; i++) {
        if (i !== newHeatmapSettings.xAxis && i !== newHeatmapSettings.yAxis) {
          newSlices[i.toString()] = Math.floor(dataset.shape[i] / 2);
        }
      }
      newHeatmapSettings.slices = newSlices;
      setHeatmapSettings(newHeatmapSettings);
    }
    
    // Initialize slice settings for 1D slices
    if (dataset.shape && dataset.shape.length > 1) {
      setShowNDimOptions(true);
      
      // Set slice axis to 0 by default
      setSliceAxis(0);
      
      // Initialize slice settings for each dimension
      const newSliceSettings: Record<string, number> = {};
      for (let i = 0; i < dataset.shape.length; i++) {
        if (i !== 0) { // Not the slice axis
          newSliceSettings[i.toString()] = Math.floor(dataset.shape[i] / 2);
        }
      }
      setSliceSettings(newSliceSettings);
    } else {
      setShowNDimOptions(false);
    }
  };

  useEffect(() => {
    // Clear error status after 5 seconds
    if (status?.type === 'error') {
      const timer = setTimeout(() => {
        setStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Determine what content to show in the plot controls sidebar
  const renderPlotControls = () => {
    if (!file || !selectedDataset) {
      return null; // The sidebar will show the default message
    }

    if (activeTab === 'heatmap' && selectedDataset.shape && selectedDataset.shape.length >= 2) {
      return (
        <HeatmapPlot
          filePath={file.path}
          dataset={selectedDataset}
          allDatasets={file.structure}
          setStatus={setStatus}
          controlsOnly={true}
          // Pass the shared state and setters
          plotSettings={heatmapSettings}
          setPlotSettings={setHeatmapSettings}
        />
      );
    } else if (activeTab === 'series1d') {
      return (
        <Series1DPlot
          filePath={file.path}
          allDatasets={file.structure}
          selectedDataset={selectedDataset}
          setStatus={setStatus}
          controlsOnly={true}
          // Pass the shared state and setters
          seriesSettings={seriesSettings}
          setSeriesSettings={setSeriesSettings}
          showNDimOptions={showNDimOptions}
          sliceAxis={sliceAxis}
          setSliceAxis={setSliceAxis}
          sliceSettings={sliceSettings}
          setSliceSettings={setSliceSettings}
        />
      );
    }

    return null;
  };

  // Get dataset info for status bar
  const getDatasetInfo = () => {
    if (!selectedDataset) return '';
    const shape = selectedDataset.shape ? `[${selectedDataset.shape.join(', ')}]` : '';
    return `${selectedDataset.path} ${shape}`;
  };

  // Calculate dimensions for layout
  const navbarHeight = '56px';
  const sidebarWidth = '280px';
  const statusBarHeight = '34px';

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      bgcolor: '#fafafa'
    }}>
      <AppNavbar 
        title="HDF5 Heatmap Viewer" 
        onFileUpload={() => setUploadDialogOpen(true)} 
        onSavePlot={selectedDataset ? handleSavePlot : undefined}
      />
      
      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={uploadDialogOpen}>
          <Box sx={{ p: 3 }}>
            <FileUploader onFileUploaded={handleFileUploaded} />
          </Box>
        </Fade>
      </Dialog>
      
      {/* Left Sidebar (Plot Controls) */}
      <Paper
        square
        elevation={1}
        sx={{
          position: 'fixed',
          top: navbarHeight,
          left: 0,
          bottom: statusBarHeight,
          width: sidebarWidth,
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          overflow: 'auto'
        }}
      >
        <PlotControlsSidebar activeTab={activeTab}>
          {renderPlotControls()}
        </PlotControlsSidebar>
      </Paper>
      
      {/* Right Sidebar (Dataset Selection) */}
      <Paper
        square
        elevation={1}
        sx={{
          position: 'fixed',
          top: navbarHeight,
          right: 0,
          bottom: statusBarHeight,
          width: sidebarWidth,
          borderLeft: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          overflow: 'hidden'
        }}
      >
        <PlotTypeSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          file={file}
          datasets={file?.structure || null}
          onSelectDataset={handleSelectDataset}
          filterDimensions={activeTab === 'heatmap' ? 2 : undefined}
        />
      </Paper>
      
      {/* Main Content Area */}
      <Box
        sx={{
          marginTop: navbarHeight,
          marginLeft: sidebarWidth,
          marginRight: sidebarWidth,
          marginBottom: statusBarHeight,
          padding: 3,
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#ffffff',
          boxShadow: 'inset 0 0 5px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: `calc(100vh - ${navbarHeight} - ${statusBarHeight})`,
          boxSizing: 'border-box'
        }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            width: '100%', 
            height: '100%',
            borderRadius: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {file ? (
            <Box sx={{ height: '100%', flex: 1 }}>
              {activeTab === 'heatmap' && (
                selectedDataset && selectedDataset.shape && selectedDataset.shape.length >= 2 ? (
                  <HeatmapPlot 
                    filePath={file.path} 
                    dataset={selectedDataset}
                    allDatasets={file.structure}
                    setStatus={setStatus}
                    controlsOnly={false}
                    // Pass the shared state
                    plotSettings={heatmapSettings}
                    setPlotSettings={setHeatmapSettings}
                  />
                ) : (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                    p: 3
                  }}>
                    <Box sx={{ textAlign: 'center', maxWidth: '400px' }}>
                      <h2>No 2D+ Dataset Selected</h2>
                      <p>
                        Select a multi-dimensional dataset (2D or higher) from the list to visualize it as a heatmap.
                      </p>
                    </Box>
                  </Box>
                )
              )}
              
              {activeTab === 'series1d' && (
                <Series1DPlot
                  filePath={file.path}
                  allDatasets={file.structure}
                  selectedDataset={selectedDataset}
                  setStatus={setStatus}
                  controlsOnly={false}
                  // Pass the shared state
                  seriesSettings={seriesSettings}
                  setSeriesSettings={setSeriesSettings}
                  showNDimOptions={showNDimOptions}
                  sliceAxis={sliceAxis}
                  setSliceAxis={setSliceAxis}
                  sliceSettings={sliceSettings}
                  setSliceSettings={setSliceSettings}
                />
              )}
            </Box>
          ) : (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 3
            }}>
              <FileUploader onFileUploaded={handleFileUploaded} />
            </Box>
          )}
        </Paper>
      </Box>
      
      {/* Status Bar */}
      <StatusBar status={status} datasetInfo={getDatasetInfo()} />
    </Box>
  );
};

export default HomePage;