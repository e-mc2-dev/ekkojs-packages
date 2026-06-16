import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../theme';

export interface RibbonDropdownOption {
  value: string;
  label: string;
}

export interface RibbonDropdownProps {
  value: string;
  options: RibbonDropdownOption[];
  onChange?: (value: string) => void;
  disabled?: boolean;
  width?: number;
}

export const RibbonDropdown: React.FC<RibbonDropdownProps> = ({
  value,
  options,
  onChange,
  disabled = false,
  width = 120
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        width: `${width}px`,
        opacity: disabled ? theme.opacity.disabled : 1,
        alignSelf: 'flex-start'
      }}
    >
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '3px 6px',
          backgroundColor: isHovered && !disabled ? theme.components.dropdown.itemHover : theme.components.dropdown.background,
          border: `1px solid ${theme.components.dropdown.border}`,
          borderRadius: '2px',
          cursor: disabled ? 'default' : 'pointer',
          fontSize: '11px',
          color: theme.text.primary,
          height: '22px'
        }}
      >
        <span>{selectedOption?.label || value}</span>
        <span style={{ fontSize: '8px', marginLeft: '4px' }}>▼</span>
      </div>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: theme.components.dropdown.background,
            border: `1px solid ${theme.components.dropdown.border}`,
            borderRadius: '2px',
            marginTop: '1px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange?.(option.value);
                setIsOpen(false);
              }}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                color: theme.text.primary,
                cursor: 'pointer',
                backgroundColor: option.value === value ? theme.accent.primary : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = theme.accent.primaryHover;
                }
              }}
              onMouseLeave={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
