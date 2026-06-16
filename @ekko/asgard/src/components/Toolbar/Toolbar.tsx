import React from 'react';
import { useTheme } from '../../theme';

export interface ToolbarProps {
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export const Toolbar: React.FC<ToolbarProps> = ({
  children,
  position = 'top'
}) => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        backgroundColor: theme.components.toolbar.background,
        borderBottom: position === 'top' ? `1px solid ${theme.border.default}` : 'none',
        borderTop: position === 'bottom' ? `1px solid ${theme.border.default}` : 'none',
        height: '36px',
        flexShrink: 0
      }}
    >
      {children}
    </div>
  );
};
