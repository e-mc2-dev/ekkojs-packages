import React from 'react';

export interface RibbonButtonRowProps {
  children: React.ReactNode;
  vertical?: boolean;
}

export const RibbonButtonRow: React.FC<RibbonButtonRowProps> = ({
  children,
  vertical = false
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        gap: '2px'
      }}
    >
      {children}
    </div>
  );
};
