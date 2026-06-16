import React, { useState } from 'react';
import { useTheme } from '../../theme';

export interface RibbonButtonProps {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'large' | 'small';
  tooltip?: string;
}

export const RibbonButton: React.FC<RibbonButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  size = 'large',
  tooltip
}) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const isLarge = size === 'large';

  return (
    <div
      onClick={() => !disabled && onClick?.()}
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
      title={tooltip}
      style={{
        display: 'flex',
        flexDirection: isLarge ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: isLarge ? 'flex-start' : 'center',
        gap: label ? (isLarge ? '2px' : '4px') : '0',
        padding: isLarge ? '4px 8px' : (label ? '2px 6px' : '0'),
        minWidth: isLarge ? '48px' : 'auto',
        width: isLarge ? 'auto' : (label ? 'auto' : '28px'),
        height: isLarge ? '64px' : '28px',
        backgroundColor: isPressed && !disabled
          ? theme.interactive.active
          : isHovered && !disabled
          ? theme.interactive.hover
          : 'transparent',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? theme.opacity.disabled : 1,
        userSelect: 'none',
        fontSize: isLarge ? '11px' : '10px',
        color: theme.text.primary,
        flexShrink: 0,
        alignSelf: 'flex-start',
        transition: 'background-color 0.1s ease'
      }}
    >
      <div style={{ fontSize: isLarge ? '24px' : '16px' }}>{icon}</div>
      {label && <div style={{ textAlign: 'center', lineHeight: '1.2' }}>{label}</div>}
    </div>
  );
};
