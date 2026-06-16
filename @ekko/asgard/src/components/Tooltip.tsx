import React, { useState, useRef, useEffect } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 500,
  position = 'bottom'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const anchorRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<number | null>(null);

  const showTooltip = () => {
    if (showTimeoutRef.current) {
      window.clearTimeout(showTimeoutRef.current);
    }
    showTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (showTimeoutRef.current) {
      window.clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    setIsVisible(false);
    setIsPositioned(false);
  };

  // Position tooltip relative to anchor element
  useEffect(() => {
    if (!isVisible || !anchorRef.current || !tooltipRef.current) return;

    const anchorRect = anchorRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    // Calculate initial position based on preferred position
    switch (position) {
      case 'top':
        top = anchorRect.top - tooltipRect.height - 8;
        left = anchorRect.left + (anchorRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = anchorRect.bottom + 8;
        left = anchorRect.left + (anchorRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = anchorRect.top + (anchorRect.height - tooltipRect.height) / 2;
        left = anchorRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = anchorRect.top + (anchorRect.height - tooltipRect.height) / 2;
        left = anchorRect.right + 8;
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

    setTooltipPosition({ top, left });
    setIsPositioned(true);
  }, [isVisible, position]);

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
        ref={anchorRef as any}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            backgroundColor: '#2d2d30',
            color: '#cccccc',
            padding: '6px 10px',
            borderRadius: '3px',
            fontSize: '12px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            border: '1px solid #454545',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            zIndex: 10000,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            opacity: isPositioned ? 1 : 0,
            transition: 'opacity 0.15s ease-in-out'
          }}
        >
          {content}
        </div>
      )}
    </>
  );
};
