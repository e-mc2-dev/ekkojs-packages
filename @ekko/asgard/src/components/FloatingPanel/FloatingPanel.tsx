import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { isBrowser } from '../../_internal';
import { useTheme } from '../../theme';
import { SDiv } from '../SDiv/SDiv';

export type FloatingPanelPosition =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right'
  | 'left'
  | 'left-top'
  | 'left-bottom'
  | 'right'
  | 'right-top'
  | 'right-bottom';

export interface FloatingPanelProps {
  // Content
  children: React.ReactNode;

  // Anchor element (the parent/trigger element)
  anchorRef: React.RefObject<HTMLElement>;

  // Visibility
  isOpen: boolean;
  onClose?: () => void;

  // Positioning
  position?: FloatingPanelPosition;
  preferredPosition?: FloatingPanelPosition; // If position is auto, try this first
  offset?: number; // Distance from anchor in pixels

  // Sizing
  width?: number | 'auto' | 'fit-content';
  height?: number | 'auto' | 'fit-content';
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  matchAnchorWidth?: boolean; // If true, automatically match anchor width

  // Behavior
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;

  // Styling
  elevation?: number;
  className?: string;
  showArrow?: boolean;
  zIndex?: number;
}

interface PositionCalculation {
  top: number;
  left: number;
  actualPosition: FloatingPanelPosition;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  children,
  anchorRef,
  isOpen,
  onClose,
  position = 'bottom',
  preferredPosition,
  offset = 8,
  width = 'auto',
  height = 'auto',
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  matchAnchorWidth = false,
  closeOnClickOutside = true,
  closeOnEscape = true,
  elevation = 3,
  className = '',
  zIndex = 10000
}) => {
  const { theme } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);
  const [calculatedPosition, setCalculatedPosition] = useState<PositionCalculation | null>(null);

  // Get anchor width directly during render if matchAnchorWidth is enabled
  const anchorWidth = matchAnchorWidth && anchorRef.current
    ? anchorRef.current.getBoundingClientRect().width
    : undefined;

  // Calculate position based on anchor and panel size
  const calculatePosition = useCallback((): PositionCalculation | null => {
    if (!anchorRef.current || !panelRef.current) return null;

    const anchorRect = anchorRef.current.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const positions: FloatingPanelPosition[] = [
      preferredPosition || position,
      'bottom',
      'top',
      'right',
      'left',
      'bottom-right',
      'bottom-left',
      'top-right',
      'top-left',
      'right-top',
      'right-bottom',
      'left-top',
      'left-bottom'
    ];

    // Try each position until we find one that fits
    for (const pos of positions) {
      const coords = getPositionCoordinates(pos, anchorRect, panelRect, offset);

      if (isPositionValid(coords, panelRect, viewportWidth, viewportHeight)) {
        return {
          top: coords.top,
          left: coords.left,
          actualPosition: pos
        };
      }
    }

    // If no position fits perfectly, use the preferred/default position and clamp to viewport
    const coords = getPositionCoordinates(preferredPosition || position, anchorRect, panelRect, offset);
    return {
      top: clamp(coords.top, 0, viewportHeight - panelRect.height),
      left: clamp(coords.left, 0, viewportWidth - panelRect.width),
      actualPosition: preferredPosition || position
    };
  }, [anchorRef, position, preferredPosition, offset]);

  // Position calculation helpers
  const getPositionCoordinates = (
    pos: FloatingPanelPosition,
    anchorRect: DOMRect,
    panelRect: DOMRect,
    offset: number
  ): { top: number; left: number } => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    switch (pos) {
      case 'top':
        return {
          top: anchorRect.top + scrollY - panelRect.height - offset,
          left: anchorRect.left + scrollX + (anchorRect.width - panelRect.width) / 2
        };
      case 'top-left':
        return {
          top: anchorRect.top + scrollY - panelRect.height - offset,
          left: anchorRect.left + scrollX
        };
      case 'top-right':
        return {
          top: anchorRect.top + scrollY - panelRect.height - offset,
          left: anchorRect.right + scrollX - panelRect.width
        };
      case 'bottom':
        return {
          top: anchorRect.bottom + scrollY + offset,
          left: anchorRect.left + scrollX + (anchorRect.width - panelRect.width) / 2
        };
      case 'bottom-left':
        return {
          top: anchorRect.bottom + scrollY + offset,
          left: anchorRect.left + scrollX
        };
      case 'bottom-right':
        return {
          top: anchorRect.bottom + scrollY + offset,
          left: anchorRect.right + scrollX - panelRect.width
        };
      case 'left':
        return {
          top: anchorRect.top + scrollY + (anchorRect.height - panelRect.height) / 2,
          left: anchorRect.left + scrollX - panelRect.width - offset
        };
      case 'left-top':
        return {
          top: anchorRect.top + scrollY,
          left: anchorRect.left + scrollX - panelRect.width - offset
        };
      case 'left-bottom':
        return {
          top: anchorRect.bottom + scrollY - panelRect.height,
          left: anchorRect.left + scrollX - panelRect.width - offset
        };
      case 'right':
        return {
          top: anchorRect.top + scrollY + (anchorRect.height - panelRect.height) / 2,
          left: anchorRect.right + scrollX + offset
        };
      case 'right-top':
        return {
          top: anchorRect.top + scrollY,
          left: anchorRect.right + scrollX + offset
        };
      case 'right-bottom':
        return {
          top: anchorRect.bottom + scrollY - panelRect.height,
          left: anchorRect.right + scrollX + offset
        };
    }

    return { top: 0, left: 0 };
  };

  const isPositionValid = (
    coords: { top: number; left: number },
    panelRect: DOMRect,
    viewportWidth: number,
    viewportHeight: number
  ): boolean => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    return (
      coords.left >= scrollX &&
      coords.left + panelRect.width <= scrollX + viewportWidth &&
      coords.top >= scrollY &&
      coords.top + panelRect.height <= scrollY + viewportHeight
    );
  };

  const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };

  // Recalculate position when panel opens or content changes
  useEffect(() => {
    if (isOpen && panelRef.current) {
      // Use setTimeout to ensure DOM has updated
      const timer = setTimeout(() => {
        const pos = calculatePosition();
        setCalculatedPosition(pos);
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, children, calculatePosition]);

  // Handle window resize and scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => {
      const pos = calculatePosition();
      setCalculatedPosition(pos);
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, calculatePosition]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };

    // Use timeout to avoid immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeOnClickOutside, onClose, anchorRef]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Get elevation shadow
  const getElevation = (): string => {
    const shadows = [
      'none',
      '0 2px 4px rgba(0, 0, 0, 0.2)',
      '0 4px 8px rgba(0, 0, 0, 0.3)',
      '0 8px 16px rgba(0, 0, 0, 0.4)',
      '0 16px 32px rgba(0, 0, 0, 0.5)'
    ];
    return shadows[Math.min(elevation, 4)];
  };

  if (!isOpen) return null;

  // Use anchor width if matchAnchorWidth is enabled, otherwise use provided width
  const effectiveWidth = matchAnchorWidth && anchorWidth !== undefined
    ? anchorWidth
    : width;

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: calculatedPosition?.top ?? 0,
    left: calculatedPosition?.left ?? 0,
    width: typeof effectiveWidth === 'number' ? `${effectiveWidth}px` : effectiveWidth,
    height: typeof height === 'number' ? `${height}px` : height,
    minWidth: matchAnchorWidth && anchorWidth !== undefined ? `${anchorWidth}px` : minWidth ? `${minWidth}px` : undefined,
    minHeight: minHeight ? `${minHeight}px` : undefined,
    maxWidth: matchAnchorWidth && anchorWidth !== undefined ? `${anchorWidth}px` : maxWidth ? `${maxWidth}px` : undefined,
    maxHeight: maxHeight ? `${maxHeight}px` : undefined,
    backgroundColor: theme.background.elevated,
    border: `1px solid ${theme.border.default}`,
    borderRadius: '4px',
    boxShadow: getElevation(),
    zIndex: zIndex,
    opacity: calculatedPosition ? 1 : 0,
    transition: 'opacity 0.2s ease',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box'
  };

  if (!isBrowser) return null;  // SSR-safe (finding #9): never touch document.body on the server
  return createPortal(
    <SDiv
      ref={panelRef}
      className={className}
      style={panelStyle}
    >
      <div style={{
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {children}
      </div>
    </SDiv>,
    document.body
  );
};
