import React, { useState } from 'react';
import { Dataset } from '../types';

interface DatasetListProps {
  datasets: Record<string, Dataset>;
  onSelectDataset: (dataset: Dataset) => void;
  filterDimensions?: number; // New prop to filter datasets by minimum dimensions
}

const DatasetList: React.FC<DatasetListProps> = ({ 
  datasets, 
  onSelectDataset,
  filterDimensions 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Filter datasets based on search query and dimensions
  const filteredDatasets = Object.values(datasets).filter(dataset => {
    // Filter by search term
    const matchesSearch = dataset.path.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by dataset type
    const isDataset = dataset.type === 'dataset';
    
    // Filter by dimensions if filterDimensions is specified
    let hasSufficientDimensions = true;
    if (filterDimensions !== undefined && dataset.shape) {
      hasSufficientDimensions = dataset.shape.length >= filterDimensions;
    }
    
    return matchesSearch && isDataset && hasSufficientDimensions;
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

  // Get the filter text to display based on active filter
  const getFilterText = () => {
    if (filterDimensions !== undefined) {
      return `Showing datasets with ${filterDimensions}+ dimensions`;
    }
    return "Showing all datasets";
  };

  return (
    <div className="dataset-list">
      <h2>Available Datasets</h2>
      <div className="filter-info">{getFilterText()}</div>
      <input
        type="text"
        placeholder="Search datasets..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />
      
      {Object.keys(groupedDatasets).length === 0 && (
        <p>No matching datasets found in this file.</p>
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