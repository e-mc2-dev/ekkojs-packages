import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Theme } from "./types";
import { darkTheme } from "./themes/dark";
import { themes } from "./themes";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeName: string;
  setThemeName: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
  initialThemeName?: string;
  /** Controlled theme: when provided, the provider renders exactly this theme. The consumer owns the
   *  state (and persistence — e.g. a Mimir atom). */
  theme?: Theme;
}

// Plain feedable theme provider — NO persistence of its own (no localStorage). It is either:
//   - controlled: pass `theme` and the provider renders it verbatim, or
//   - uncontrolled: pass `initialThemeName`/`initialTheme`; `setThemeName` swaps the theme in-memory.
// SSR-safe: state is initialized deterministically and nothing touches `document`/`localStorage`.
// Persistence is the app's responsibility (feed `theme` from a persisted atom).
export const ThemeProvider = ({
  children,
  initialTheme = darkTheme,
  initialThemeName = "dark",
  theme: controlledTheme,
}: ThemeProviderProps) => {
  const [themeName, setThemeNameState] = useState<string>(initialThemeName);
  const [internalTheme, setInternalTheme] = useState<Theme>(themes[initialThemeName] || initialTheme);
  const controlled = controlledTheme != null;
  const theme = controlled ? (controlledTheme as Theme) : internalTheme;
  const setTheme = (t: Theme) => setInternalTheme(t);
  // Uncontrolled: swapping the name swaps the theme object from the registry (in-memory only).
  const setThemeName = (name: string) => {
    setThemeNameState(name);
    const next = themes[name];
    if (next) setInternalTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
