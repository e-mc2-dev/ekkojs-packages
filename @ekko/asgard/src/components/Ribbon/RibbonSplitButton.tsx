import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { isBrowser } from '../../_internal';
import { useTheme } from '../../theme';

export interface RibbonSplitButtonOption {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface RibbonSplitButtonProps {
  icon: React.ReactNode;
  label: string;
  mainAction: () => void;
  options: RibbonSplitButtonOption[];
  disabled?: boolean;
}

export const RibbonSplitButton: React.FC<RibbonSplitButtonProps> = ({
  icon,
  label,
  mainAction,
  options,
  disabled = false
}) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isDropdownHovered, setIsDropdownHovered] = useState(false);
  const [isDropdownPressed, setIsDropdownPressed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
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

  // Calculate menu position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 1,
        left: rect.left
      });
    }
  }, [isOpen]);

  return (
    <div
      ref={buttonRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        opacity: disabled ? theme.opacity.disabled : 1,
        alignSelf: 'flex-start'
      }}
    >
      {/* Main Button */}
      <div
        onClick={() => !disabled && mainAction()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          padding: '4px 8px 2px 8px',
          minWidth: '48px',
          backgroundColor: isPressed && !disabled
            ? theme.interactive.active
            : isHovered && !disabled
            ? theme.interactive.hover
            : 'transparent',
          border: 'none',
          borderTopLeftRadius: '4px',
          borderTopRightRadius: '4px',
          cursor: disabled ? 'default' : 'pointer',
          userSelect: 'none',
          transition: 'background-color 0.1s ease'
        }}
      >
        <div style={{ fontSize: '24px' }}>{icon}</div>
        <div style={{ fontSize: '10px', color: theme.text.primary, lineHeight: '1.1' }}>{label}</div>
      </div>

      {/* Dropdown Toggle */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onMouseEnter={() => setIsDropdownHovered(true)}
        onMouseLeave={() => {
          setIsDropdownHovered(false);
          setIsDropdownPressed(false);
        }}
        onMouseDown={() => setIsDropdownPressed(true)}
        onMouseUp={() => setIsDropdownPressed(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px 8px',
          backgroundColor: isDropdownPressed && !disabled
            ? theme.interactive.active
            : isDropdownHovered && !disabled
            ? theme.interactive.hover
            : 'transparent',
          border: 'none',
          borderTop: `1px solid ${theme.border.default}`,
          borderBottomLeftRadius: '4px',
          borderBottomRightRadius: '4px',
          cursor: disabled ? 'default' : 'pointer',
          userSelect: 'none',
          fontSize: '8px',
          color: theme.text.primary,
          transition: 'background-color 0.1s ease'
        }}
      >
        ▼
      </div>

      {/* Dropdown Menu - Rendered as Portal */}
      {isOpen && !disabled && isBrowser && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            minWidth: '150px',
            backgroundColor: theme.components.menu.background,
            border: `1px solid ${theme.border.default}`,
            borderRadius: '2px',
            zIndex: 10000,
            boxShadow: theme.components.menu.shadow
          }}
        >
          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => {
                option.onClick();
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                color: theme.text.primary,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.components.menu.itemHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {option.icon && <div style={{ fontSize: '16px' }}>{option.icon}</div>}
              <div>{option.label}</div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};
