// @ts-nocheck - Pre-existing type issues
import React, { useMemo, forwardRef, useRef, useEffect } from 'react';
import { useTheme, addAlpha } from '../../../theme';
import { SDiv } from '../../SDiv/SDiv';
import { useBreakpoint, useMediaQueryOptional } from '../../../hooks';
import { GridContext, useGridContext } from './GridContext';

// Predefined spacing values (in pixels)
export const GRID_SPACING = {
  none: 0,
  small: 8,
  normal: 16,
  large: 24,
  xlarge: 32
} as const;

export type GridSpacing = keyof typeof GRID_SPACING | number;
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto';
export type GridDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
export type GridWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type GridJustify = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
export type GridAlign = 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';

export interface GridProps {
  // Container or Item
  container?: boolean;
  item?: boolean;

  // Container props
  spacing?: GridSpacing;
  direction?: GridDirection;
  wrap?: GridWrap;
  justifyContent?: GridJustify;
  alignItems?: GridAlign;
  alignContent?: GridAlign;
  columns?: 12 | 24; // Support both 12 and 24 column systems

  // Item props - Responsive column sizing
  xs?: GridColumns;
  sm?: GridColumns;
  md?: GridColumns;
  lg?: GridColumns;
  xl?: GridColumns;

  // Item props - Responsive offsets
  xsOffset?: number;
  smOffset?: number;
  mdOffset?: number;
  lgOffset?: number;
  xlOffset?: number;

  // Item props - Responsive visibility
  xsHidden?: boolean;
  smHidden?: boolean;
  mdHidden?: boolean;
  lgHidden?: boolean;
  xlHidden?: boolean;

  // Flexbox control
  grow?: number;
  shrink?: number;
  order?: number;

  // Styling
  scrollable?: boolean;
  maxHeight?: number | string;
  minHeight?: number | string;
  debug?: boolean;
  disableBreakpoints?: boolean;

  // Standard props
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(({
  container = false,
  item = false,
  spacing = 'normal',
  direction = 'row',
  wrap = 'wrap',
  justifyContent,
  alignItems,
  alignContent,
  columns = 12,
  xs,
  sm,
  md,
  lg,
  xl,
  xsOffset,
  smOffset,
  mdOffset,
  lgOffset,
  xlOffset,
  xsHidden,
  smHidden,
  mdHidden,
  lgHidden,
  xlHidden,
  grow,
  shrink,
  order,
  scrollable = false,
  debug = false,
  maxHeight,
  minHeight,
  className,
  style,
  children,
  disableBreakpoints = false
}, ref) => {
  const { theme } = useTheme();

  // Track parent container for responsive breakpoints
  const containerRef = useRef<HTMLDivElement>(null);
  const gridContext = useGridContext(); // Get breakpoint from parent Grid container
  const mediaQuery = useMediaQueryOptional(); // Get global breakpoint from MediaQueryProvider

  // Priority: Grid context > MediaQuery context > own breakpoint tracking
  // This allows nested grids to use parent's breakpoint while still supporting standalone usage
  const ownBreakpoint = useBreakpoint(container && !gridContext && !mediaQuery ? containerRef : undefined);

  // Resolve spacing value FIRST before using it
  const spacingValue = typeof spacing === 'number' ? spacing : GRID_SPACING[spacing];

  // Determine breakpoint priority: Grid context > MediaQuery > own breakpoint
  const breakpoint = gridContext
    ? {
        current: gridContext.breakpoint,
        width: gridContext.width,
        xs: gridContext.breakpoint === 'xs',
        sm: gridContext.breakpoint === 'sm',
        md: gridContext.breakpoint === 'md',
        lg: gridContext.breakpoint === 'lg',
        xl: gridContext.breakpoint === 'xl'
      }
    : mediaQuery
    ? {
        current: mediaQuery.breakpoint,
        width: mediaQuery.width,
        xs: mediaQuery.breakpoint === 'xs',
        sm: mediaQuery.breakpoint === 'sm',
        md: mediaQuery.breakpoint === 'md',
        lg: mediaQuery.breakpoint === 'lg',
        xl: mediaQuery.breakpoint === 'xl'
      }
    : ownBreakpoint;

  // If item is in a Grid container, use parent's spacing
  const effectiveSpacingValue = gridContext?.spacing ?? spacingValue;

  // Merge containerRef with forwarded ref
  useEffect(() => {
    if (container && containerRef.current && ref) {
      if (typeof ref === 'function') {
        ref(containerRef.current);
      } else {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = containerRef.current;
      }
    }
  }, [container, ref]);

  /**
   * Get the active column value for current breakpoint
   * Uses cascade: xl > lg > md > sm > xs
   */
  const _getActiveColumns = (): GridColumns | undefined => {
    if (disableBreakpoints) return xs;

    const bp = breakpoint.current;

    if (bp === 'xl' && xl !== undefined) return xl;
    if ((bp === 'xl' || bp === 'lg') && lg !== undefined) return lg;
    if ((bp === 'xl' || bp === 'lg' || bp === 'md') && md !== undefined) return md;
    if ((bp === 'xl' || bp === 'lg' || bp === 'md' || bp === 'sm') && sm !== undefined) return sm;
    return xs;
  };

  /**
   * Get the active offset value for current breakpoint
   * Uses cascade: xl > lg > md > sm > xs
   */
  const _getActiveOffset = (): number | undefined => {
    if (disableBreakpoints) return xsOffset;

    const bp = breakpoint.current;

    if (bp === 'xl' && xlOffset !== undefined) return xlOffset;
    if ((bp === 'xl' || bp === 'lg') && lgOffset !== undefined) return lgOffset;
    if ((bp === 'xl' || bp === 'lg' || bp === 'md') && mdOffset !== undefined) return mdOffset;
    if ((bp === 'xl' || bp === 'lg' || bp === 'md' || bp === 'sm') && smOffset !== undefined) return smOffset;
    return xsOffset;
  };

  /**
   * Check if item should be hidden at current breakpoint
   */
  const _isHidden = (): boolean => {
    if (disableBreakpoints) return false;

    const bp = breakpoint.current;

    if (bp === 'xs' && xsHidden) return true;
    if (bp === 'sm' && smHidden) return true;
    if (bp === 'md' && mdHidden) return true;
    if (bp === 'lg' && lgHidden) return true;
    if (bp === 'xl' && xlHidden) return true;

    return false;
  };

  /**
   * Build container styles
   * Container has NO margins, NO padding, NO borders
   * Pure flexbox layout
   */
  const getContainerStyles = (): React.CSSProperties => {
    return {
      display: 'flex',
      flexDirection: direction,
      flexWrap: wrap,
      boxSizing: 'border-box',
      width: '100%',
      ...(justifyContent && { justifyContent }),
      ...(alignItems && { alignItems }),
      ...(alignContent && { alignContent })
    };
  };

  /**
   * Build item styles with calc() formula
   * Formula: flex-basis = (100% / totalColumns * itemColumns) - gap
   * Items use margin for gap spacing
   */
  const itemStyles = useMemo((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      boxSizing: 'border-box'
    };

    // Get active column value for current breakpoint (inline to capture current breakpoint)
    const bp = breakpoint.current;
    let activeColumns: GridColumns | undefined;

    if (disableBreakpoints) {
      activeColumns = xs;
    } else {
      if (bp === 'xl' && xl !== undefined) activeColumns = xl;
      else if ((bp === 'xl' || bp === 'lg') && lg !== undefined) activeColumns = lg;
      else if ((bp === 'xl' || bp === 'lg' || bp === 'md') && md !== undefined) activeColumns = md;
      else if ((bp === 'xl' || bp === 'lg' || bp === 'md' || bp === 'sm') && sm !== undefined) activeColumns = sm;
      else activeColumns = xs;
    }

    // Get active offset
    let activeOffset: number | undefined;
    if (disableBreakpoints) {
      activeOffset = xsOffset;
    } else {
      if (bp === 'xl' && xlOffset !== undefined) activeOffset = xlOffset;
      else if ((bp === 'xl' || bp === 'lg') && lgOffset !== undefined) activeOffset = lgOffset;
      else if ((bp === 'xl' || bp === 'lg' || bp === 'md') && mdOffset !== undefined) activeOffset = mdOffset;
      else if ((bp === 'xl' || bp === 'lg' || bp === 'md' || bp === 'sm') && smOffset !== undefined) activeOffset = smOffset;
      else activeOffset = xsOffset;
    }

    // Calculate width with gap using calc()
    if (activeColumns !== undefined) {
      if (activeColumns === 'auto') {
        baseStyles.flexGrow = 1;
        baseStyles.flexBasis = 0;
        baseStyles.maxWidth = '100%';
      } else {
        const widthPercent = (activeColumns / columns) * 100;

        if (effectiveSpacingValue > 0) {
          // Use calc() to subtract gap from width
          // Each item gets half the gap on left and right
          const halfGap = effectiveSpacingValue / 2;
          baseStyles.flexBasis = `calc(${widthPercent}% - ${effectiveSpacingValue}px)`;
          baseStyles.maxWidth = `calc(${widthPercent}% - ${effectiveSpacingValue}px)`;
          baseStyles.marginLeft = `${halfGap}px`;
          baseStyles.marginRight = `${halfGap}px`;
          baseStyles.marginTop = `${halfGap}px`;
          baseStyles.marginBottom = `${halfGap}px`;
        } else {
          baseStyles.flexBasis = `${widthPercent}%`;
          baseStyles.maxWidth = `${widthPercent}%`;
        }

        baseStyles.flexGrow = 0;
        baseStyles.flexShrink = 0;
      }
    }

    // Apply offset with calc()
    if (activeOffset !== undefined && activeOffset > 0) {
      const offsetPercent = (activeOffset / columns) * 100;

      if (effectiveSpacingValue > 0) {
        const halfGap = effectiveSpacingValue / 2;
        baseStyles.marginLeft = `calc(${offsetPercent}% + ${halfGap}px)`;
      } else {
        baseStyles.marginLeft = `${offsetPercent}%`;
      }
    }

    // Flexbox control overrides
    if (grow !== undefined) baseStyles.flexGrow = grow;
    if (shrink !== undefined) baseStyles.flexShrink = shrink;
    if (order !== undefined) baseStyles.order = order;

    // Hide if needed (check inline to capture current breakpoint)
    if (!disableBreakpoints) {
      if (bp === 'xs' && xsHidden) baseStyles.display = 'none';
      if (bp === 'sm' && smHidden) baseStyles.display = 'none';
      if (bp === 'md' && mdHidden) baseStyles.display = 'none';
      if (bp === 'lg' && lgHidden) baseStyles.display = 'none';
      if (bp === 'xl' && xlHidden) baseStyles.display = 'none';
    }

    return baseStyles;
  }, [breakpoint.current, breakpoint.width, effectiveSpacingValue, xs, sm, md, lg, xl, xsOffset, smOffset, mdOffset, lgOffset, xlOffset, xsHidden, smHidden, mdHidden, lgHidden, xlHidden, columns, grow, shrink, order, disableBreakpoints]);

  // Combined styles
  const combinedStyles: React.CSSProperties = {
    ...(container ? getContainerStyles() : itemStyles),
    ...(maxHeight && { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }),
    ...(minHeight && { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }),
    ...style
  };

  // Debug styles
  const debugStyles = debug ? {
    outline: `2px dashed ${theme.semantic.info}`,
    backgroundColor: addAlpha(theme.semantic.info, 0.05)
  } : {};

  // Wrap children in context provider if this is a container
  const wrappedChildren = container ? (
    <GridContext.Provider value={{ breakpoint: breakpoint.current, width: breakpoint.width, spacing: spacingValue }}>
      {children}
    </GridContext.Provider>
  ) : children;

  // If scrollable container, use SDiv
  if (container && scrollable) {
    return (
      <SDiv
        ref={containerRef as any}
        className={className}
        style={{ ...combinedStyles, ...debugStyles }}
      >
        {wrappedChildren}
      </SDiv>
    );
  }

  // Regular div for non-scrollable containers and items
  return (
    <div
      ref={container ? containerRef : ref}
      className={className}
      style={{ ...combinedStyles, ...debugStyles }}
    >
      {wrappedChildren}
    </div>
  );
});

Grid.displayName = 'Grid';

export { GRID_BREAKPOINTS } from '../../../hooks';
