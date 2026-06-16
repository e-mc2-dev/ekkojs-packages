import React, { useState, useRef } from 'react';
import { useTheme } from '../../theme';

export type CheckboxSize = 'small' | 'normal' | 'large';
export type CheckboxType = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type CheckboxVariant = 'default' | 'icon';

export interface CheckboxProps {
  // Value
  checked?: boolean;
  onChange?: (checked: boolean) => void;

  // Label
  label?: string;
  labelPosition?: 'left' | 'right';

  // Appearance
  size?: CheckboxSize;
  type?: CheckboxType;
  variant?: CheckboxVariant;

  // Icon variant
  icon?: React.ReactNode;
  checkedIcon?: React.ReactNode;

  // States
  disabled?: boolean;
  indeterminate?: boolean;
  required?: boolean;

  // HTML attributes
  name?: string;
  value?: string;
  className?: string;
  title?: string;

  // Events
  onFocus?: () => void;
  onBlur?: () => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onChange,
  label,
  labelPosition = 'right',
  size = 'normal',
  type = 'primary',
  variant = 'default',
  icon,
  checkedIcon,
  disabled = false,
  indeterminate = false,
  required = false,
  name,
  value,
  className = '',
  title,
  onFocus,
  onBlur
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Size configurations
  const sizeConfig = {
    small: { size: 16, fontSize: 12, gap: 6, iconSize: 12 },
    normal: { size: 20, fontSize: 14, gap: 8, iconSize: 14 },
    large: { size: 24, fontSize: 16, gap: 10, iconSize: 16 }
  };

  const config = sizeConfig[size];

  // Get color based on type
  const getTypeColor = () => {
    switch (type) {
      case 'primary': return theme.accent.primary;
      case 'secondary': return theme.accent.secondary;
      case 'success': return theme.semantic.success;
      case 'error': return theme.semantic.error;
      case 'warning': return theme.semantic.warning;
      case 'info': return theme.semantic.info;
      default: return theme.accent.primary;
    }
  };

  const typeColor = getTypeColor();

  // Handle change
  const handleChange = () => {
    if (!disabled) {
      onChange?.(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleChange();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  // Checkbox box styles
  const getBoxStyles = () => {
    // Determine border color
    let borderColor: string;
    if (disabled) {
      borderColor = theme.border.default;
    } else if (checked || indeterminate) {
      borderColor = typeColor;
    } else {
      // Unchecked state - use text.secondary for visibility
      borderColor = theme.text.secondary;
    }

    const baseStyles = {
      width: config.size,
      height: config.size,
      borderRadius: variant === 'icon' ? '50%' : '3px',
      border: `2px solid ${borderColor}`,
      backgroundColor: disabled
        ? theme.background.tertiary
        : checked || indeterminate
        ? typeColor
        : theme.background.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      flexShrink: 0
    };

    if (!disabled && (isHovered || isFocused)) {
      return {
        ...baseStyles,
        boxShadow: `0 0 0 3px ${typeColor}22`,
        borderColor: typeColor
      };
    }

    return baseStyles;
  };

  // Checkmark icon (default)
  const defaultCheckIcon = (
    <svg
      width={config.iconSize}
      height={config.iconSize}
      viewBox="0 0 16 16"
      fill="none"
      style={{ color: theme.text.inverse }}
    >
      <path
        d="M13 4L6 11L3 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Indeterminate icon
  const indeterminateIcon = (
    <svg
      width={config.iconSize}
      height={config.iconSize}
      viewBox="0 0 16 16"
      fill="none"
      style={{ color: theme.text.inverse }}
    >
      <path
        d="M4 8H12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  // Label component
  const labelElement = label && (
    <span
      style={{
        fontSize: config.fontSize,
        color: disabled ? theme.text.disabled : theme.text.primary,
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none'
      }}
    >
      {label}
      {required && (
        <span style={{ color: theme.semantic.error, marginLeft: '2px' }}>*</span>
      )}
    </span>
  );

  return (
    <label
      className={className}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: config.gap,
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexDirection: labelPosition === 'left' ? 'row-reverse' : 'row'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hidden native input */}
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        name={name}
        value={value}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Custom checkbox */}
      <div style={getBoxStyles()}>
        {indeterminate ? (
          indeterminateIcon
        ) : checked ? (
          variant === 'icon' && checkedIcon ? (
            <span style={{ fontSize: config.iconSize, color: theme.text.inverse }}>
              {checkedIcon}
            </span>
          ) : variant === 'icon' && icon ? (
            <span style={{ fontSize: config.iconSize, color: theme.text.inverse }}>
              {icon}
            </span>
          ) : (
            defaultCheckIcon
          )
        ) : null}
      </div>

      {/* Label */}
      {labelElement}
    </label>
  );
};
