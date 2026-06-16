import React from 'react';
import { useTheme } from '../../theme';

export const VerticalDivider: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        width: '1px',
        height: '24px',
        backgroundColor: theme.border.divider,
        margin: '0 4px',
        flexShrink: 0
      }}
    />
  );
};
