export interface Dataset {
  path: string;
  type: string;
  shape?: number[];
  ndims?: number;
  dtype?: string;
}

export interface HDF5File {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  structure: Record<string, Dataset>;
}

export type PlotType = 'scatter' | 'line' | 'line+marker';

export interface PlotSettings {
  xAxis: number;
  yAxis: number;
  slices: Record<string, number>;
  colorscale: string;
  xTicksDataset: string;
  yTicksDataset: string;
  plotImprovements?: PlotImprovementsSettings;
}

export interface Series1DSettings {
  seriesPath: string; // Dataset path for the series data
  xDataset: string; // Optional dataset for x values
  plotType: PlotType;
  color: string;
  name: string;
  // Additional options for N-dimensional slices
  isNDimSlice?: boolean;
  sliceAxis?: number;
  slicesForOtherDimensions?: Record<string, number>;
  showStatistics?: boolean; // New option to show statistics
}

export interface StatusMessage {
  message: string;
  type: 'info' | 'error' | 'success';
}