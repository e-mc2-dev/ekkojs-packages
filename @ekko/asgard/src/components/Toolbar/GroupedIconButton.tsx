import React from 'react';
import { IconButton } from './IconButton';
import type { IconButtonProps } from './IconButton';
import { useTheme } from '../../theme';

export interface GroupedIconButtonProps {
  buttons: Omit<IconButtonProps, 'tooltipPosition'>[];
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export const GroupedIconButton: React.FC<GroupedIconButtonProps> = ({
  buttons,
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
      {buttons.map((buttonProps, index) => (
        <IconButton
          key={index}
          {...buttonProps}
          tooltipPosition={tooltipPosition}
        />
      ))}
    </div>
  );
};
