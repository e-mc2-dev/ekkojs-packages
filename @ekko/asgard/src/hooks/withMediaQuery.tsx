import React from 'react';
import { useMediaQuery } from './useMediaQuery';
import type { GridBreakpoint } from './useMediaQuery';

/**
 * Breakpoint visibility configuration
 * true = show, false = hide, undefined = use default
 */
export interface MediaQueryVisibility {
  /** Show/hide at xs breakpoint (0px+): true = show, false = hide */
  xs?: boolean;
  /** Show/hide at sm breakpoint (600px+): true = show, false = hide */
  sm?: boolean;
  /** Show/hide at md breakpoint (960px+): true = show, false = hide */
  md?: boolean;
  /** Show/hide at lg breakpoint (1280px+): true = show, false = hide */
  lg?: boolean;
  /** Show/hide at xl breakpoint (1920px+): true = show, false = hide */
  xl?: boolean;
}

/**
 * Props injected by the HOC
 */
export interface WithMediaQueryProps {
  /** MediaQuery prop with breakpoint visibility controls (true = show, false = hide) */
  MQ?: MediaQueryVisibility;
}

/**
 * Options for configuring the HOC behavior
 */
export interface WithMediaQueryOptions {
  /**
   * Default visibility when breakpoint is not defined in MQ prop
   * @default true
   */
  defaultVisible?: boolean;

  /**
   * Custom display name for the wrapped component
   */
  displayName?: string;

  /**
   * Render fallback when component is hidden
   * @default null
   */
  hiddenFallback?: React.ReactNode;
}

/**
 * Check if component should be visible at current breakpoint
 *
 * Smart Logic:
 * - If NO MQ prop provided: always visible (defaultVisible = true)
 * - If MQ contains ANY true value: WHITELIST mode (only show on true breakpoints)
 * - If MQ contains ONLY false values: BLACKLIST mode (hide on false, show on others)
 *
 * Examples:
 * - MQ={{ md: true, lg: true, xl: true }} -> show ONLY on md, lg, xl (whitelist)
 * - MQ={{ xs: false }} -> hide on xs, show on all others (blacklist)
 * - MQ={{ xs: false, sm: false }} -> hide on xs and sm, show on others (blacklist)
 * - No MQ prop -> always visible
 */
const isVisible = (
  currentBreakpoint: GridBreakpoint,
  visibility?: MediaQueryVisibility,
  defaultVisible: boolean = true
): boolean => {
  // No MQ prop at all: use default visibility
  if (!visibility || Object.keys(visibility).length === 0) {
    return defaultVisible;
  }

  const value = visibility[currentBreakpoint as keyof MediaQueryVisibility];

  // Check if MQ contains any true values (whitelist mode)
  const hasAnyTrue = Object.values(visibility).some(v => v === true);

  // If current breakpoint is explicitly defined, use it
  if (value !== undefined) {
    return value;
  }

  // Current breakpoint is undefined:
  // - If whitelist mode (has any true): hide undefined breakpoints
  // - If blacklist mode (only false values): show undefined breakpoints
  return !hasAnyTrue;
};

/**
 * withMediaQuery - Higher-Order Component for responsive visibility control
 *
 * Wraps a component and provides MQ prop for breakpoint visibility control.
 * The component automatically shows/hides based on current breakpoint.
 *
 * @example
 * ```tsx
 * const MyComponent = ({ name }) => <div>Hello {name}!</div>;
 * const ResponsiveComponent = withMediaQuery(MyComponent);
 *
 * // Hide on mobile (xs)
 * <ResponsiveComponent name="World" MQ={{ xs: false }} />
 *
 * // Show only on desktop (md, lg, xl) - others default to false
 * <ResponsiveComponent name="World" MQ={{ md: true, lg: true, xl: true }} />
 *
 * // Hide on mobile and tablet
 * <ResponsiveComponent name="World" MQ={{ xs: false, sm: false }} />
 *
 * // Always visible (no MQ prop or empty)
 * <ResponsiveComponent name="World" />
 * ```
 */
export function withMediaQuery<P extends object>(
  Component: React.ComponentType<P>,
  options: WithMediaQueryOptions = {}
): React.FC<P & WithMediaQueryProps> {

  const {
    defaultVisible = true,
    displayName,
    hiddenFallback = null
  } = options;

  const WrappedComponent: React.FC<P & WithMediaQueryProps> = (props) => {
    const { breakpoint } = useMediaQuery();

    // Extract MQ prop from user and separate from component props
    const { MQ, ...componentProps } = props as any;

    // Determine visibility
    const visible = isVisible(breakpoint, MQ, defaultVisible);

    // Render component or fallback
    if (!visible) {
      return <>{hiddenFallback}</>;
    }

    return <Component {...(componentProps as P)} />;
  };

  // Set display name for debugging
  WrappedComponent.displayName = displayName || `withMediaQuery(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * Helper component for declarative responsive visibility
 * Renders children only when breakpoint conditions are met
 *
 * @example
 * ```tsx
 * // Show only on mobile and tablet
 * <Show MQ={{ xs: true, sm: true }}>
 *   <MobileContent />
 * </Show>
 *
 * // Hide on mobile
 * <Show MQ={{ xs: false }}>
 *   <DesktopContent />
 * </Show>
 * ```
 */
export const Show: React.FC<{
  MQ?: MediaQueryVisibility;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ MQ, children, fallback = null }) => {
  const { breakpoint } = useMediaQuery();

  const visible = isVisible(breakpoint, MQ, true);

  return visible ? <>{children}</> : <>{fallback}</>;
};

/**
 * Convenience component - Hide at specified breakpoints
 *
 * @example
 * ```tsx
 * // Hide on mobile
 * <Hide MQ={{ xs: true }}>
 *   <DesktopContent />
 * </Hide>
 * ```
 */
export const Hide: React.FC<{
  MQ: MediaQueryVisibility;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ MQ, children, fallback }) => {
  const { breakpoint } = useMediaQuery();

  // Invert the MQ values (true becomes false, false becomes true)
  const invertedMQ: MediaQueryVisibility = {};
  for (const key in MQ) {
    const bp = key as keyof MediaQueryVisibility;
    if (MQ[bp] !== undefined) {
      invertedMQ[bp] = !MQ[bp];
    }
  }

  const visible = isVisible(breakpoint, invertedMQ, true);

  return visible ? <>{children}</> : <>{fallback}</>;
};

/**
 * Utility hook for checking visibility in custom logic
 */
export const useMediaQueryVisibility = (
  MQ?: MediaQueryVisibility,
  defaultVisible: boolean = true
): boolean => {
  const { breakpoint } = useMediaQuery();
  return isVisible(breakpoint, MQ, defaultVisible);
};
