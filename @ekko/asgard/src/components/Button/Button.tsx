import React, { useState } from 'react';
import { useTheme } from '../../theme';

export type ButtonSize = 'small' | 'normal' | 'large';
export type ButtonVariant = 'filled' | 'outlined' | 'ghost' | 'link';
export type ButtonType = 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info';
export type IconPosition = 'left' | 'right';

export interface ButtonProps {
  // Content
  children?: React.ReactNode;

  // Appearance
  size?: ButtonSize;
  variant?: ButtonVariant;
  type?: ButtonType;

  // Icons
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;

  // State
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;

  // Behavior
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void;

  // HTML attributes
  htmlType?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;

  // Width
  fullWidth?: boolean;
  minWidth?: number;

  // Style override (for ButtonGroup)
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  size = 'normal',
  variant = 'filled',
  type = 'primary',
  leftIcon,
  rightIcon,
  iconOnly = false,
  disabled = false,
  loading = false,
  active = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  htmlType = 'button',
  className = '',
  title,
  fullWidth = false,
  minWidth,
  style
}) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: {
      height: 28,
      fontSize: 12,
      padding: iconOnly ? '4px' : '4px 12px',
      iconSize: 16,
      gap: 6
    },
    normal: {
      height: 36,
      fontSize: 14,
      padding: iconOnly ? '8px' : '8px 16px',
      iconSize: 20,
      gap: 8
    },
    large: {
      height: 44,
      fontSize: 16,
      padding: iconOnly ? '10px' : '12px 24px',
      iconSize: 24,
      gap: 10
    }
  };

  const config = sizeConfig[size];

  // Get color based on type
  const getTypeColor = () => {
    switch (type) {
      case 'primary': return theme.accent.primary;
      case 'secondary': return theme.accent.secondary;
      case 'error': return theme.semantic.error;
      case 'warning': return theme.semantic.warning;
      case 'success': return theme.semantic.success;
      case 'info': return theme.semantic.info;
      default: return theme.accent.primary;
    }
  };

  const typeColor = getTypeColor();

  // Get background color with opacity
  const getBackgroundColor = (opacity: number) => {
    // Parse hex color and add opacity
    const hex = typeColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Get styles based on variant
  const getVariantStyles = () => {
    const baseStyles = {
      border: 'none',
      background: 'transparent',
      color: theme.text.primary
    };

    if (disabled) {
      return {
        ...baseStyles,
        background: variant === 'filled' ? theme.background.tertiary : 'transparent',
        color: theme.text.disabled,
        border: variant === 'outlined' ? `1px solid ${theme.border.default}` : 'none',
        cursor: 'not-allowed',
        opacity: 0.6
      };
    }

    const state = isPressed ? 'pressed' : isHovered ? 'hover' : active ? 'active' : 'normal';

    switch (variant) {
      case 'filled':
        return {
          background: state === 'pressed'
            ? getBackgroundColor(0.8)
            : state === 'hover' || state === 'active'
            ? typeColor
            : getBackgroundColor(0.9),
          color: theme.text.inverse,
          border: 'none'
        };

      case 'outlined':
        return {
          background: state === 'pressed'
            ? getBackgroundColor(0.2)
            : state === 'hover' || state === 'active'
            ? getBackgroundColor(0.1)
            : 'transparent',
          color: typeColor,
          border: `1px solid ${typeColor}`
        };

      case 'ghost':
        return {
          background: state === 'pressed'
            ? getBackgroundColor(0.15)
            : state === 'hover' || state === 'active'
            ? getBackgroundColor(0.1)
            : 'transparent',
          color: typeColor,
          border: 'none'
        };

      case 'link':
        return {
          background: 'transparent',
          color: typeColor,
          border: 'none',
          textDecoration: state === 'hover' ? 'underline' : 'none',
          padding: iconOnly ? config.padding : '0'
        };

      default:
        return baseStyles;
    }
  };

  const variantStyles = getVariantStyles();

  // Handle mouse events
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    setIsPressed(false);
    onMouseLeave?.(e);
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      onClick?.(e);
    }
  };

  // Loading spinner
  const loadingSpinner = (
    <svg
      width={config.iconSize}
      height={config.iconSize}
      viewBox="0 0 24 24"
      style={{
        animation: 'spin 1s linear infinite'
      }}
    >
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeDasharray="60"
        strokeDashoffset="20"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <button
      type={htmlType}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      disabled={disabled || loading}
      title={title}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: config.gap,
        height: iconOnly ? config.height : 'auto',
        minHeight: config.height,
        minWidth: iconOnly ? config.height : minWidth,
        width: fullWidth ? '100%' : iconOnly ? config.height : 'auto',
        padding: config.padding,
        fontSize: config.fontSize,
        fontFamily: 'inherit',
        fontWeight: 500,
        borderRadius: '4px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        outline: 'none',
        position: 'relative',
        whiteSpace: 'nowrap',
        ...variantStyles,
        ...style
      }}
    >
      {loading && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {loadingSpinner}
        </span>
      )}

      {!loading && leftIcon && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: config.iconSize
          }}
        >
          {leftIcon}
        </span>
      )}

      {!iconOnly && children && (
        <span style={{ opacity: loading ? 0.6 : 1 }}>
          {children}
        </span>
      )}

      {!loading && rightIcon && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: config.iconSize
          }}
        >
          {rightIcon}
        </span>
      )}
    </button>
  );
};
