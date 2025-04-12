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

export interface PlotSettings {
  xAxis: number;
  yAxis: number;
  slices: Record<string, number>;
  colorscale: string;
  xTicksDataset: string;
  yTicksDataset: string;
}