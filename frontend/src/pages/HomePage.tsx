import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Fade, Backdrop, Box } from '@mui/material';
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
  
  const [heatmapSettings, setHeatmapSettings] = useState<PlotSettings>({
    xAxis: 0,
    yAxis: 1,
    slices: {},
    colorscale: 'Viridis',
    xTicksDataset: '',
    yTicksDataset: ''
  });
  
  const [seriesSettings, setSeriesSettings] = useState<Series1DSettings[]>([]);
  const [showNDimOptions, setShowNDimOptions] = useState(false);
  const [sliceAxis, setSliceAxis] = useState<number>(0);
  const [sliceSettings, setSliceSettings] = useState<Record<string, number>>({});

  const heatmapPlotRef = useRef<any>(null);
  const seriesPlotRef = useRef<any>(null);

  const handleSavePlot = () => {
    if (selectedDataset) {
      try {
        const plotName = selectedDataset.path.split('/').pop() || 'plot';
        const timestamp = new Date().toISOString().replace(/[:T.]/g, '-').slice(0, -5);
        const filename = `${plotName}_${timestamp}`;
        const plotElement = document.querySelector('.js-plotly-plot') as HTMLElement;
        
        if (!plotElement) {
          throw new Error("Plot element not found");
        }
        
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
    
    setSeriesSettings([]);
    
    if (dataset.shape && dataset.shape.length >= 2) {
      const newHeatmapSettings = { ...heatmapSettings };
      
      if (dataset.shape.length === 2) {
        newHeatmapSettings.xAxis = 1;
        newHeatmapSettings.yAxis = 0;
      } else {
        newHeatmapSettings.xAxis = 0;
        newHeatmapSettings.yAxis = 1;
      }
      
      const newSlices: Record<string, number> = {};
      for (let i = 0; i < dataset.shape.length; i++) {
        if (i !== newHeatmapSettings.xAxis && i !== newHeatmapSettings.yAxis) {
          newSlices[i.toString()] = Math.floor(dataset.shape[i] / 2);
        }
      }
      newHeatmapSettings.slices = newSlices;
      setHeatmapSettings(newHeatmapSettings);
    }
    
    if (dataset.shape && dataset.shape.length > 1) {
      setShowNDimOptions(true);
      setSliceAxis(0);
      const newSliceSettings: Record<string, number> = {};
      for (let i = 0; i < dataset.shape.length; i++) {
        if (i !== 0) {
          newSliceSettings[i.toString()] = Math.floor(dataset.shape[i] / 2);
        }
      }
      setSliceSettings(newSliceSettings);
    } else {
      setShowNDimOptions(false);
    }
  };

  useEffect(() => {
    if (status?.type === 'error') {
      const timer = setTimeout(() => {
        setStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const renderPlotControls = () => {
    if (!file || !selectedDataset) {
      return null;
    }

    if (activeTab === 'heatmap' && selectedDataset.shape && selectedDataset.shape.length >= 2) {
      return (
        <HeatmapPlot
          filePath={file.path}
          dataset={selectedDataset}
          allDatasets={file.structure}
          setStatus={setStatus}
          controlsOnly={true}
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

  const getDatasetInfo = () => {
    if (!selectedDataset) return '';
    const shape = selectedDataset.shape ? `[${selectedDataset.shape.join(', ')}]` : '';
    return `${selectedDataset.path} ${shape}`;
  };

  const navbarHeight = '60px';
  const sidebarWidth = '300px';
  const statusBarHeight = '24px'; // Reduced to match our new status bar height

  return (
    <div className="govuk-template__body" style={{ width: '100vw', maxWidth: '100%', padding: 0, margin: 0, overflow: 'hidden' }}>
      <AppNavbar 
        title="HDF5 Heatmap Viewer" 
        onFileUpload={() => setUploadDialogOpen(true)} 
        onSavePlot={selectedDataset ? handleSavePlot : undefined}
      />
      
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
          <div className="govuk-!-padding-4">
            <FileUploader onFileUploaded={handleFileUploaded} />
          </div>
        </Fade>
      </Dialog>
      
      <div style={{ 
        width: '100%', 
        maxWidth: '100%', 
        margin: 0, 
        height: `calc(100vh - ${navbarHeight} - ${statusBarHeight})`, // Adjusted to include both navbar and statusbar
        position: 'absolute',
        top: navbarHeight,
        bottom: statusBarHeight
      }}>
        <main style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="app-pane app-pane--enabled" style={{ 
            display: 'flex',
            height: '100%',
            width: '100%',
            maxWidth: '100%',
            borderTop: '2px solid #0b0c0c' // Strong black border at the top of the entire content area
          }}>
            <div 
              className="app-pane__side-bar" 
              style={{
                width: sidebarWidth,
                borderRight: '2px solid #0b0c0c', // Strong black border
                overflow: 'auto',
                backgroundColor: '#f3f2f1',
                height: '100%',
                padding: '15px' // Added padding
              }}
            >
              <PlotControlsSidebar activeTab={activeTab}>
                {renderPlotControls()}
              </PlotControlsSidebar>
            </div>
            
            <div 
              className="app-pane__content" 
              style={{
                flex: 1,
                overflow: 'auto',
                backgroundColor: '#ffffff',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderLeft: '2px solid #0b0c0c', // Strong black border
                borderRight: '2px solid #0b0c0c', // Strong black border
                padding: '10px' // Added minimal padding to ensure plot doesn't touch edges
              }}
            >
              <div 
                style={{ 
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {file ? (
                  <div style={{ height: '100%', flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'stretch' }}>
                    {activeTab === 'heatmap' && (
                      selectedDataset && selectedDataset.shape && selectedDataset.shape.length >= 2 ? (
                        <div style={{ width: '100%', height: '100%', padding: '5px' }}>
                          <HeatmapPlot 
                            filePath={file.path} 
                            dataset={selectedDataset}
                            allDatasets={file.structure}
                            setStatus={setStatus}
                            controlsOnly={false}
                            plotSettings={heatmapSettings}
                            setPlotSettings={setHeatmapSettings}
                          />
                        </div>
                      ) : (
                        <div className="govuk-!-padding-6 govuk-!-margin-top-9 govuk-!-text-align-center">
                          <h2 className="govuk-heading-m">No 2D+ Dataset Selected</h2>
                          <p className="govuk-body">
                            Select a multi-dimensional dataset (2D or higher) from the list to visualize it as a heatmap.
                          </p>
                        </div>
                      )
                    )}
                    
                    {activeTab === 'series1d' && (
                      <div style={{ width: '100%', height: '100%', padding: '5px' }}>
                        <Series1DPlot
                          filePath={file.path}
                          allDatasets={file.structure}
                          selectedDataset={selectedDataset}
                          setStatus={setStatus}
                          controlsOnly={false}
                          seriesSettings={seriesSettings}
                          setSeriesSettings={setSeriesSettings}
                          showNDimOptions={showNDimOptions}
                          sliceAxis={sliceAxis}
                          setSliceAxis={setSliceAxis}
                          sliceSettings={sliceSettings}
                          setSliceSettings={setSliceSettings}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="govuk-!-padding-6">
                    <FileUploader onFileUploaded={handleFileUploaded} />
                  </div>
                )}
              </div>
            </div>
            
            <div 
              className="app-pane__side-bar" 
              style={{
                width: sidebarWidth,
                borderLeft: '2px solid #0b0c0c', // Strong black border
                overflow: 'auto',
                backgroundColor: '#f3f2f1',
                height: '100%',
                padding: '15px' // Added padding
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
            </div>
          </div>
        </main>
      </div>
      
      <StatusBar status={status} datasetInfo={getDatasetInfo()} />
    </div>
  );
};

export default HomePage;