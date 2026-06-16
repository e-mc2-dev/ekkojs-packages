import React, { useState, useRef } from 'react';
import { TextBox } from '../TextBox/TextBox';
import type { TextBoxSize, TextBoxVariant, TextBoxSemantic, HintTextPosition } from '../TextBox/TextBox';
import { FloatingPanel } from '../FloatingPanel/FloatingPanel';
import { useTheme } from '../../theme';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;

  // Appearance (inherited from TextBox)
  size?: TextBoxSize;
  variant?: TextBoxVariant;
  semantic?: TextBoxSemantic;
  width?: 'fixed' | 'full' | 'flex';
  fixedWidth?: number;

  // State
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;

  // Validation
  error?: boolean;
  helperText?: string;
  hintTextPosition?: HintTextPosition;

  // Dropdown behavior
  multiple?: boolean;
  autoClose?: boolean;
  maxHeight?: number;
  autocomplete?: boolean; // Enable autocomplete/filtering mode

  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value: controlledValue,
  defaultValue,
  onChange,
  options,
  placeholder = '',
  size = 'normal',
  variant = 'outlined',
  semantic = 'primary',
  width = 'flex',
  fixedWidth,
  disabled = false,
  readonly = false,
  // required = false, // Not used - validation is external
  error = false,
  helperText,
  multiple = false,
  autoClose = true,
  maxHeight = 300,
  autocomplete = false,
  hintTextPosition,
  className
}) => {
  const { theme } = useTheme();
  const [internalValue, setInternalValue] = useState<string | number | undefined>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [searchText, setSearchText] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Get selected option label
  const getSelectedLabel = (): string => {
    if (value === undefined || value === null || value === '') return '';
    const option = options.find(opt => opt.value === value);
    return option?.label || '';
  };

  // Filter options based on search text (autocomplete mode)
  const getFilteredOptions = (): SelectOption[] => {
    if (!autocomplete || searchText.length < 2) {
      return options;
    }
    const search = searchText.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(search));
  };

  const filteredOptions = getFilteredOptions();

  // Handle option selection
  const handleSelect = (optionValue: string | number) => {
    if (controlledValue === undefined) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);

    // Clear search text when option is selected
    if (autocomplete) {
      setSearchText('');
    }

    if (autoClose && !multiple) {
      setIsOpen(false);
    }
  };

  // Handle text input change (autocomplete mode)
  const handleTextChange = (newText: string) => {
    if (!autocomplete) return;

    setSearchText(newText);

    // Open dropdown when typing
    if (!isOpen && newText.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || readonly) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const option = filteredOptions[highlightedIndex];
          if (!option.disabled) {
            handleSelect(option.value);
          }
        }
        break;

      case ' ':
        // In autocomplete mode, space is for typing
        if (!autocomplete) {
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          }
        }
        break;

      case 'Escape':
        e.preventDefault();
        if (autocomplete) {
          setSearchText('');
        }
        setIsOpen(false);
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        }
        break;

      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        if (autocomplete) {
          setSearchText('');
        }
        break;
    }
  };

  const optionStyles = (option: SelectOption, index: number): React.CSSProperties => {
    const isSelected = option.value === value;
    const isHighlighted = index === highlightedIndex;
    const isDisabled = option.disabled;

    return {
      padding: size === 'small' ? '6px 12px' : size === 'normal' ? '8px 16px' : '12px 20px',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      backgroundColor: isSelected
        ? theme.accent.primary + '22'
        : isHighlighted
        ? theme.background.secondary
        : 'transparent',
      color: isDisabled ? theme.text.disabled : theme.text.primary,
      fontSize: size === 'small' ? '12px' : size === 'normal' ? '14px' : '16px',
      transition: 'background-color 0.15s ease',
      opacity: isDisabled ? 0.5 : 1,
      borderLeft: isSelected ? `3px solid ${theme.accent.primary}` : '3px solid transparent',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      boxSizing: 'border-box'
    };
  };

  const handleToggle = () => {
    if (!disabled && !readonly) {
      // In autocomplete mode, don't toggle on click - let typing handle it
      if (autocomplete) {
        if (!isOpen) {
          setIsOpen(true);
          const currentIndex = filteredOptions.findIndex(opt => opt.value === value);
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
        return;
      }

      if (!isOpen) {
        // Set highlighted index to current selection when opening
        const currentIndex = options.findIndex(opt => opt.value === value);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        onKeyDown={handleKeyDown}
        tabIndex={autocomplete ? -1 : (disabled ? -1 : 0)}
        onClick={!autocomplete ? handleToggle : undefined}
        style={{
          outline: 'none',
          display: width === 'full' ? 'block' : 'inline-block',
          width: width === 'full' ? '100%' : undefined
        }}
      >
        <TextBox
          value={autocomplete ? (isOpen ? searchText : getSelectedLabel()) : getSelectedLabel()}
          placeholder={placeholder}
          size={size}
          variant={variant}
          semantic={error ? 'error' : semantic}
          width={width}
          fixedWidth={fixedWidth}
          disabled={disabled}
          readonly={!autocomplete}
          hintText={helperText}
          hintTextPosition={hintTextPosition}
          onChange={autocomplete ? handleTextChange : undefined}
          onFocus={autocomplete ? () => setIsOpen(true) : undefined}
          rightIcon={
            <span style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              display: 'inline-block'
            }}>
              ▼
            </span>
          }
          showIconDivider={false}
        />
      </div>

      {/* Dropdown using FloatingPanel */}
      <FloatingPanel
        anchorRef={containerRef}
        isOpen={isOpen && !disabled}
        onClose={() => {
          setIsOpen(false);
          if (autocomplete) {
            setSearchText('');
          }
        }}
        position="bottom-left"
        offset={0}
        matchAnchorWidth={true}
        closeOnClickOutside={true}
        closeOnEscape={true}
        maxHeight={maxHeight}
      >
        {filteredOptions.length === 0 ? (
          <div
            style={{
              padding: '12px 16px',
              color: theme.text.secondary,
              textAlign: 'center',
              fontSize: size === 'small' ? '12px' : '14px'
            }}
          >
            {autocomplete && searchText.length >= 2 ? 'No matches found' : 'No options available'}
          </div>
        ) : (
          filteredOptions.map((option, index) => (
            <div
              key={option.value}
              data-option
              style={optionStyles(option, index)}
              onClick={() => !option.disabled && handleSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option.label}
            </div>
          ))
        )}
      </FloatingPanel>
    </>
  );
};
