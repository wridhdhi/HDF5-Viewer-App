export interface Dataset {
  path: string;
  type: string;
  shape?: number[];
  ndims?: number;
  dtype?: string;
}

export interface HDF5File {
  path: string;
  structure: Record<string, Dataset>;
}

export type PlotType = 'heatmap' | 'scatter' | 'line' | 'line+marker';

export interface PlotSettings {
  xAxis: number;
  yAxis: number;
  slices: Record<string, number>;
  colorscale: string;
  xTicksDataset: string;
  yTicksDataset: string;
  // For 1D plots
  plotType: PlotType;
  xDataset: string; // Dataset path for x-values (optional)
}

export interface Series1DSettings {
  seriesPath: string; // Dataset path for the series data
  xDataset: string; // Optional dataset for x values
  plotType: PlotType;
  color: string;
  name: string;
}