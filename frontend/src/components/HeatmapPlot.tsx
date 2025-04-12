import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Dataset, PlotSettings } from '../types';

interface HeatmapPlotProps {
  filePath: string;
  dataset: Dataset;
  allDatasets: Record<string, Dataset>;
}

const HeatmapPlot: React.FC<HeatmapPlotProps> = ({ filePath, dataset, allDatasets }) => {
  const [plotData, setPlotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plotSettings, setPlotSettings] = useState<PlotSettings>({
    xAxis: 0,
    yAxis: 1,
    slices: {},
    colorscale: 'Viridis',
    xTicksDataset: '',
    yTicksDataset: ''
  });
  const [compatibleXDatasets, setCompatibleXDatasets] = useState<Dataset[]>([]);
  const [compatibleYDatasets, setCompatibleYDatasets] = useState<Dataset[]>([]);

  // Available colorscales in Plotly
  const colorscales = [
    'Viridis', 'Plasma', 'Inferno', 'Magma', 'Cividis',
    'Jet', 'Hot', 'Cool', 'Greys', 'YlGnBu', 'RdBu', 'Portland'
  ];

  // Find datasets compatible with the current axis dimensions
  useEffect(() => {
    if (!dataset || !dataset.shape || !allDatasets) return;

    // For X axis: find 1D datasets with length matching the current X axis dimension
    const xAxisLength = dataset.shape[plotSettings.xAxis];
    const matchingXDatasets = Object.values(allDatasets).filter(d => 
      d.type === 'dataset' && 
      d.shape && 
      ((d.shape.length === 1 && d.shape[0] === xAxisLength) ||
       (d.shape.length === 2 && d.shape[0] === 1 && d.shape[1] === xAxisLength) ||
       (d.shape.length === 2 && d.shape[1] === 1 && d.shape[0] === xAxisLength))
    );
    setCompatibleXDatasets(matchingXDatasets);

    // For Y axis: find 1D datasets with length matching the current Y axis dimension
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

    // Initialize default slices for dimensions beyond 2D
    if (dataset.shape && dataset.shape.length > 2) {
      const newSlices: Record<string, number> = {};
      for (let i = 0; i < dataset.shape.length; i++) {
        if (i !== plotSettings.xAxis && i !== plotSettings.yAxis) {
          newSlices[i.toString()] = Math.floor(dataset.shape[i] / 2);
        }
      }
      setPlotSettings(prev => ({ ...prev, slices: newSlices }));
    } else if (dataset.shape && dataset.shape.length === 2) {
      // For 2D data, set default axes
      setPlotSettings(prev => ({
        ...prev,
        xAxis: 1, // Column index
        yAxis: 0, // Row index
      }));
    }
  }, [dataset, filePath]);

  useEffect(() => {
    if (!dataset || !filePath) return;
    
    fetchDataForHeatmap();
  }, [dataset, filePath, plotSettings]);

  // Helper function to generate evenly spaced tick indices
  const generateSpacedTicks = (totalPoints: number, maxTicks: number = 10): number[] => {
    if (totalPoints <= maxTicks) {
      return Array.from({ length: totalPoints }, (_, i) => i);
    }
    
    // Calculate appropriate step size to get approximately maxTicks
    const step = Math.ceil(totalPoints / maxTicks);
    const ticks: number[] = [];
    
    // Generate evenly spaced indices
    for (let i = 0; i < totalPoints; i += step) {
      ticks.push(i);
    }
    
    // Always include the last point if it's not already included
    if (ticks[ticks.length - 1] !== totalPoints - 1) {
      ticks.push(totalPoints - 1);
    }
    
    return ticks;
  };

  const fetchDataForHeatmap = async () => {
    if (!dataset.shape || dataset.shape.length < 2) {
      setError('Dataset must have at least 2 dimensions for heatmap visualization');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Use the heatmap_data endpoint
      const slicesStr = JSON.stringify(plotSettings.slices);
      let url = `http://localhost:8000/heatmap_data?file=${encodeURIComponent(filePath)}&path=${encodeURIComponent(dataset.path)}&x_axis=${plotSettings.xAxis}&y_axis=${plotSettings.yAxis}&slices_str=${encodeURIComponent(slicesStr)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch heatmap data');
      }
      
      const data = await response.json();
      
      // Get custom tick values for X axis if selected
      let xTickValues: number[] | string[] | null = null;
      if (plotSettings.xTicksDataset) {
        try {
          const xTicksUrl = `http://localhost:8000/dataset?file=${encodeURIComponent(filePath)}&path=${encodeURIComponent(plotSettings.xTicksDataset)}`;
          const xTicksResponse = await fetch(xTicksUrl);
          if (xTicksResponse.ok) {
            const xTicksData = await xTicksResponse.json();
            xTickValues = xTicksData.data.y_data;
          }
        } catch (error) {
          console.error('Error fetching X tick labels:', error);
        }
      }
      
      // Get custom tick values for Y axis if selected
      let yTickValues: number[] | string[] | null = null;
      if (plotSettings.yTicksDataset) {
        try {
          const yTicksUrl = `http://localhost:8000/dataset?file=${encodeURIComponent(filePath)}&path=${encodeURIComponent(plotSettings.yTicksDataset)}`;
          const yTicksResponse = await fetch(yTicksUrl);
          if (yTicksResponse.ok) {
            const yTicksData = await yTicksResponse.json();
            yTickValues = yTicksData.data.y_data;
          }
        } catch (error) {
          console.error('Error fetching Y tick labels:', error);
        }
      }
      
      // The backend sends the complete 2D array formatted for the heatmap
      setPlotData({
        data: data.heatmap_data,
        xTickValues: xTickValues,
        yTickValues: yTickValues,
        colorscale: plotSettings.colorscale,
      });
    } catch (err) {
      console.error('Error fetching data for heatmap:', err);
      setError(`Failed to load data for heatmap visualization: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAxisChange = (axis: 'xAxis' | 'yAxis', value: number) => {
    if (value === plotSettings.xAxis && axis === 'yAxis') {
      // Swap the axes if the user selects the same axis for both
      setPlotSettings(prev => ({
        ...prev,
        xAxis: prev.yAxis,
        yAxis: value,
        // Reset tick datasets when axes change
        xTicksDataset: '',
        yTicksDataset: ''
      }));
    } else if (value === plotSettings.yAxis && axis === 'xAxis') {
      setPlotSettings(prev => ({
        ...prev,
        yAxis: prev.xAxis,
        xAxis: value,
        // Reset tick datasets when axes change
        xTicksDataset: '',
        yTicksDataset: ''
      }));
    } else {
      setPlotSettings(prev => ({
        ...prev,
        [axis]: value,
        // Reset only the affected axis tick dataset
        ...(axis === 'xAxis' ? { xTicksDataset: '' } : {}),
        ...(axis === 'yAxis' ? { yTicksDataset: '' } : {})
      }));
    }
  };

  const handleTicksDatasetChange = (axis: 'xTicksDataset' | 'yTicksDataset', value: string) => {
    setPlotSettings(prev => ({
      ...prev,
      [axis]: value
    }));
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

  const handleColorscaleChange = (colorscale: string) => {
    setPlotSettings(prev => ({ ...prev, colorscale }));
  };

  if (!dataset) return null;

  // Generate reasonably spaced tick indices
  const xTicks = plotData?.xTickValues ? 
    generateSpacedTicks(plotData.xTickValues.length) : null;
  const yTicks = plotData?.yTickValues ? 
    generateSpacedTicks(plotData.yTickValues.length) : null;

  // Prepare tick text values at those indices
  const xTickText = xTicks && plotData?.xTickValues ? 
    xTicks.map(i => plotData.xTickValues[i]) : null;
  const yTickText = yTicks && plotData?.yTickValues ? 
    yTicks.map(i => plotData.yTickValues[i]) : null;

  return (
    <div className="heatmap-plot">
      <h2>Heatmap for {dataset.path}</h2>
      
      <div className="plot-controls">
        <div className="control-group">
          <label>X Axis:</label>
          <select 
            value={plotSettings.xAxis}
            onChange={(e) => handleAxisChange('xAxis', parseInt(e.target.value))}
          >
            {dataset.shape?.map((size, idx) => (
              <option key={`x-${idx}`} value={idx}>
                Dimension {idx} (size: {size})
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>X Axis Labels:</label>
          <select
            value={plotSettings.xTicksDataset}
            onChange={(e) => handleTicksDatasetChange('xTicksDataset', e.target.value)}
          >
            <option value="">Default (indices)</option>
            {compatibleXDatasets.map(d => (
              <option key={d.path} value={d.path}>
                {d.path}
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Y Axis:</label>
          <select 
            value={plotSettings.yAxis}
            onChange={(e) => handleAxisChange('yAxis', parseInt(e.target.value))}
          >
            {dataset.shape?.map((size, idx) => (
              <option key={`y-${idx}`} value={idx}>
                Dimension {idx} (size: {size})
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Y Axis Labels:</label>
          <select
            value={plotSettings.yTicksDataset}
            onChange={(e) => handleTicksDatasetChange('yTicksDataset', e.target.value)}
          >
            <option value="">Default (indices)</option>
            {compatibleYDatasets.map(d => (
              <option key={d.path} value={d.path}>
                {d.path}
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Colorscale:</label>
          <select 
            value={plotSettings.colorscale}
            onChange={(e) => handleColorscaleChange(e.target.value)}
          >
            {colorscales.map(scale => (
              <option key={scale} value={scale}>{scale}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Show slice controls for dimensions beyond the first two */}
      {dataset.shape && dataset.shape.length > 2 && (
        <div className="slice-controls">
          <h3>Slice Controls</h3>
          <div className="slice-sliders">
            {dataset.shape.map((size, idx) => {
              // Only show sliders for dimensions not used as X or Y axes
              if (idx !== plotSettings.xAxis && idx !== plotSettings.yAxis) {
                return (
                  <div key={`slice-${idx}`} className="slice-slider">
                    <label>Dimension {idx} (size: {size}):</label>
                    <input 
                      type="range"
                      min={0}
                      max={size - 1}
                      value={plotSettings.slices[idx.toString()] || 0}
                      onChange={(e) => handleSliceChange(idx.toString(), parseInt(e.target.value))}
                    />
                    <span>{plotSettings.slices[idx.toString()] || 0}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
      
      {loading && <p>Loading dataset for visualization...</p>}
      {error && <p className="error">{error}</p>}
      
      {plotData && !loading && (
        <div className="plot-container">
          <Plot
            data={[{
              z: plotData.data,
              type: 'heatmap',
              colorscale: plotSettings.colorscale,
              transpose: true, // Fix the transposition issue
            }]}
            layout={{
              title: `Heatmap of ${dataset.path}`,
              width: 800,
              height: 600,
              xaxis: {
                title: plotSettings.xTicksDataset 
                  ? `${plotSettings.xTicksDataset}` 
                  : `Dimension ${plotSettings.xAxis}`,
                tickmode: xTickText ? 'array' : 'auto',
                tickvals: xTicks,
                ticktext: xTickText,
                automargin: true,
                nticks: 10,
                showgrid: true,
                zeroline: false,
                showline: true,
                mirror: 'all',
                showticklabels: true
              },
              yaxis: {
                title: plotSettings.yTicksDataset 
                  ? `${plotSettings.yTicksDataset}` 
                  : `Dimension ${plotSettings.yAxis}`,
                tickmode: yTickText ? 'array' : 'auto',
                tickvals: yTicks,
                ticktext: yTickText,
                automargin: true,
                nticks: 10,
                showgrid: true,
                zeroline: false,
                showline: true,
                mirror: 'all',
                showticklabels: true
              }
            }}
            config={{
              responsive: true,
              displayModeBar: true,
              scrollZoom: true
            }}
          />
        </div>
      )}
    </div>
  );
};

export default HeatmapPlot;