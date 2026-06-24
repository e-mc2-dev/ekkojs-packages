import React, { useEffect, useRef } from 'react';
import { useTheme, getSemanticColor, addAlpha } from '../../theme';
import { SDiv } from '../SDiv/SDiv';
import { Typography } from '../Typography/Typography';

export type DrawerAnchor = 'left' | 'right' | 'top' | 'bottom';
export type DrawerVariant = 'temporary' | 'persistent' | 'permanent';
export type DrawerSemantic = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type DrawerHeaderSize = 'small' | 'normal' | 'big';

export interface DrawerProps {
  /**
   * If true, the drawer is open
   */
  open: boolean;

  /**
   * Callback fired when the drawer should close
   */
  onClose?: () => void;

  /**
   * The anchor side of the drawer
   * @default 'left'
   */
  anchor?: DrawerAnchor;

  /**
   * The variant of the drawer
   * - temporary: Overlay drawer with backdrop (default)
   * - persistent: Pushes content, no backdrop
   * - permanent: Always visible, no backdrop
   * @default 'temporary'
   */
  variant?: DrawerVariant;

  /**
   * Width of drawer (for left/right anchors) or height (for top/bottom anchors)
   * @default 280
   */
  size?: number | string;

  /**
   * Semantic color for the drawer
   */
  semantic?: DrawerSemantic;

  /**
   * Enable backdrop
   * @default true for temporary, false for persistent/permanent
   */
  backdrop?: boolean;

  /**
   * Backdrop opacity
   * @default 0.5
   */
  backdropOpacity?: number;

  /**
   * Close drawer when clicking backdrop
   * @default true
   */
  closeOnBackdropClick?: boolean;

  /**
   * Close drawer when pressing Escape key
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Elevation shadow depth (0-24)
   * @default 16
   */
  elevation?: number;

  /**
   * Hide backdrop (for temporary variant)
   * @default false
   */
  hideBackdrop?: boolean;

  /**
   * Drawer title
   */
  title?: string;

  /**
   * Show close button in header
   * @default true for temporary variant
   */
  showCloseButton?: boolean;

  /**
   * Header size variant
   * @default 'normal'
   */
  headerSize?: DrawerHeaderSize;

  /**
   * Custom header content
   */
  header?: React.ReactNode;

  /**
   * Custom footer content
   */
  footer?: React.ReactNode;

  /**
   * Padding of the scrollable content body.
   * Set to 0 for full-bleed content that manages its own layout
   * (e.g. a chat panel with its own header / scroll-area / input).
   * @default 16
   */
  contentPadding?: number | string;

  /**
   * Drawer content
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;

  /**
   * Z-index for the drawer
   * @default 1200
   */
  zIndex?: number;
}

/**
 * Drawer - A theme-compliant panel that slides in from the edge of the screen
 *
 * Features:
 * - Four anchor positions (left, right, top, bottom)
 * - Three variants (temporary, persistent, permanent)
 * - Theme-compliant styling with semantic colors
 * - Smooth slide-in/out animations
 * - Backdrop overlay with configurable opacity
 * - Keyboard support (Escape to close)
 * - Uses SDiv for scrollable content
 * - Elevation shadows
 */
export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  anchor = 'left',
  variant = 'temporary',
  size = 280,
  semantic,
  backdrop = variant === 'temporary',
  backdropOpacity = 0.5,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  elevation = 16,
  hideBackdrop = false,
  title,
  showCloseButton = variant === 'temporary',
  headerSize = 'normal',
  header,
  footer,
  contentPadding = 16,
  children,
  className,
  style,
  zIndex = 1200
}) => {
  const { theme } = useTheme();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Header size configurations
  const headerSizeConfig = {
    small: {
      padding: '6px 10px',
      titleVariant: 'body1' as const,
      closeButtonSize: 16,
      closeButtonPadding: 3
    },
    normal: {
      padding: '8px 12px',
      titleVariant: 'subtitle1' as const,
      closeButtonSize: 18,
      closeButtonPadding: 4
    },
    big: {
      padding: '12px 16px',
      titleVariant: 'h6' as const,
      closeButtonSize: 24,
      closeButtonPadding: 6
    }
  };

  const headerConfig = headerSizeConfig[headerSize];

  // Handle Escape key
  useEffect(() => {
    if (!open || !closeOnEscape || variant === 'permanent') return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, variant, onClose]);

  // Handle click outside (for temporary variant with backdrop)
  const handleBackdropClick = () => {
    if (closeOnBackdropClick && onClose) {
      onClose();
    }
  };

  // Don't render if permanent variant and not open
  if (variant === 'permanent' && !open) return null;

  // Determine drawer dimensions and position
  const isHorizontal = anchor === 'left' || anchor === 'right';
  const drawerSize = typeof size === 'number' ? `${size}px` : size;

  // Get semantic color if provided
  const semanticColor = semantic ? getSemanticColor(semantic, theme) : null;

  // Calculate box shadow based on elevation
  const getElevation = (elevation: number): string => {
    if (elevation === 0) return 'none';
    const umbra = elevation * 2;
    const penumbra = elevation;
    const ambient = elevation * 3;
    return `0px ${umbra}px ${umbra * 2}px rgba(0,0,0,0.2),
            0px ${penumbra}px ${penumbra * 3}px rgba(0,0,0,0.14),
            0px ${ambient}px ${ambient}px rgba(0,0,0,0.12)`;
  };

  // Base styles for drawer
  const drawerBaseStyles: React.CSSProperties = {
    position: variant === 'permanent' ? 'relative' : 'fixed',
    backgroundColor: theme.background.elevated,
    borderRight: anchor === 'left' ? `1px solid ${theme.border.default}` : 'none',
    borderLeft: anchor === 'right' ? `1px solid ${theme.border.default}` : 'none',
    borderBottom: anchor === 'top' ? `1px solid ${theme.border.default}` : 'none',
    borderTop: anchor === 'bottom' ? `1px solid ${theme.border.default}` : 'none',
    boxShadow: variant !== 'permanent' ? getElevation(elevation) : 'none',
    zIndex: variant === 'permanent' ? 'auto' : zIndex,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 225ms cubic-bezier(0, 0, 0.2, 1)',
    ...style
  };

  // Position and size based on anchor
  const getDrawerStyles = (): React.CSSProperties => {
    const common = {
      ...drawerBaseStyles,
      top: anchor === 'top' ? 0 : anchor === 'bottom' ? 'auto' : 0,
      bottom: anchor === 'bottom' ? 0 : anchor === 'top' ? 'auto' : 0,
      left: anchor === 'left' ? 0 : anchor === 'right' ? 'auto' : 0,
      right: anchor === 'right' ? 0 : anchor === 'left' ? 'auto' : 0,
    };

    if (isHorizontal) {
      return {
        ...common,
        width: drawerSize,
        height: '100vh',
        transform: !open ? (anchor === 'left' ? 'translateX(-100%)' : 'translateX(100%)') : 'translateX(0)',
      };
    } else {
      return {
        ...common,
        width: '100vw',
        height: drawerSize,
        transform: !open ? (anchor === 'top' ? 'translateY(-100%)' : 'translateY(100%)') : 'translateY(0)',
      };
    }
  };

  return (
    <>
      {/* Backdrop */}
      {backdrop && !hideBackdrop && open && variant === 'temporary' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: addAlpha('#000000', backdropOpacity),
            zIndex: zIndex - 1,
            transition: 'opacity 225ms cubic-bezier(0, 0, 0.2, 1)',
            opacity: open ? 1 : 0,
          }}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={className}
        style={getDrawerStyles()}
        role="dialog"
        aria-modal={variant === 'temporary'}
      >
        {/* Header */}
        {(title || header || showCloseButton) && (
          <div style={{
            padding: headerConfig.padding,
            borderBottom: `1px solid ${theme.border.default}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: semanticColor ? addAlpha(semanticColor, 0.1) : theme.background.elevated,
            flexShrink: 0
          }}>
            {header || (
              title && (
                <Typography variant={headerConfig.titleVariant} weight="bold">
                  {title}
                </Typography>
              )
            )}

            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: headerConfig.closeButtonPadding,
                  marginRight: -headerConfig.closeButtonPadding,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  color: theme.text.secondary,
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = addAlpha(theme.text.primary, 0.1);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Close drawer"
              >
                <svg
                  width={headerConfig.closeButtonSize}
                  height={headerConfig.closeButtonSize}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content - Using SDiv for scrollability.
            minHeight:0 is required: a flex child defaults to min-height:auto,
            which would let tall content (e.g. a chat panel) grow past the drawer
            and push the header/footer off-screen instead of scrolling. With
            minHeight:0 the body resolves to a definite height, so it scrolls and
            a height:100% child (chat) can fill it without overflowing. */}
        <SDiv
          scrollbarSize="normal"
          semantic={semantic}
          style={{
            flex: 1,
            minHeight: 0,
            padding: contentPadding,
            overflow: 'auto'
          }}
        >
          {children}
        </SDiv>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: 16,
            borderTop: `1px solid ${theme.border.default}`,
            backgroundColor: theme.background.elevated,
            flexShrink: 0
          }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
};
