import React, { useState } from 'react';
import { useTheme } from '../../theme';

export interface RibbonToggleButtonProps {
  icon: React.ReactNode;
  label?: string;
  checked?: boolean;
  onToggle?: (checked: boolean) => void;
  disabled?: boolean;
  tooltip?: string;
}

export const RibbonToggleButton: React.FC<RibbonToggleButtonProps> = ({
  icon,
  label,
  checked = false,
  onToggle,
  disabled = false,
  tooltip
}) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      onClick={() => !disabled && onToggle?.(!checked)}
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
      title={tooltip || label}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: label ? '4px' : '0',
        padding: label ? '2px 6px' : '0',
        minWidth: 'auto',
        width: label ? 'auto' : '28px',
        height: '28px',
        backgroundColor: checked
          ? theme.interactive.active
          : isPressed && !disabled
          ? theme.interactive.active
          : isHovered && !disabled
          ? theme.interactive.hover
          : 'transparent',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? theme.opacity.disabled : 1,
        userSelect: 'none',
        fontSize: '16px',
        color: theme.text.primary,
        flexShrink: 0,
        alignSelf: 'flex-start',
        transition: 'background-color 0.1s ease'
      }}
    >
      <div>{icon}</div>
      {label && <div style={{ fontSize: '10px' }}>{label}</div>}
    </div>
  );
};
