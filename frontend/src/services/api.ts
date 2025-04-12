import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export interface HDF5Structure {
  type: string;
  shape?: number[];
  ndims?: number;
  axes?: {
    axis: number;
    size: number;
    name: string;
  }[];
  dtype?: string;
}

export interface UploadResponse {
  structure: Record<string, HDF5Structure>;
  path: string;
}

export interface DatasetResponse {
  data: {
    x_data: number[];
    y_data: number[];
    datasetInfo: {
      path: string;
      shape: number[];
      ndims: number;
      dtype: string;
      plotAxis: number;
      sliceIndices: Record<string, number>;
    };
  };
}

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getDataset = async (
  filePath: string,
  datasetPath: string,
  xAxis: number = 0,
  slices?: Record<string, number>,
  startIdx: number = 0,
  endIdx?: number,
  stride: number = 1,
  numPoints?: number
): Promise<DatasetResponse> => {
  const params: Record<string, string> = {
    file: filePath,
    path: datasetPath,
    x_axis: xAxis.toString(),
    start_idx: startIdx.toString(),
    stride: stride.toString(),
  };
  
  if (endIdx !== undefined) {
    params.end_idx = endIdx.toString();
  }
  
  if (numPoints !== undefined) {
    params.num_points = numPoints.toString();
  }
  
  if (slices) {
    params.slices_str = JSON.stringify(slices);
  }
  
  const response = await api.get<DatasetResponse>('/dataset', { params });
  return response.data;
};

export const getDatasetInfo = async (filePath: string, datasetPath: string) => {
  const params = {
    file: filePath,
    path: datasetPath,
  };
  
  const response = await api.get('/dataset_info', { params });
  return response.data;
};

export default api;