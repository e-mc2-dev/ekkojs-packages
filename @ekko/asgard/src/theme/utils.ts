import type { Theme } from './types';

/**
 * Get semantic color based on semantic type
 */
export const getSemanticColor = (
  semantic: 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info',
  theme: Theme
): string => {
  switch (semantic) {
    case 'primary': return theme.accent.primary;
    case 'secondary': return theme.accent.secondary;
    case 'error': return theme.semantic.error;
    case 'warning': return theme.semantic.warning;
    case 'success': return theme.semantic.success;
    case 'info': return theme.semantic.info;
    default: return theme.accent.primary;
  }
};

/**
 * Calculate relative luminance of a color
 * Used for contrast calculations (WCAG)
 */
export const getLuminance = (color: string): number => {
  // Remove # if present
  const hex = color.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const gammaCorrect = (val: number) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };

  const rLinear = gammaCorrect(r);
  const gLinear = gammaCorrect(g);
  const bLinear = gammaCorrect(b);

  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Get appropriate text color (black or white) for a given background color
 * to ensure proper contrast
 */
export const getContrastTextColor = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor);

  // If background is light, use black text, otherwise use white
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Add alpha transparency to a hex color
 */
export const addAlpha = (color: string, alpha: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Lighten a color by a percentage
 */
export const lightenColor = (color: string, percent: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const increase = (val: number) => Math.min(255, Math.floor(val + (255 - val) * (percent / 100)));

  const newR = increase(r).toString(16).padStart(2, '0');
  const newG = increase(g).toString(16).padStart(2, '0');
  const newB = increase(b).toString(16).padStart(2, '0');

  return `#${newR}${newG}${newB}`;
};

/**
 * Darken a color by a percentage
 */
export const darkenColor = (color: string, percent: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const decrease = (val: number) => Math.max(0, Math.floor(val * (1 - percent / 100)));

  const newR = decrease(r).toString(16).padStart(2, '0');
  const newG = decrease(g).toString(16).padStart(2, '0');
  const newB = decrease(b).toString(16).padStart(2, '0');

  return `#${newR}${newG}${newB}`;
};
