import { useState, useEffect } from 'react';
import type { RefObject } from 'react';

// Grid breakpoints matching common device sizes
export const GRID_BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920
} as const;

export type GridBreakpoint = keyof typeof GRID_BREAKPOINTS;

export interface BreakpointState {
  current: GridBreakpoint;
  width: number;
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
}

/**
 * Determine breakpoint based on width
 */
const getBreakpointFromWidth = (width: number): GridBreakpoint => {
  if (width >= GRID_BREAKPOINTS.xl) return 'xl';
  if (width >= GRID_BREAKPOINTS.lg) return 'lg';
  if (width >= GRID_BREAKPOINTS.md) return 'md';
  if (width >= GRID_BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

/**
 * Hook to detect and track the current responsive breakpoint
 * Can track either the parent element's width (using ref) or window width
 * Uses ResizeObserver for efficient element size detection
 *
 * @param elementRef - Optional ref to track. If provided, breakpoints are based on this element's width
 *                     If not provided, breakpoints are based on window width
 */
export const useBreakpoint = (elementRef?: RefObject<HTMLElement>): BreakpointState => {
  const [state, setState] = useState<{ width: number; breakpoint: GridBreakpoint }>(() => {
    // Initialize with current width
    if (typeof window === 'undefined') return { width: 0, breakpoint: 'xs' };

    const initialWidth = window.innerWidth;
    return {
      width: initialWidth,
      breakpoint: getBreakpointFromWidth(initialWidth)
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If tracking an element, use ResizeObserver
    if (elementRef?.current) {
      const element = elementRef.current;

      const updateFromElement = () => {
        const width = element.clientWidth;
        const breakpoint = getBreakpointFromWidth(width);

        setState(prev => {
          if (prev.width !== width || prev.breakpoint !== breakpoint) {
            return { width, breakpoint };
          }
          return prev;
        });
      };

      // Initial measurement
      updateFromElement();

      // Debounce timer for resize events
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      // Create ResizeObserver to track element size changes with debouncing
      const resizeObserver = new ResizeObserver((entries) => {
        // Clear existing timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        // Set new timer - only update after 150ms of no resize activity
        debounceTimer = setTimeout(() => {
          for (const entry of entries) {
            const width = entry.contentRect.width;
            const breakpoint = getBreakpointFromWidth(width);

            setState(prev => {
              if (prev.width !== width || prev.breakpoint !== breakpoint) {
                return { width, breakpoint };
              }
              return prev;
            });
          }
        }, 150);
      });

      resizeObserver.observe(element);

      return () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        resizeObserver.disconnect();
      };
    }

    // Otherwise, track window width using matchMedia
    const mediaQueries = {
      sm: window.matchMedia(`(min-width: ${GRID_BREAKPOINTS.sm}px)`),
      md: window.matchMedia(`(min-width: ${GRID_BREAKPOINTS.md}px)`),
      lg: window.matchMedia(`(min-width: ${GRID_BREAKPOINTS.lg}px)`),
      xl: window.matchMedia(`(min-width: ${GRID_BREAKPOINTS.xl}px)`)
    };

    const updateFromWindow = () => {
      const width = window.innerWidth;
      const breakpoint = getBreakpointFromWidth(width);

      setState(prev => {
        if (prev.width !== width || prev.breakpoint !== breakpoint) {
          return { width, breakpoint };
        }
        return prev;
      });
    };

    // Initial check
    updateFromWindow();

    // Debounce timer for window resize
    let windowDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Add listeners to all media queries with debouncing
    const handler = () => {
      if (windowDebounceTimer) {
        clearTimeout(windowDebounceTimer);
      }
      windowDebounceTimer = setTimeout(() => {
        updateFromWindow();
      }, 150);
    };

    mediaQueries.sm.addEventListener('change', handler);
    mediaQueries.md.addEventListener('change', handler);
    mediaQueries.lg.addEventListener('change', handler);
    mediaQueries.xl.addEventListener('change', handler);

    // Cleanup listeners on unmount
    return () => {
      if (windowDebounceTimer) {
        clearTimeout(windowDebounceTimer);
      }
      mediaQueries.sm.removeEventListener('change', handler);
      mediaQueries.md.removeEventListener('change', handler);
      mediaQueries.lg.removeEventListener('change', handler);
      mediaQueries.xl.removeEventListener('change', handler);
    };
  }, [elementRef]);

  // Return current breakpoint and boolean flags for each breakpoint
  return {
    current: state.breakpoint,
    width: state.width,
    xs: state.breakpoint === 'xs',
    sm: state.breakpoint === 'sm',
    md: state.breakpoint === 'md',
    lg: state.breakpoint === 'lg',
    xl: state.breakpoint === 'xl'
  };
};
