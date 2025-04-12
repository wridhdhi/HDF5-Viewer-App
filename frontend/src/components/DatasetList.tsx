import React, { useState } from 'react';
import { Dataset } from '../types';

interface DatasetListProps {
  datasets: Record<string, Dataset>;
  onSelectDataset: (dataset: Dataset) => void;
}

const DatasetList: React.FC<DatasetListProps> = ({ datasets, onSelectDataset }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Filter datasets that have at least 2D shape
  const filteredDatasets = Object.values(datasets).filter(dataset => {
    const matchesSearch = dataset.path.toLowerCase().includes(searchQuery.toLowerCase());
    const isMultiDimensional = dataset.type === 'dataset' && 
                              dataset.shape && 
                              (dataset.shape.length >= 2 || 
                               (dataset.shape.length === 1 && dataset.shape[0] > 1));
    return matchesSearch && isMultiDimensional;
  });

  const toggleGroup = (groupPath: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupPath)) {
      newExpanded.delete(groupPath);
    } else {
      newExpanded.add(groupPath);
    }
    setExpandedGroups(newExpanded);
  };

  // Group datasets by their parent groups
  const groupedDatasets: Record<string, Dataset[]> = {};
  
  filteredDatasets.forEach(dataset => {
    const pathParts = dataset.path.split('/');
    if (pathParts.length > 1) {
      const groupPath = pathParts.slice(0, -1).join('/');
      if (!groupedDatasets[groupPath]) {
        groupedDatasets[groupPath] = [];
      }
      groupedDatasets[groupPath].push(dataset);
    } else {
      // Root level datasets
      if (!groupedDatasets['root']) {
        groupedDatasets['root'] = [];
      }
      groupedDatasets['root'].push(dataset);
    }
  });

  return (
    <div className="dataset-list">
      <h2>Available Datasets</h2>
      <input
        type="text"
        placeholder="Search datasets..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />
      
      {Object.keys(groupedDatasets).length === 0 && (
        <p>No multi-dimensional datasets found in this file.</p>
      )}
      
      {Object.entries(groupedDatasets).map(([groupPath, groupDatasets]) => (
        <div key={groupPath} className="dataset-group">
          <div 
            className="group-header" 
            onClick={() => toggleGroup(groupPath)}
          >
            <span className="group-toggle">
              {expandedGroups.has(groupPath) ? '▼' : '►'}
            </span>
            <span className="group-name">
              {groupPath === 'root' ? 'Root' : groupPath} ({groupDatasets.length})
            </span>
          </div>
          
          {expandedGroups.has(groupPath) && (
            <ul className="dataset-items">
              {groupDatasets.map(dataset => (
                <li 
                  key={dataset.path}
                  className="dataset-item"
                  onClick={() => onSelectDataset(dataset)}
                >
                  <div className="dataset-name">{dataset.path.split('/').pop()}</div>
                  <div className="dataset-info">
                    {dataset.shape ? `Shape: [${dataset.shape.join(', ')}]` : ''}
                    {dataset.dtype ? ` • Type: ${dataset.dtype}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default DatasetList;