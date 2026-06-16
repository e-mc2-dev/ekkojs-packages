import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { GRID_BREAKPOINTS } from './useBreakpoint';
import type { GridBreakpoint } from './useBreakpoint';

// Re-export GridBreakpoint for convenience
export type { GridBreakpoint };

export interface MediaQueryContextValue {
  breakpoint: GridBreakpoint;
  width: number;
  setBreakpoint: (breakpoint: GridBreakpoint) => void;
  setWidth: (width: number) => void;
}

const MediaQueryContext = createContext<MediaQueryContextValue | undefined>(undefined);

/**
 * Get the current breakpoint based on window width
 */
const getBreakpointFromWidth = (width: number): GridBreakpoint => {
  if (width >= GRID_BREAKPOINTS.xl) return 'xl';
  if (width >= GRID_BREAKPOINTS.lg) return 'lg';
  if (width >= GRID_BREAKPOINTS.md) return 'md';
  if (width >= GRID_BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

export interface MediaQueryProviderProps {
  children: ReactNode;
  /**
   * Initial breakpoint (defaults to auto-detect from window)
   */
  defaultBreakpoint?: GridBreakpoint;
  /**
   * Initial width (defaults to window.innerWidth)
   */
  defaultWidth?: number;
  /**
   * Debounce delay for resize events in milliseconds (default: 150ms)
   */
  debounceDelay?: number;
}

/**
 * MediaQueryProvider - Global breakpoint management for the application
 *
 * This provider tracks the window size and provides the current breakpoint
 * to all child components via context. Grid components can consume this
 * to respond to viewport changes.
 */
export const MediaQueryProvider: React.FC<MediaQueryProviderProps> = ({
  children,
  defaultBreakpoint,
  defaultWidth,
  debounceDelay = 150
}) => {
  // Initialize with window size or defaults
  const [width, setWidthState] = useState<number>(() => {
    if (defaultWidth !== undefined) return defaultWidth;
    if (typeof window !== 'undefined') return window.innerWidth;
    return GRID_BREAKPOINTS.md; // SSR fallback
  });

  const [breakpoint, setBreakpointState] = useState<GridBreakpoint>(() => {
    if (defaultBreakpoint) return defaultBreakpoint;
    return getBreakpointFromWidth(width);
  });

  // Allow manual override of breakpoint
  const setBreakpoint = useCallback((bp: GridBreakpoint) => {
    setBreakpointState(bp);
  }, []);

  // Allow manual override of width
  const setWidth = useCallback((w: number) => {
    setWidthState(w);
    // Auto-update breakpoint based on new width
    setBreakpointState(getBreakpointFromWidth(w));
  }, []);

  // Track window resize with debouncing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        const newWidth = window.innerWidth;
        const newBreakpoint = getBreakpointFromWidth(newWidth);

        setWidthState(newWidth);
        setBreakpointState(newBreakpoint);
      }, debounceDelay);
    };

    // Initial measurement
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceDelay]);

  const value: MediaQueryContextValue = {
    breakpoint,
    width,
    setBreakpoint,
    setWidth
  };

  return (
    <MediaQueryContext.Provider value={value}>
      {children}
    </MediaQueryContext.Provider>
  );
};

/**
 * useMediaQuery - Hook to access global breakpoint state
 *
 * Returns the current breakpoint and width from the MediaQueryProvider,
 * along with functions to manually override them if needed.
 *
 * @throws Error if used outside of MediaQueryProvider
 */
export const useMediaQuery = (): MediaQueryContextValue => {
  const context = useContext(MediaQueryContext);

  if (!context) {
    throw new Error('useMediaQuery must be used within a MediaQueryProvider');
  }

  return context;
};

/**
 * useMediaQueryOptional - Optional hook that doesn't throw if provider is missing
 *
 * Returns the context value if available, or undefined if not.
 * Useful for components that can work with or without the provider.
 */
export const useMediaQueryOptional = (): MediaQueryContextValue | undefined => {
  return useContext(MediaQueryContext);
};
