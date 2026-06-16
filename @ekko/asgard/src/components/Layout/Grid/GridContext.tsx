import { createContext, useContext } from 'react';
import type { GridBreakpoint } from '../../../hooks';

export interface GridContextValue {
  breakpoint: GridBreakpoint;
  width: number;
  spacing: number; // Add spacing to force re-render on change
}

export const GridContext = createContext<GridContextValue | null>(null);

export const useGridContext = (): GridContextValue | null => {
  return useContext(GridContext);
};
