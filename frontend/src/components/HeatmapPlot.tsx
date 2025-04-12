import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Dataset, PlotSettings } from '../types';

interface HeatmapPlotProps {
  filePath: string;
  dataset: Dataset;
}

const HeatmapPlot: React.FC<HeatmapPlotProps> = ({ filePath, dataset }) => {
  const [plotData, setPlotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plotSettings, setPlotSettings] = useState<PlotSettings>({
    xAxis: 0,
    yAxis: 1,
    slices: {},
    colorscale: 'Viridis'
  });

  // Available colorscales in Plotly
  const colorscales = [
    'Viridis', 'Plasma', 'Inferno', 'Magma', 'Cividis',
    'Jet', 'Hot', 'Cool', 'Greys', 'YlGnBu', 'RdBu', 'Portland'
  ];

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

  const fetchDataForHeatmap = async () => {
    if (!dataset.shape || dataset.shape.length < 2) {
      setError('Dataset must have at least 2 dimensions for heatmap visualization');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Use the new heatmap_data endpoint
      const slicesStr = JSON.stringify(plotSettings.slices);
      const url = `http://localhost:8000/heatmap_data?file=${encodeURIComponent(filePath)}&path=${encodeURIComponent(dataset.path)}&x_axis=${plotSettings.xAxis}&y_axis=${plotSettings.yAxis}&slices_str=${encodeURIComponent(slicesStr)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch heatmap data');
      }
      
      const data = await response.json();
      
      // The backend now sends the complete 2D array formatted for the heatmap
      setPlotData({
        z: data.heatmap_data,
        type: 'heatmap',
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
        yAxis: value
      }));
    } else if (value === plotSettings.yAxis && axis === 'xAxis') {
      setPlotSettings(prev => ({
        ...prev,
        yAxis: prev.xAxis,
        xAxis: value
      }));
    } else {
      setPlotSettings(prev => ({
        ...prev,
        [axis]: value
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

  const handleColorscaleChange = (colorscale: string) => {
    setPlotSettings(prev => ({ ...prev, colorscale }));
  };

  if (!dataset) return null;

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
            data={[plotData]}
            layout={{
              title: `Heatmap of ${dataset.path}`,
              width: 800,
              height: 600,
              xaxis: {
                title: `Dimension ${plotSettings.xAxis}`,
              },
              yaxis: {
                title: `Dimension ${plotSettings.yAxis}`,
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default HeatmapPlot;