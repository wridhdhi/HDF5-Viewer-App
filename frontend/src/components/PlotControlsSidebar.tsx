import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface PlotControlsSidebarProps {
  activeTab: 'heatmap' | 'series1d';
  children: React.ReactNode;
}

const PlotControlsSidebar: React.FC<PlotControlsSidebarProps> = ({ activeTab, children }) => {
  return (
    <div className="govuk-width-container" style={{ padding: 0 }}>
      <div className="govuk-heading-m" style={{ marginTop: 0 }}>
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

// GOV.UK styled Accordion for plot controls with enhanced styling
export const ControlAccordion: React.FC<{
  title: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultExpanded = false, children }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isHovered, setIsHovered] = useState(false);
  const accordionId = `accordion-${title.replace(/\s+/g, '-').toLowerCase()}`;

  // Initialize GOV.UK Frontend JS if available when component is mounted
  useEffect(() => {
    if (window.GOVUKFrontend && window.GOVUKFrontend.Accordion) {
      try {
        const accordionElement = document.getElementById(accordionId);
        if (accordionElement) {
          // Try to initialize GOV.UK accordion
          new window.GOVUKFrontend.Accordion(accordionElement);
        }
      } catch (error) {
        console.warn('Could not initialize GOV.UK Frontend JS for accordion', error);
      }
    }
  }, [accordionId]);

  return (
    <div 
      className="govuk-accordion" 
      id={accordionId} 
      style={{
        marginBottom: '15px',
        marginTop: 0, // Remove top margin
        border: isHovered ? '2px solid #0b0c0c' : '1px solid #b1b4b6',
        borderRadius: '4px',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`govuk-accordion__section ${expanded ? 'govuk-accordion__section--expanded' : ''}`}
        style={{
          backgroundColor: expanded ? '#f8f8f8' : 'transparent',
          margin: 0, // Remove any margin
          padding: 0, // Remove any padding
        }}
      >
        <div 
          className="govuk-accordion__section-header" 
          style={{
            backgroundColor: isHovered ? '#ffdd00' : (expanded ? '#f3f2f1' : 'transparent'),
            borderBottom: expanded ? '1px solid #b1b4b6' : 'none',
            transition: 'background-color 0.2s ease',
            margin: 0, // Remove any margin
            padding: 0, // Remove any padding
          }}
        >
          <h2 className="govuk-accordion__section-heading" style={{ margin: 0 }}>
            <span 
              className="govuk-accordion__section-button" 
              id={`${accordionId}-heading`}
              onClick={() => setExpanded(!expanded)}
              style={{ 
                cursor: 'pointer',
                padding: '10px 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                fontWeight: 'bold',
                textDecoration: 'none',
                color: '#0b0c0c',
                position: 'relative',
                margin: 0, // Remove any margin
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {icon && <span style={{ marginRight: '10px' }}>{icon}</span>}
                {title}
              </span>
              {expanded ? 
                <KeyboardArrowUpIcon fontSize="small" /> : 
                <KeyboardArrowDownIcon fontSize="small" />
              }
            </span>
          </h2>
        </div>
        
        <div 
          id={`${accordionId}-content`} 
          className="govuk-accordion__section-content"
          aria-labelledby={`${accordionId}-heading`}
          style={{
            padding: '15px',
            display: expanded ? 'block' : 'none',
            borderTop: expanded ? '1px solid #b1b4b6' : 'none',
            margin: 0, // Remove any margin
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PlotControlsSidebar;