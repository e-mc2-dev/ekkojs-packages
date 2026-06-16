import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../theme';

export interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: React.ReactNode;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  active?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  disabled = false,
  tooltip,
  tooltipPosition = 'bottom',
  active = false
}) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<number | null>(null);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);

    if (tooltip) {
      if (showTimeoutRef.current) {
        window.clearTimeout(showTimeoutRef.current);
      }
      showTimeoutRef.current = window.setTimeout(() => {
        setShowTooltip(true);
      }, 500);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);

    if (showTimeoutRef.current) {
      window.clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    setShowTooltip(false);
    setIsPositioned(false);
  };

  // Position tooltip
  useEffect(() => {
    if (!showTooltip || !buttonRef.current || !tooltipRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (tooltipPosition) {
      case 'top':
        top = buttonRect.top - tooltipRect.height - 8;
        left = buttonRect.left + (buttonRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = buttonRect.bottom + 8;
        left = buttonRect.left + (buttonRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = buttonRect.top + (buttonRect.height - tooltipRect.height) / 2;
        left = buttonRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = buttonRect.top + (buttonRect.height - tooltipRect.height) / 2;
        left = buttonRect.right + 8;
        break;
    }

    // Adjust if tooltip would go off screen
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }

    if (top < 8) {
      top = 8;
    } else if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    setTooltipPos({ top, left });
    setIsPositioned(true);
  }, [showTooltip, tooltipPosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        window.clearTimeout(showTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={buttonRef as any}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: active
            ? theme.interactive.active
            : isPressed && !disabled
            ? theme.interactive.active
            : isHovered && !disabled
            ? theme.interactive.hover
            : 'transparent',
          color: disabled ? theme.text.disabled : theme.text.primary,
          cursor: disabled ? 'default' : 'pointer',
          padding: '0',
          outline: 'none',
          transition: 'background-color 0.1s ease',
          fontSize: '16px',
          flexShrink: 0,
          userSelect: 'none',
          opacity: disabled ? theme.opacity.disabled : 1
        }}
      >
        {icon}
      </div>
      {showTooltip && tooltip && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`,
            backgroundColor: theme.components.tooltip.background,
            color: theme.components.tooltip.text,
            padding: '6px 10px',
            borderRadius: '3px',
            fontSize: '12px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            border: `1px solid ${theme.components.tooltip.border}`,
            boxShadow: theme.components.tooltip.shadow,
            zIndex: 10000,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            opacity: isPositioned ? 1 : 0,
            transition: 'opacity 0.15s ease-in-out'
          }}
        >
          {tooltip}
        </div>
      )}
    </>
  );
};
