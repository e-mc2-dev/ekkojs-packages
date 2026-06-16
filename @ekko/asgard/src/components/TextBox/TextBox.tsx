import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../theme';
import { useSsrId } from '../../_internal';

export type TextBoxSize = 'small' | 'normal' | 'large';
export type TextBoxVariant = 'underline' | 'outlined';
export type TextBoxWidth = 'fixed' | 'full' | 'flex';
export type TextBoxSemantic = 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info';
export type PlaceholderBehavior = 'float' | 'disappear';
export type MaskMode = 'none' | 'strong' | 'smooth';
export type HintTextPosition = 'below' | 'inset';

export interface TextBoxProps {
  // Basic props
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  placeholderBehavior?: PlaceholderBehavior;

  // Appearance
  size?: TextBoxSize;
  variant?: TextBoxVariant;
  width?: TextBoxWidth;
  fixedWidth?: number;
  semantic?: TextBoxSemantic;
  elevation?: number;
  className?: string;

  // Icons
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showIconDivider?: boolean;

  // State
  disabled?: boolean;
  readonly?: boolean;

  // Validation
  validation?: RegExp | ((value: string) => boolean);
  validationMessage?: string;

  // Hint text
  hintText?: string;
  hintTextPosition?: HintTextPosition;

  // Multiline
  multiline?: boolean;
  rows?: number;
  autoExtend?: boolean;
  maxRows?: number;

  // Masking
  mask?: MaskMode;
  maskChar?: string;

  // Input props
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
  autoFocus?: boolean;
  maxLength?: number;

  // Number mode specific
  min?: number;
  max?: number;
  step?: number;
  showSpinners?: boolean; // Show custom SVG up/down buttons
  allowMouseWheel?: boolean; // Allow mouse wheel to inc/dec

  // Events
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClick?: () => void;
}

export const TextBox: React.FC<TextBoxProps> = ({
  value = '',
  onChange,
  placeholder = '',
  placeholderBehavior = 'float',
  size = 'normal',
  variant = 'outlined',
  width = 'flex',
  fixedWidth,
  semantic = 'primary',
  elevation = 0,
  className = '',
  leftIcon,
  rightIcon,
  showIconDivider = true,
  disabled = false,
  readonly = false,
  validation,
  validationMessage,
  hintText,
  hintTextPosition = 'below',
  multiline = false,
  rows = 3,
  autoExtend = false,
  maxRows = 10,
  mask = 'none',
  maskChar = '•',
  type = 'text',
  autoFocus = false,
  maxLength,
  min,
  max,
  step = 1,
  showSpinners = false,
  allowMouseWheel = false,
  onFocus,
  onBlur,
  onKeyDown,
  onClick
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [displayValue, setDisplayValue] = useState(value);
  const [revealPassword, setRevealPassword] = useState(false);
  const [currentRows, setCurrentRows] = useState(rows);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Size configurations
  const sizeConfig = {
    small: { height: 28, fontSize: 12, padding: '4px 6px', iconSize: 16 },
    normal: { height: 36, fontSize: 14, padding: '8px 12px', iconSize: 20 },
    large: { height: 44, fontSize: 16, padding: '12px 16px', iconSize: 24 }
  };

  const config = sizeConfig[size];

  // Width configurations
  const widthStyle = width === 'fixed'
    ? { width: fixedWidth || 200 }
    : width === 'full'
    ? { width: '100%' }
    : { flex: 1 };

  // Semantic colors
  const getSemanticColor = () => {
    if (!isValid) return theme.semantic.error;

    switch (semantic) {
      case 'primary': return theme.accent.primary;
      case 'secondary': return theme.accent.secondary;
      case 'error': return theme.semantic.error;
      case 'warning': return theme.semantic.warning;
      case 'success': return theme.semantic.success;
      case 'info': return theme.semantic.info;
      default: return theme.accent.primary;
    }
  };

  const semanticColor = getSemanticColor();

  // Validation
  useEffect(() => {
    if (validation) {
      if (validation instanceof RegExp) {
        setIsValid(validation.test(value));
      } else if (typeof validation === 'function') {
        setIsValid(validation(value));
      }
    }
  }, [value, validation]);

  // Masking
  useEffect(() => {
    if (mask === 'none') {
      setDisplayValue(value);
    } else if (mask === 'strong') {
      setDisplayValue(maskChar.repeat(value.length));
    } else if (mask === 'smooth') {
      // Show last character briefly, then mask it
      if (value.length === 0) {
        setDisplayValue('');
      } else {
        // Initially show last character unmasked
        const maskedPrefix = maskChar.repeat(value.length - 1);
        const lastChar = value[value.length - 1];
        setDisplayValue(maskedPrefix + lastChar);

        // After 500ms, mask the last character too
        const timer = setTimeout(() => {
          setDisplayValue(maskChar.repeat(value.length));
        }, 500);

        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [value, mask, maskChar]);

  // Handlers
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
  };

  // Number increment/decrement handlers
  const incrementNumber = () => {
    if (type !== 'number' || disabled || readonly) return;

    const currentNum = parseFloat(value) || 0;
    let newNum = currentNum + step;

    if (max !== undefined && newNum > max) newNum = max;
    if (min !== undefined && newNum < min) newNum = min;

    onChange?.(newNum.toString());
  };

  const decrementNumber = () => {
    if (type !== 'number' || disabled || readonly) return;

    const currentNum = parseFloat(value) || 0;
    let newNum = currentNum - step;

    if (min !== undefined && newNum < min) newNum = min;
    if (max !== undefined && newNum > max) newNum = max;

    onChange?.(newNum.toString());
  };

  // Mouse wheel handler - using native event listener to properly prevent default
  useEffect(() => {
    if (type !== 'number' || !allowMouseWheel || !inputRef.current) return;

    const input = inputRef.current;

    const handleWheel = (e: WheelEvent) => {
      if (disabled || readonly) return;

      // Prevent page scroll
      e.preventDefault();
      e.stopPropagation();

      if (e.deltaY < 0) {
        incrementNumber();
      } else {
        decrementNumber();
      }
    };

    // Add event listener with passive: false to allow preventDefault
    input.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      input.removeEventListener('wheel', handleWheel);
    };
  }, [type, allowMouseWheel, disabled, readonly, incrementNumber, decrementNumber]);

  // Sync rows prop when not auto-extending
  useEffect(() => {
    if (multiline && !autoExtend) {
      setCurrentRows(rows);
    }
  }, [multiline, autoExtend, rows]);

  // Auto-extend multiline textareas
  useEffect(() => {
    if (multiline && autoExtend && textareaRef.current) {
      const lineCount = value.split('\n').length;
      const newRows = Math.min(Math.max(rows, lineCount), maxRows);
      setCurrentRows(newRows);
    }
  }, [value, multiline, autoExtend, rows, maxRows]);

  // Calculate placeholder position
  const showFloatingPlaceholder = placeholderBehavior === 'float' && (isFocused || value.length > 0);

  // Get border color (used for both border and inset hint text)
  const getBorderColor = () => {
    if (disabled) {
      return theme.border.default;
    }

    // Always show semantic color if not primary/secondary or if validation failed
    const shouldShowSemanticColor = !isValid || (semantic !== 'primary' && semantic !== 'secondary');
    return shouldShowSemanticColor
      ? semanticColor
      : isFocused
      ? semanticColor
      : isHovered
      ? theme.border.focus
      : theme.border.default;
  };

  const borderColor = getBorderColor();

  // Border styles
  const getBorderStyle = () => {
    // Disabled state gets special styling
    if (disabled) {
      if (variant === 'underline') {
        return {
          borderBottom: `2px dashed ${borderColor}`,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderRadius: 0
        };
      } else {
        return {
          border: `1px dashed ${borderColor}`,
          borderRadius: '4px'
        };
      }
    }

    if (variant === 'underline') {
      return {
        borderBottom: `2px solid ${borderColor}`,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: 0
      };
    } else {
      return {
        border: `1px solid ${borderColor}`,
        borderRadius: '4px'
      };
    }
  };

  // Elevation shadow
  const getElevation = () => {
    if (elevation === 0) return 'none';
    const shadows = [
      'none',
      '0 1px 3px rgba(0,0,0,0.12)',
      '0 2px 6px rgba(0,0,0,0.16)',
      '0 4px 12px rgba(0,0,0,0.20)',
      '0 8px 24px rgba(0,0,0,0.24)'
    ];
    return shadows[Math.min(elevation, 4)];
  };

  // Generate unique ID for autofill styling
  const inputId = useSsrId('textbox');

  return (
    <div
      style={{
        ...widthStyle,
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        paddingBottom: hintTextPosition === 'below' && (hintText || (!isValid && validationMessage)) ? '14px' : '0',
        minHeight: config.height,
        maxHeight: multiline ? undefined : hintTextPosition === 'below' && (hintText || (!isValid && validationMessage)) ? undefined : config.height
      }}
      className={className}
    >
      {/* Autofill style override and scrollbar styling */}
      <style>
        {`
          #${inputId}:-webkit-autofill,
          #${inputId}:-webkit-autofill:hover,
          #${inputId}:-webkit-autofill:focus,
          #${inputId}:-webkit-autofill:active {
            -webkit-background-clip: text;
            -webkit-text-fill-color: ${disabled ? theme.text.disabled : theme.text.primary};
            transition: background-color 5000s ease-in-out 0s;
            box-shadow: inset 0 0 20px 20px ${disabled ? '#1a1515' : readonly ? theme.background.secondary : theme.background.primary};
          }

          /* Scrollbar styling for textarea */
          #${inputId}::-webkit-scrollbar {
            width: 8px;
          }

          #${inputId}::-webkit-scrollbar-track {
            background: ${theme.components.scrollbar.track};
          }

          #${inputId}::-webkit-scrollbar-thumb {
            background: ${theme.components.scrollbar.thumb};
            border-radius: 4px;
          }

          #${inputId}::-webkit-scrollbar-thumb:hover {
            background: ${theme.components.scrollbar.thumbHover};
          }

          /* Firefox scrollbar */
          #${inputId} {
            scrollbar-width: thin;
            scrollbar-color: ${theme.components.scrollbar.thumb} ${theme.components.scrollbar.track};
          }

          /* Number input spinner buttons */
          #${inputId}[type="number"]::-webkit-inner-spin-button,
          #${inputId}[type="number"]::-webkit-outer-spin-button {
            ${showSpinners ? '-webkit-appearance: none; margin: 0;' : `cursor: ${disabled ? 'not-allowed' : 'pointer'}; opacity: ${disabled ? '0.3' : '1'};`}
          }

          #${inputId}[type="number"] {
            ${showSpinners ? '-moz-appearance: textfield;' : ''}
          }
        `}
      </style>
      {/* Main Input Container */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: multiline ? 'flex-start' : 'center',
          height: multiline ? 'auto' : config.height,
          minHeight: multiline ? config.height : undefined,
          backgroundColor: disabled ? '#1a1515' : readonly ? theme.background.secondary : theme.background.primary,
          ...getBorderStyle(),
          boxShadow: getElevation(),
          transition: 'all 0.2s ease',
          position: 'relative',
          opacity: disabled ? 0.6 : 1
        }}
      >
        {/* Left Icon */}
        {leftIcon && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 8px',
                fontSize: config.iconSize,
                color: disabled ? theme.text.disabled : theme.text.secondary
              }}
            >
              {leftIcon}
            </div>
            {showIconDivider && (
              <div
                style={{
                  width: '1px',
                  height: '60%',
                  backgroundColor: theme.border.divider
                }}
              />
            )}
          </>
        )}

        {/* Input Field */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          {/* Floating Placeholder */}
          {placeholder && variant === 'outlined' && placeholderBehavior === 'float' && (
            <label
              style={{
                position: 'absolute',
                left: leftIcon ? '4px' : '12px',
                top: showFloatingPlaceholder ? '-8px' : '50%',
                transform: showFloatingPlaceholder ? 'none' : 'translateY(-50%)',
                fontSize: showFloatingPlaceholder ? '11px' : config.fontSize,
                color: isFocused ? semanticColor : theme.text.secondary,
                backgroundColor: showFloatingPlaceholder ? theme.background.primary : 'transparent',
                padding: showFloatingPlaceholder ? '0 4px' : '0',
                transition: 'all 0.2s ease',
                pointerEvents: 'none',
                zIndex: 1,
                textDecoration: disabled ? 'line-through' : 'none'
              }}
            >
              {placeholder}
            </label>
          )}

          {/* Inset Hint Text */}
          {hintText && hintTextPosition === 'inset' && variant === 'outlined' && (
            <div
              style={{
                position: 'absolute',
                left: leftIcon ? '8px' : '12px',
                bottom: '-6px',
                fontSize: '10px',
                color: borderColor,
                backgroundColor: disabled ? '#1a1515' : readonly ? theme.background.secondary : theme.background.primary,
                padding: '0 4px',
                pointerEvents: 'none',
                zIndex: 1,
                transition: 'all 0.2s ease'
              }}
            >
              {hintText}
            </div>
          )}
          {hintText && hintTextPosition === 'inset' && variant === 'underline' && (
            <div
              style={{
                position: 'absolute',
                left: leftIcon ? '4px' : '0',
                bottom: '2px',
                fontSize: '10px',
                color: borderColor,
                pointerEvents: 'none',
                zIndex: 1,
                transition: 'all 0.2s ease'
              }}
            >
              {hintText}
            </div>
          )}

          {/* Input Element */}
          {!multiline ? (
            <input
              id={inputId}
              ref={inputRef}
              type={type === 'password' && !revealPassword ? 'password' : type}
              value={mask !== 'none' ? displayValue : value}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={onKeyDown}
              disabled={disabled}
              readOnly={readonly}
              autoFocus={autoFocus}
              maxLength={maxLength}
              min={type === 'number' ? min : undefined}
              max={type === 'number' ? max : undefined}
              step={type === 'number' ? step : undefined}
              placeholder={placeholderBehavior === 'disappear' || variant === 'underline' ? placeholder : ''}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                padding: config.padding,
                paddingBottom: hintTextPosition === 'inset' && hintText && size !== 'small' ? '14px' : config.padding,
                fontSize: config.fontSize,
                color: disabled ? theme.text.disabled : theme.text.primary,
                cursor: disabled ? 'not-allowed' : readonly ? 'default' : 'text',
                fontFamily: 'inherit'
              }}
            />
          ) : (
            <textarea
              id={inputId}
              ref={textareaRef}
              value={mask !== 'none' ? displayValue : value}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              readOnly={readonly}
              autoFocus={autoFocus}
              maxLength={maxLength}
              rows={currentRows}
              placeholder={placeholderBehavior === 'disappear' || variant === 'underline' ? placeholder : ''}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                padding: config.padding,
                paddingBottom: hintTextPosition === 'inset' && hintText && size !== 'small' ? '14px' : config.padding,
                fontSize: config.fontSize,
                color: disabled ? theme.text.disabled : theme.text.primary,
                cursor: disabled ? 'not-allowed' : readonly ? 'default' : 'text',
                fontFamily: 'inherit',
                resize: autoExtend ? 'none' : 'vertical',
                minHeight: 'auto'
              }}
            />
          )}
        </div>

        {/* Right Icon or Number Spinners */}
        {((rightIcon || type === 'password') || (type === 'number' && showSpinners)) && (
          <>
            {showIconDivider && (
              <div
                style={{
                  width: '1px',
                  height: '60%',
                  backgroundColor: theme.border.divider
                }}
              />
            )}
            {type === 'number' && showSpinners ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: size === 'small' ? '2px 2px' : '2px 4px',
                  gap: '1px',
                  userSelect: 'none'
                }}
              >
                {/* Up arrow */}
                <div
                  onClick={incrementNumber}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: disabled || readonly ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.3 : 1,
                    padding: '2px',
                    borderRadius: '2px',
                    transition: 'background-color 0.2s',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && !readonly) {
                      e.currentTarget.style.backgroundColor = theme.components.scrollbar.thumbHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg width="12" height="6" viewBox="0 0 12 6" fill="none">
                    <path d="M6 0L12 6H0L6 0Z" fill={theme.components.scrollbar.thumb} />
                  </svg>
                </div>

                {/* Down arrow */}
                <div
                  onClick={decrementNumber}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: disabled || readonly ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.3 : 1,
                    padding: '2px',
                    borderRadius: '2px',
                    transition: 'background-color 0.2s',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && !readonly) {
                      e.currentTarget.style.backgroundColor = theme.components.scrollbar.thumbHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg width="12" height="6" viewBox="0 0 12 6" fill="none">
                    <path d="M6 6L0 0H12L6 6Z" fill={theme.components.scrollbar.thumb} />
                  </svg>
                </div>
              </div>
            ) : (
              <div
                onClick={() => type === 'password' && setRevealPassword(!revealPassword)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 8px',
                  fontSize: config.iconSize,
                  color: disabled ? theme.text.disabled : theme.text.secondary,
                  cursor: type === 'password' ? 'pointer' : 'default'
                }}
              >
                {type === 'password' ? (revealPassword ? '👁️' : '👁️‍🗨️') : rightIcon}
              </div>
            )}
          </>
        )}
      </div>

      {/* Hint Text (below position) or Validation Message */}
      {(hintText && hintTextPosition === 'below') || (!isValid && validationMessage) ? (
        <div
          style={{
            position: 'absolute',
            bottom: '-3px',
            left: variant === 'outlined' ? '12px' : '0',
            fontSize: '10px',
            color: !isValid && validationMessage ? theme.semantic.error : theme.text.secondary,
            transition: 'color 0.2s ease',
            pointerEvents: 'none'
          }}
        >
          {!isValid && validationMessage ? validationMessage : hintText}
        </div>
      ) : null}
    </div>
  );
};
