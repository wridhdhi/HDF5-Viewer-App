import React from 'react';
import TableChartIcon from '@mui/icons-material/TableChart';
import FolderIcon from '@mui/icons-material/Folder';
import { Dataset } from '../types';

interface DatasetListProps {
  datasets: Record<string, Dataset> | null;
  onSelectDataset: (dataset: Dataset) => void;
  filterDimensions?: number;
  selectedDataset: Dataset | null;
}

const DatasetList: React.FC<DatasetListProps> = ({ 
  datasets, 
  onSelectDataset, 
  filterDimensions,
  selectedDataset
}) => {
  if (!datasets) {
    return (
      <div className="govuk-body govuk-!-text-align-center govuk-!-padding-top-6 govuk-!-padding-bottom-6">
        No file loaded. Please upload an HDF5 file.
      </div>
    );
  }

  const filteredDatasets = Object.values(datasets).filter(dataset => {
    if (filterDimensions === undefined) {
      return true;
    }
    return dataset.shape && dataset.shape.length >= filterDimensions;
  });

  if (filteredDatasets.length === 0) {
    return (
      <div className="govuk-body govuk-!-text-align-center govuk-!-padding-top-6 govuk-!-padding-bottom-6">
        No suitable datasets found in this file.
        {filterDimensions && (
          <span> Looking for datasets with {filterDimensions}+ dimensions.</span>
        )}
      </div>
    );
  }

  // Group datasets by their parent groups for better organization
  const groupedDatasets: { [key: string]: Dataset[] } = {};
  filteredDatasets.forEach(dataset => {
    const pathParts = dataset.path.split('/');
    // Skip the empty first part from the split
    const groupPath = pathParts.slice(0, -1).join('/') || '/';
    
    if (!groupedDatasets[groupPath]) {
      groupedDatasets[groupPath] = [];
    }
    groupedDatasets[groupPath].push(dataset);
  });

  const isSelected = (dataset: Dataset) => {
    return selectedDataset && selectedDataset.path === dataset.path;
  };

  return (
    <div className="govuk-!-margin-bottom-6">
      {Object.entries(groupedDatasets).map(([groupPath, datasets], index) => (
        <React.Fragment key={groupPath}>
          {index > 0 && <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible" />}
          
          <div className="govuk-!-margin-bottom-2">
            <strong className="govuk-tag govuk-tag--blue govuk-!-margin-right-1">
              <FolderIcon style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }} />
              {groupPath === '/' ? 'Root' : groupPath}
            </strong>
          </div>
          
          <ul className="govuk-list">
            {datasets.map(dataset => (
              <li 
                key={dataset.path}
                className={`govuk-!-padding-2 govuk-!-margin-bottom-1 ${isSelected(dataset) ? 'govuk-!-background-colour-blue govuk-!-font-weight-bold' : ''}`}
                style={{ 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  borderLeft: isSelected(dataset) ? '4px solid #1d70b8' : '4px solid transparent',
                  transition: 'all 0.2s ease',
                  outline: '2px solid transparent',
                  outlineOffset: '-2px',
                }}
                onClick={() => onSelectDataset(dataset)}
                onMouseOver={(e) => {
                  if (!isSelected(dataset)) {
                    e.currentTarget.style.backgroundColor = '#ffdd00'; // GOV.UK yellow on hover
                    e.currentTarget.style.outline = '2px solid #0b0c0c'; // Black outline on hover
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSelected(dataset)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.outline = '2px solid transparent';
                  }
                }}
                onFocus={(e) => {
                  if (!isSelected(dataset)) {
                    e.currentTarget.style.backgroundColor = '#ffdd00';
                    e.currentTarget.style.outline = '2px solid #0b0c0c';
                  }
                }}
                onBlur={(e) => {
                  if (!isSelected(dataset)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.outline = '2px solid transparent';
                  }
                }}
              >
                <div className="govuk-grid-row">
                  <div className="govuk-grid-column-three-quarters">
                    <span className={isSelected(dataset) ? 'govuk-!-color-white' : ''}>
                      <TableChartIcon style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 8 }} />
                      {dataset.path.split('/').pop()}
                    </span>
                  </div>
                  <div className="govuk-grid-column-one-quarter">
                    <div className="govuk-!-text-align-right">
                      {dataset.shape && (
                        <span className={`govuk-tag govuk-tag--grey ${isSelected(dataset) ? 'govuk-!-color-white' : ''}`} style={{ fontSize: '0.8rem' }}>
                          {dataset.shape.join(' × ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {dataset.dtype && (
                  <div className="govuk-body-s govuk-!-margin-bottom-0 govuk-!-margin-top-1" style={{ paddingLeft: '24px' }}>
                    <span className={`govuk-tag govuk-tag--green ${isSelected(dataset) ? 'govuk-!-color-white' : ''}`} style={{ fontSize: '0.7rem' }}>
                      {dataset.dtype}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </React.Fragment>
      ))}
    </div>
  );
};

export default DatasetList;