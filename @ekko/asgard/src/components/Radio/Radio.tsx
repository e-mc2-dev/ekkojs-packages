import React, { useState, useRef } from 'react';
import { useTheme } from '../../theme';

export type RadioSize = 'small' | 'normal' | 'large';
export type RadioType = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

export interface RadioProps {
  // Value
  checked?: boolean;
  onChange?: (checked: boolean) => void;

  // Label
  label?: string;
  labelPosition?: 'left' | 'right';

  // Appearance
  size?: RadioSize;
  type?: RadioType;

  // States
  disabled?: boolean;
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

export const Radio: React.FC<RadioProps> = ({
  checked = false,
  onChange,
  label,
  labelPosition = 'right',
  size = 'normal',
  type = 'primary',
  disabled = false,
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
    small: { size: 16, fontSize: 12, gap: 6, dotSize: 8 },
    normal: { size: 20, fontSize: 14, gap: 8, dotSize: 10 },
    large: { size: 24, fontSize: 16, gap: 10, dotSize: 12 }
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
    if (!disabled && !checked) {
      onChange?.(true);
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

  // Radio circle styles
  const getCircleStyles = () => {
    // Determine border color
    let borderColor: string;
    if (disabled) {
      borderColor = theme.border.default;
    } else if (checked) {
      borderColor = typeColor;
    } else {
      // Unchecked state - use text.secondary for visibility
      borderColor = theme.text.secondary;
    }

    const baseStyles = {
      width: config.size,
      height: config.size,
      borderRadius: '50%',
      border: `2px solid ${borderColor}`,
      backgroundColor: theme.background.primary,
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

  // Inner dot styles
  const getDotStyles = () => {
    return {
      width: config.dotSize,
      height: config.dotSize,
      borderRadius: '50%',
      backgroundColor: disabled ? theme.text.disabled : typeColor,
      transition: 'all 0.2s ease',
      transform: checked ? 'scale(1)' : 'scale(0)',
      opacity: checked ? 1 : 0
    };
  };

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
        type="radio"
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

      {/* Custom radio */}
      <div style={getCircleStyles()}>
        <div style={getDotStyles()} />
      </div>

      {/* Label */}
      {labelElement}
    </label>
  );
};
