import React from 'react';
import { useTheme } from '../../theme';

export interface RibbonGroupProps {
  label: string;
  children: React.ReactNode;
}

export const RibbonGroup: React.FC<RibbonGroupProps> = ({ label, children }) => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        borderRight: `1px solid ${theme.border.default}`,
        paddingRight: '8px',
        paddingLeft: '4px',
        height: '100%'
      }}
    >
      {/* Group Content */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'flex-start',
          paddingTop: '4px',
          paddingBottom: '4px',
          flex: 1
        }}
      >
        {children}
      </div>

      {/* Group Label */}
      <div
        style={{
          fontSize: '10px',
          color: theme.text.secondary,
          textAlign: 'center',
          padding: '4px 0 2px 0',
          borderTop: `1px solid ${theme.border.default}`,
          minHeight: '20px',
          lineHeight: '12px',
          flexShrink: 0
        }}
      >
        {label}
      </div>
    </div>
  );
};
