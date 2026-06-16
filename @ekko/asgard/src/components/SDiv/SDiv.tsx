import React, { forwardRef } from 'react';
import { useTheme, getSemanticColor, addAlpha } from '../../theme';
import { useSsrId } from '../../_internal';

export type SDivSize = 'normal' | 'large';
export type SDivSemantic = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

export interface SDivProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the scrollbar
   * @default 'normal'
   */
  scrollbarSize?: SDivSize;

  /**
   * Semantic color for the scrollbar thumb
   * If not provided, uses theme.text.secondary
   */
  semantic?: SDivSemantic;

  /**
   * Custom scrollbar thumb color (overrides semantic)
   */
  scrollbarColor?: string;

  /**
   * Custom scrollbar track color
   */
  scrollbarTrackColor?: string;

  /**
   * Scrollbar thumb opacity when not hovered
   * @default 0.3
   */
  scrollbarOpacity?: number;

  /**
   * Scrollbar thumb opacity when hovered
   * @default 0.5
   */
  scrollbarHoverOpacity?: number;

  /**
   * Scrollbar thumb opacity when active/dragging
   * @default 0.6
   */
  scrollbarActiveOpacity?: number;

  /**
   * Border radius for scrollbar thumb
   * @default 4
   */
  scrollbarBorderRadius?: number;

  /**
   * Children elements
   */
  children?: React.ReactNode;
}

/**
 * SDiv - A themed scrollable div component with customizable scrollbars
 *
 * Features:
 * - Theme-compliant scrollbar styling
 * - Size variants (small, normal, large)
 * - Semantic color support
 * - Cross-browser support (Webkit + Firefox)
 * - Forwards all standard div props and ref
 */
export const SDiv = forwardRef<HTMLDivElement, SDivProps>(({
  scrollbarSize = 'normal',
  semantic,
  scrollbarColor,
  scrollbarTrackColor,
  scrollbarOpacity = 0.3,
  scrollbarHoverOpacity = 0.5,
  scrollbarActiveOpacity = 0.6,
  scrollbarBorderRadius = 4,
  className,
  style,
  children,
  ...divProps
}, ref) => {
  const { theme } = useTheme();

  // Generate unique class name for this instance
  const instanceId = useSsrId('sdiv');

  // Determine scrollbar width/height based on size
  const scrollbarDimensions = {
    normal: { width: 12, height: 12, border: 2 },
    large: { width: 20, height: 20, border: 3 }
  };

  const dimensions = scrollbarDimensions[scrollbarSize];

  // Determine thumb color
  const thumbColor = scrollbarColor ||
    (semantic ? getSemanticColor(semantic, theme) : theme.text.secondary);

  // Determine track color
  const trackColor = scrollbarTrackColor || theme.background.secondary;

  return (
    <>
      <div
        ref={ref}
        className={`${instanceId} ${className || ''}`}
        style={{
          overflow: 'auto',
          ...style
        }}
        {...divProps}
      >
        {children}
      </div>

      {/* Scoped scrollbar styles */}
      <style>
        {`
          /* Webkit scrollbar styling (Chrome, Safari, Edge) */
          .${instanceId}::-webkit-scrollbar {
            width: ${dimensions.width}px;
            height: ${dimensions.height}px;
          }

          .${instanceId}::-webkit-scrollbar-track {
            background: ${trackColor};
            border-radius: ${scrollbarBorderRadius}px;
          }

          .${instanceId}::-webkit-scrollbar-thumb {
            background: ${addAlpha(thumbColor, scrollbarOpacity)};
            border-radius: ${scrollbarBorderRadius}px;
            border: ${dimensions.border}px solid ${trackColor};
            transition: background 0.2s ease;
          }

          .${instanceId}::-webkit-scrollbar-thumb:hover {
            background: ${addAlpha(thumbColor, scrollbarHoverOpacity)};
          }

          .${instanceId}::-webkit-scrollbar-thumb:active {
            background: ${addAlpha(thumbColor, scrollbarActiveOpacity)};
          }

          .${instanceId}::-webkit-scrollbar-corner {
            background: ${trackColor};
          }

          /* Firefox scrollbar styling */
          .${instanceId} {
            scrollbar-width: ${scrollbarSize === 'large' ? 'auto' : 'thin'};
            scrollbar-color: ${addAlpha(thumbColor, scrollbarOpacity)} ${trackColor};
          }
        `}
      </style>
    </>
  );
});

SDiv.displayName = 'SDiv';
