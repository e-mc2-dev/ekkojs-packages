import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { isBrowser } from '../../_internal';
import { useTheme } from '../../theme';

export interface FloatingWindowProps {
  // Content
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;

  // Visibility
  isOpen: boolean;
  onClose?: () => void;

  // Modal behavior
  modal?: boolean;

  // Positioning
  position?: 'center' | 'floating';
  initialX?: number;
  initialY?: number;

  // Sizing
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  // Behavior
  draggable?: boolean;
  resizable?: boolean;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;

  // Styling
  className?: string;
  showCloseButton?: boolean;
  icon?: React.ReactNode;
}

interface Position {
  x: number;
  y: number;
}

export const FloatingWindow: React.FC<FloatingWindowProps> = ({
  title,
  children,
  actions,
  footer,
  isOpen,
  onClose,
  modal = false,
  position = 'center',
  initialX,
  initialY,
  width = 500,
  height = 'auto',
  minWidth = 300,
  minHeight = 200,
  maxWidth,
  maxHeight,
  draggable = true,
  // resizable is not implemented yet
  closeOnEscape = true,
  closeOnClickOutside = false,
  className = '',
  showCloseButton = true,
  icon
}) => {
  const { theme } = useTheme();
  const windowRef = useRef<HTMLDivElement>(null);
  const titlebarRef = useRef<HTMLDivElement>(null);
  const [windowPosition, setWindowPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });

  // Initialize position
  useEffect(() => {
    if (!isOpen || windowPosition) return;

    if (position === 'center') {
      // Center position is handled by CSS
      setWindowPosition({ x: 0, y: 0 });
    } else {
      // Floating position
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const windowWidth = typeof width === 'number' ? width : 500;
      const windowHeight = typeof height === 'number' ? height : 400;

      const x = initialX ?? (viewportWidth - windowWidth) / 2;
      const y = initialY ?? Math.max(50, (viewportHeight - windowHeight) / 3);

      setWindowPosition({ x, y });
    }
  }, [isOpen, position, initialX, initialY, width, height, windowPosition]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!draggable) return;

    e.preventDefault();
    setIsDragging(true);
    setHasBeenDragged(true);

    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }, [draggable]);

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      // Clamp to viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const windowWidth = windowRef.current?.offsetWidth ?? 0;
      const windowHeight = windowRef.current?.offsetHeight ?? 0;

      const clampedX = Math.max(0, Math.min(newX, viewportWidth - windowWidth));
      const clampedY = Math.max(0, Math.min(newY, viewportHeight - Math.min(windowHeight, 100)));

      setWindowPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen || !closeOnClickOutside || modal) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (windowRef.current && !windowRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeOnClickOutside, modal, onClose]);

  if (!isOpen) return null;

  const isCentered = position === 'center' && !hasBeenDragged;

  const overlayStyle: React.CSSProperties | undefined = modal ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } : undefined;

  const windowStyle: React.CSSProperties = {
    position: modal ? undefined : (isCentered ? 'fixed' : 'absolute'),
    top: modal ? undefined : (isCentered ? '50%' : windowPosition?.y ?? 0),
    left: modal ? undefined : (isCentered ? '50%' : windowPosition?.x ?? 0),
    transform: modal ? undefined : (isCentered ? 'translate(-50%, -50%)' : undefined),
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    minWidth: `${minWidth}px`,
    minHeight: `${minHeight}px`,
    maxWidth: maxWidth ? `${maxWidth}px` : undefined,
    maxHeight: maxHeight ? `${maxHeight}px` : undefined,
    backgroundColor: theme.background.primary,
    border: `1px solid ${theme.border.default}`,
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    zIndex: modal ? undefined : 10000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    cursor: isDragging ? 'grabbing' : undefined
  };

  const titlebarStyle: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: theme.background.secondary,
    borderBottom: `1px solid ${theme.border.default}`,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: draggable ? 'grab' : 'default',
    userSelect: 'none',
    flexShrink: 0
  };

  const titleStyle: React.CSSProperties = {
    flex: 1,
    fontSize: '14px',
    fontWeight: 600,
    color: theme.text.primary,
    margin: 0
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: '16px',
    overflow: 'auto',
    backgroundColor: theme.background.primary,
    color: theme.text.primary
  };

  const actionsStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderTop: `1px solid ${theme.border.default}`,
    backgroundColor: theme.background.secondary,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    flexShrink: 0
  };

  const footerStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderTop: `1px solid ${theme.border.default}`,
    backgroundColor: theme.background.secondary,
    fontSize: '12px',
    color: theme.text.secondary,
    flexShrink: 0
  };

  const closeButtonStyle: React.CSSProperties = {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: theme.text.secondary,
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: 1,
    transition: 'background-color 0.2s, color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const windowContent = (
    <div
      ref={windowRef}
      className={className}
      style={windowStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Titlebar */}
      <div
        ref={titlebarRef}
        style={titlebarStyle}
        onMouseDown={handleDragStart}
      >
        {icon && <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>}
        <h3 style={titleStyle}>{title}</h3>
        {showCloseButton && (
          <button
            style={closeButtonStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.interactive.hover;
              e.currentTarget.style.color = theme.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.text.secondary;
            }}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {children}
      </div>

      {/* Actions */}
      {actions && (
        <div style={actionsStyle}>
          {actions}
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div style={footerStyle}>
          {footer}
        </div>
      )}
    </div>
  );

  if (modal) {
    if (!isBrowser) return null;
    return createPortal(
      <div style={overlayStyle}>
        {windowContent}
      </div>,
      document.body
    );
  }

  if (!isBrowser) return null;
  return createPortal(windowContent, document.body);
};
