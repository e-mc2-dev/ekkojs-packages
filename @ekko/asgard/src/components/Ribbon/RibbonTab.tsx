import React from 'react';

export interface RibbonTabProps {
  id: string;
  label: string;
  children: React.ReactNode;
}

export const RibbonTab: React.FC<RibbonTabProps> = ({ children }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'stretch'
      }}
    >
      {children}
    </div>
  );
};
