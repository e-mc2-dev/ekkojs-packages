import React, { useState } from 'react';
import { Tooltip } from '../Tooltip';
import { useTheme } from '../../theme';

export interface ToggleProps {
  icon: React.ReactNode;
  onToggle?: (checked: boolean) => void;
  checked?: boolean;
  disabled?: boolean;
  tooltip?: React.ReactNode;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export const Toggle: React.FC<ToggleProps> = ({
  icon,
  onToggle,
  checked = false,
  disabled = false,
  tooltip,
  tooltipPosition = 'bottom'
}) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (!disabled && onToggle) {
      onToggle(!checked);
    }
  };

  const button = (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-pressed={checked}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: checked
          ? theme.interactive.active
          : isPressed && !disabled
          ? theme.interactive.active
          : isHovered && !disabled
          ? theme.interactive.hover
          : 'transparent',
        color: disabled ? theme.text.disabled : theme.text.primary,
        cursor: disabled ? 'default' : 'pointer',
        padding: '0',
        outline: 'none',
        transition: 'background-color 0.1s ease',
        fontSize: '16px',
        flexShrink: 0,
        userSelect: 'none',
        opacity: disabled ? theme.opacity.disabled : 1
      }}
    >
      {icon}
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position={tooltipPosition}>
        {button}
      </Tooltip>
    );
  }

  return button;
};
