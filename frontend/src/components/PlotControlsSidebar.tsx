import React from 'react';
import { Box, Typography } from '@mui/material';

interface PlotControlsSidebarProps {
  activeTab: 'heatmap' | 'series1d';
  children: React.ReactNode;
}

const PlotControlsSidebar: React.FC<PlotControlsSidebarProps> = ({ activeTab, children }) => {
  return (
    <div className="govuk-width-container">
      <div className="govuk-heading-m">
        {activeTab === 'heatmap' ? 'Heatmap Controls' : '1D Series Controls'}
      </div>
      
      <div className="govuk-!-padding-bottom-6">
        {children || (
          <p className="govuk-body">
            Select a dataset to configure plot options
          </p>
        )}
      </div>
    </div>
  );
};

// GOV.UK styled Accordion for plot controls
export const ControlAccordion: React.FC<{
  title: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultExpanded = false, children }) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const accordionId = `accordion-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="govuk-accordion" data-module="govuk-accordion" id={accordionId}>
      <div className="govuk-accordion__section">
        <div className="govuk-accordion__section-header">
          <h2 className="govuk-accordion__section-heading">
            <span 
              className="govuk-accordion__section-button" 
              id={`${accordionId}-heading`}
              onClick={() => setExpanded(!expanded)}
              style={{ cursor: 'pointer' }}
            >
              {icon && <span className="govuk-!-margin-right-2">{icon}</span>}
              {title}
            </span>
          </h2>
        </div>
        
        <div 
          id={`${accordionId}-content`} 
          className={`govuk-accordion__section-content ${expanded ? '' : 'govuk-!-display-none'}`}
          aria-labelledby={`${accordionId}-heading`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PlotControlsSidebar;