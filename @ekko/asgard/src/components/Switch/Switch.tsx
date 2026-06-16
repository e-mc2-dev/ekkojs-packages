import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { isBrowser } from '../../_internal';

export type SwitchSize = 'small' | 'normal' | 'large';
export type SwitchType = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type SwitchStyle = 'mui' | 'ios' | 'android';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  labelPosition?: 'left' | 'right';
  size?: SwitchSize;
  type?: SwitchType;
  switchStyle?: SwitchStyle;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  title?: string;
  style?: React.CSSProperties;
  className?: string;
}

const SIZE_CONFIG = {
  small: {
    trackWidth: 32,
    trackHeight: 16,
    thumbSize: 12,
    thumbOffset: 2,
    fontSize: 12,
    gap: 6
  },
  normal: {
    trackWidth: 44,
    trackHeight: 22,
    thumbSize: 18,
    thumbOffset: 2,
    fontSize: 14,
    gap: 8
  },
  large: {
    trackWidth: 56,
    trackHeight: 28,
    thumbSize: 24,
    thumbOffset: 2,
    fontSize: 16,
    gap: 10
  }
};

// Android style uses wider proportions
const ANDROID_SIZE_CONFIG = {
  small: {
    trackWidth: 40,
    trackHeight: 20,
    thumbSize: 16,
    thumbOffset: 2,
    fontSize: 12,
    gap: 6
  },
  normal: {
    trackWidth: 52,
    trackHeight: 26,
    thumbSize: 22,
    thumbOffset: 2,
    fontSize: 14,
    gap: 8
  },
  large: {
    trackWidth: 64,
    trackHeight: 32,
    thumbSize: 28,
    thumbOffset: 2,
    fontSize: 16,
    gap: 10
  }
};

export const Switch: React.FC<SwitchProps> = ({
  checked: controlledChecked,
  onChange,
  label,
  labelPosition = 'right',
  size = 'normal',
  type = 'primary',
  switchStyle = 'mui',
  disabled = false,
  required = false,
  name,
  value,
  title,
  style,
  className
}) => {
  const { theme } = useTheme();
  const [internalChecked, setInternalChecked] = useState(false);

  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const config = switchStyle === 'android' ? ANDROID_SIZE_CONFIG[size] : SIZE_CONFIG[size];

  const handleClick = () => {
    if (disabled) return;

    const newChecked = !checked;
    if (!isControlled) {
      setInternalChecked(newChecked);
    }
    onChange?.(newChecked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  // Get type color
  const getTypeColor = () => {
    if (type === 'primary') return theme.accent.primary;
    if (type === 'secondary') return theme.accent.secondary;
    return theme.semantic[type];
  };

  const typeColor = getTypeColor();

  const getTrackStyles = (): React.CSSProperties => {
    let backgroundColor: string;

    if (disabled) {
      backgroundColor = theme.border.default;
    } else if (checked) {
      backgroundColor = typeColor;
    } else {
      // Unchecked state - use text.secondary with opacity for visibility
      backgroundColor = `${theme.text.secondary}40`;
    }

    return {
      width: config.trackWidth,
      height: config.trackHeight,
      borderRadius: config.trackHeight / 2,
      backgroundColor,
      position: 'relative',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background-color 0.2s ease',
      opacity: disabled ? 0.5 : 1,
      flexShrink: 0
    };
  };

  const getThumbStyles = (): React.CSSProperties => {
    const checkedOffset = config.trackWidth - config.thumbSize - config.thumbOffset;
    const uncheckedOffset = config.thumbOffset;

    return {
      width: config.thumbSize,
      height: config.thumbSize,
      borderRadius: '50%',
      backgroundColor: theme.background.primary,
      position: 'absolute',
      top: config.thumbOffset,
      left: checked ? checkedOffset : uncheckedOffset,
      transition: 'left 0.2s ease',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
    };
  };

  const getLabelStyles = (): React.CSSProperties => {
    return {
      fontSize: config.fontSize,
      color: disabled ? theme.text.disabled : theme.text.primary,
      cursor: disabled ? 'not-allowed' : 'pointer',
      userSelect: 'none'
    };
  };

  const containerStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: config.gap,
    flexDirection: labelPosition === 'left' ? 'row-reverse' : 'row',
    ...style
  };

  const focusRingStyles: React.CSSProperties = {
    outline: 'none',
    boxShadow: `0 0 0 3px ${typeColor}22`
  };

  return (
    <div
      style={containerStyles}
      className={className}
      title={title}
    >
      <div
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        aria-required={required}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{
          ...getTrackStyles(),
          ...(isBrowser && document.activeElement === document.querySelector(`[role="switch"][aria-checked="${checked}"]`)
            ? focusRingStyles
            : {})
        }}
      >
        <div style={getThumbStyles()} />
      </div>
      {label && (
        <label
          onClick={handleClick}
          style={getLabelStyles()}
        >
          {label}
          {required && (
            <span style={{ color: theme.semantic.error, marginLeft: '4px' }}>*</span>
          )}
        </label>
      )}
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={() => {}}
        disabled={disabled}
        required={required}
        style={{ display: 'none' }}
      />
    </div>
  );
};
