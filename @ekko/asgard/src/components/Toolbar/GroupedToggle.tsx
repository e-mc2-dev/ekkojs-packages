import React from 'react';
import { Toggle } from './Toggle';
import type { ToggleProps } from './Toggle';
import { useTheme } from '../../theme';

export interface GroupedToggleProps {
  toggles: Omit<ToggleProps, 'tooltipPosition'>[];
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export const GroupedToggle: React.FC<GroupedToggleProps> = ({
  toggles,
  tooltipPosition = 'bottom'
}) => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '0',
        backgroundColor: theme.components.toolbar.background,
        borderRadius: '4px',
        padding: '2px',
        border: `1px solid ${theme.components.toolbar.groupBorder}`
      }}
    >
      {toggles.map((toggleProps, index) => (
        <Toggle
          key={index}
          {...toggleProps}
          tooltipPosition={tooltipPosition}
        />
      ))}
    </div>
  );
};
