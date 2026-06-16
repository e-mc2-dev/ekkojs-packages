// @ts-nocheck - Pre-existing type issues
import React, { useState, useRef, useEffect, Children, isValidElement } from 'react';
import { SDiv } from '../../SDiv/SDiv';
import { useTheme } from '../../../theme';

export type SplitterDirection = 'horizontal' | 'vertical';
export type SplitterSize = number | string; // number = px, 'flex', '50%', '2fr'

export interface SplitterProps {
  /**
   * Split direction: horizontal (left/right) or vertical (top/bottom)
   * @default 'horizontal'
   */
  direction?: SplitterDirection;

  /**
   * Initial sizes for each pane. Must match number of children.
   * - number: fixed pixels (e.g., 200)
   * - 'flex': flexible sizing (flex-grow: 1)
   * - 'Nfr': fractional units (e.g., '2fr' = flex-grow: 2)
   * - 'N%': percentage (e.g., '50%')
   * @default Equal flex distribution for all panes
   */
  sizes?: SplitterSize[];

  /**
   * Minimum sizes for each pane in pixels
   */
  minSizes?: number[];

  /**
   * Maximum sizes for each pane in pixels
   */
  maxSizes?: number[];

  /**
   * Enable resizable gutters between panes
   * @default false
   */
  resizable?: boolean;

  /**
   * Size of the gutter/divider in pixels (only when resizable=true)
   * @default 4
   */
  gutterSize?: number;

  /**
   * Custom styles for the gutter
   */
  gutterStyle?: React.CSSProperties;

  /**
   * Callback when pane sizes change (only when resizable=true)
   */
  onResize?: (sizes: SplitterSize[]) => void;

  /**
   * Custom CSS class
   */
  className?: string;

  /**
   * Custom inline styles
   */
  style?: React.CSSProperties;

  /**
   * Child elements (panes)
   */
  children: React.ReactNode;
}

/**
 * Parse size string to flex-grow value
 */
const parseSizeToFlex = (size: SplitterSize): number | undefined => {
  if (size === 'flex') return 1;
  if (typeof size === 'string' && size.endsWith('fr')) {
    const value = parseFloat(size);
    return isNaN(value) ? 1 : value;
  }
  return undefined;
};

/**
 * Parse size to CSS value
 */
const parseSizeToCss = (size: SplitterSize): { flexGrow?: number; flexBasis?: string; width?: string; height?: string } => {
  // Flex or fractional units
  const flexValue = parseSizeToFlex(size);
  if (flexValue !== undefined) {
    return {
      flexGrow: flexValue,
      flexBasis: 0
    };
  }

  // Percentage
  if (typeof size === 'string' && size.endsWith('%')) {
    return {
      flexGrow: 0,
      flexBasis: size
    };
  }

  // Fixed pixels
  if (typeof size === 'number') {
    return {
      flexGrow: 0,
      flexBasis: `${size}px`
    };
  }

  // Default to flex
  return {
    flexGrow: 1,
    flexBasis: 0
  };
};

/**
 * Splitter - Layout component for horizontal/vertical split panes
 *
 * Can be used purely programmatically (no visual controls) or with resizable gutters.
 * Supports unlimited nesting for complex layouts.
 *
 * @example
 * // Programmatic layout
 * <Splitter direction="horizontal" sizes={[200, 'flex', 300]}>
 *   <Sidebar />
 *   <MainContent />
 *   <RightPanel />
 * </Splitter>
 *
 * @example
 * // Resizable layout
 * <Splitter direction="horizontal" sizes={[200, 'flex']} resizable={true}>
 *   <Sidebar />
 *   <MainContent />
 * </Splitter>
 *
 * @example
 * // Nested splitters
 * <Splitter direction="horizontal" sizes={[200, 'flex']}>
 *   <Sidebar />
 *   <Splitter direction="vertical" sizes={[60, 'flex', 200]}>
 *     <Toolbar />
 *     <Editor />
 *     <StatusBar />
 *   </Splitter>
 * </Splitter>
 */
export const Splitter: React.FC<SplitterProps> = ({
  direction = 'horizontal',
  sizes,
  minSizes,
  maxSizes,
  resizable = false,
  gutterSize = 4,
  gutterStyle,
  onResize,
  className,
  style,
  children
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const childArray = Children.toArray(children).filter(child => isValidElement(child));
  const childCount = childArray.length;

  // Initialize sizes state
  const getInitialSizes = (): SplitterSize[] => {
    if (sizes && sizes.length === childCount) {
      return sizes;
    }
    // Default: equal flex distribution
    return Array(childCount).fill('flex');
  };

  const [currentSizes, setCurrentSizes] = useState<SplitterSize[]>(getInitialSizes());
  const [isDragging, setIsDragging] = useState(false);
  const [dragGutterIndex, setDragGutterIndex] = useState<number | null>(null);
  const dragStartPos = useRef<number>(0);
  const dragStartSizes = useRef<number[]>([]);

  // Update sizes when prop changes
  useEffect(() => {
    if (sizes && sizes.length === childCount) {
      setCurrentSizes(sizes);
    }
  }, [sizes, childCount]);

  // Container styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    ...style
  };

  // Gutter styles
  const getGutterStyles = (index: number): React.CSSProperties => {
    const isHorizontal = direction === 'horizontal';
    const isActive = dragGutterIndex === index;

    return {
      flexShrink: 0,
      flexGrow: 0,
      width: isHorizontal ? `${gutterSize}px` : '100%',
      height: isHorizontal ? '100%' : `${gutterSize}px`,
      backgroundColor: isActive ? theme.accent.primary : theme.accent.primary,
      cursor: isHorizontal ? 'col-resize' : 'row-resize',
      transition: isActive ? 'none' : 'background-color 0.2s',
      userSelect: 'none',
      position: 'relative',
      ...gutterStyle,
      ':hover': {
        backgroundColor: theme.accent.primary
      }
    };
  };

  // Handle gutter mouse down
  const handleGutterMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragGutterIndex(index);

    const isHorizontal = direction === 'horizontal';
    dragStartPos.current = isHorizontal ? e.clientX : e.clientY;

    // Convert current sizes to pixels for dragging
    if (containerRef.current) {
      const containerSize = isHorizontal
        ? containerRef.current.offsetWidth
        : containerRef.current.offsetHeight;

      const pxSizes = currentSizes.map((size, i) => {
        if (typeof size === 'number') return size;
        if (typeof size === 'string' && size.endsWith('%')) {
          return (parseFloat(size) / 100) * containerSize;
        }
        // For flex items, calculate current actual size
        const panes = containerRef.current!.querySelectorAll('[data-splitter-pane]');
        const pane = panes[i] as HTMLElement;
        return isHorizontal ? pane.offsetWidth : pane.offsetHeight;
      });

      dragStartSizes.current = pxSizes;
    }
  };

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging || dragGutterIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const isHorizontal = direction === 'horizontal';
      const currentPos = isHorizontal ? e.clientX : e.clientY;
      const delta = currentPos - dragStartPos.current;

      const newSizes = [...dragStartSizes.current];

      // Adjust the two panes around the gutter
      const leftIndex = dragGutterIndex;
      const rightIndex = dragGutterIndex + 1;

      let newLeftSize = newSizes[leftIndex] + delta;
      let newRightSize = newSizes[rightIndex] - delta;

      // Apply min/max constraints
      if (minSizes) {
        newLeftSize = Math.max(newLeftSize, minSizes[leftIndex] || 0);
        newRightSize = Math.max(newRightSize, minSizes[rightIndex] || 0);
      }
      if (maxSizes) {
        newLeftSize = Math.min(newLeftSize, maxSizes[leftIndex] || Infinity);
        newRightSize = Math.min(newRightSize, maxSizes[rightIndex] || Infinity);
      }

      // Update sizes
      newSizes[leftIndex] = Math.round(newLeftSize);
      newSizes[rightIndex] = Math.round(newRightSize);

      setCurrentSizes(newSizes);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragGutterIndex(null);

      if (onResize) {
        onResize(currentSizes);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragGutterIndex, direction, minSizes, maxSizes, onResize, currentSizes]);

  // Build the layout
  const elements: React.ReactNode[] = [];

  childArray.forEach((child, index) => {
    // Add the pane
    const size = currentSizes[index] || 'flex';
    const cssSize = parseSizeToCss(size);

    const paneStyles: React.CSSProperties = {
      ...cssSize,
      minWidth: direction === 'horizontal' && minSizes?.[index] ? `${minSizes[index]}px` : undefined,
      minHeight: direction === 'vertical' && minSizes?.[index] ? `${minSizes[index]}px` : undefined,
      maxWidth: direction === 'horizontal' && maxSizes?.[index] ? `${maxSizes[index]}px` : undefined,
      maxHeight: direction === 'vertical' && maxSizes?.[index] ? `${maxSizes[index]}px` : undefined,
      overflow: 'hidden',
      position: 'relative'
    };

    elements.push(
      <SDiv
        key={`pane-${index}`}
        style={paneStyles}
        data-splitter-pane={index}
      >
        {child}
      </SDiv>
    );

    // Add gutter if resizable and not the last pane
    if (resizable && index < childCount - 1) {
      elements.push(
        <div
          key={`gutter-${index}`}
          style={getGutterStyles(index)}
          onMouseDown={(e) => handleGutterMouseDown(index, e)}
          data-splitter-gutter={index}
        />
      );
    }
  });

  return (
    <SDiv
      ref={containerRef}
      className={className}
      style={containerStyles}
      data-splitter-container={direction}
    >
      {elements}
    </SDiv>
  );
};

Splitter.displayName = 'Splitter';
