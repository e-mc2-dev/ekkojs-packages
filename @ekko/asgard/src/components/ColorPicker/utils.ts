/**
 * Color utility functions for conversion between RGB, HEX, and HSL formats
 */

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface RGBA extends RGB {
  a: number; // 0-1
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface HSLA extends HSL {
  a: number; // 0-1
}

export interface Color {
  rgb: RGBA;
  hsl: HSLA;
  hex: string;
}

/**
 * Convert HEX to RGB
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Convert HEX to HSL
 */
export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
}

/**
 * Convert HSL to HEX
 */
export function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Parse color string (hex, rgb, rgba, hsl, hsla) to Color object
 */
export function parseColor(colorString: string): Color | null {
  colorString = colorString.trim();

  // HEX format
  if (colorString.startsWith('#')) {
    const rgb = hexToRgb(colorString);
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return {
      rgb: { ...rgb, a: 1 },
      hsl: { ...hsl, a: 1 },
      hex: colorString.toUpperCase()
    };
  }

  // RGB/RGBA format
  const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
    const hsl = rgbToHsl(r, g, b);
    return {
      rgb: { r, g, b, a },
      hsl: { ...hsl, a },
      hex: rgbToHex(r, g, b)
    };
  }

  // HSL/HSLA format
  const hslMatch = colorString.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([\d.]+))?\)/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]);
    const s = parseInt(hslMatch[2]);
    const l = parseInt(hslMatch[3]);
    const a = hslMatch[4] ? parseFloat(hslMatch[4]) : 1;
    const rgb = hslToRgb(h, s, l);
    return {
      rgb: { ...rgb, a },
      hsl: { h, s, l, a },
      hex: rgbToHex(rgb.r, rgb.g, rgb.b)
    };
  }

  return null;
}

/**
 * Format color to string based on format type
 */
export function formatColor(color: Color, format: 'hex' | 'rgb' | 'hsl', includeAlpha: boolean = false): string {
  switch (format) {
    case 'hex':
      return color.hex;
    case 'rgb':
      if (includeAlpha && color.rgb.a < 1) {
        return `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a.toFixed(2)})`;
      }
      return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
    case 'hsl':
      if (includeAlpha && color.hsl.a < 1) {
        return `hsla(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%, ${color.hsl.a.toFixed(2)})`;
      }
      return `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`;
  }
}

/**
 * Create Color object from HSLA
 */
export function createColorFromHSLA(h: number, s: number, l: number, a: number = 1): Color {
  const rgb = hslToRgb(h, s, l);
  return {
    rgb: { ...rgb, a },
    hsl: { h, s, l, a },
    hex: rgbToHex(rgb.r, rgb.g, rgb.b)
  };
}

/**
 * Create Color object from RGBA
 */
export function createColorFromRGBA(r: number, g: number, b: number, a: number = 1): Color {
  const hsl = rgbToHsl(r, g, b);
  return {
    rgb: { r, g, b, a },
    hsl: { ...hsl, a },
    hex: rgbToHex(r, g, b)
  };
}

/**
 * Get color at specific position on canvas (hue + saturation/lightness)
 */
export function getColorFromCanvas(x: number, y: number, hue: number): Color {
  // x = saturation (0-100)
  // y = lightness (100-0, inverted)
  const s = Math.max(0, Math.min(100, x));
  const l = Math.max(0, Math.min(100, 100 - y));
  return createColorFromHSLA(hue, s, l);
}

/**
 * Calculate relative luminance for WCAG contrast
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors (WCAG)
 */
export function getContrastRatio(rgb1: RGB, rgb2: RGB): number {
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get complementary color
 */
export function getComplementary(color: Color): Color {
  const h = (color.hsl.h + 180) % 360;
  return createColorFromHSLA(h, color.hsl.s, color.hsl.l, color.hsl.a);
}

/**
 * Get analogous colors
 */
export function getAnalogous(color: Color): [Color, Color] {
  const h1 = (color.hsl.h + 30) % 360;
  const h2 = (color.hsl.h - 30 + 360) % 360;
  return [
    createColorFromHSLA(h1, color.hsl.s, color.hsl.l, color.hsl.a),
    createColorFromHSLA(h2, color.hsl.s, color.hsl.l, color.hsl.a)
  ];
}

/**
 * Get triadic colors
 */
export function getTriadic(color: Color): [Color, Color] {
  const h1 = (color.hsl.h + 120) % 360;
  const h2 = (color.hsl.h + 240) % 360;
  return [
    createColorFromHSLA(h1, color.hsl.s, color.hsl.l, color.hsl.a),
    createColorFromHSLA(h2, color.hsl.s, color.hsl.l, color.hsl.a)
  ];
}

/**
 * Get split complementary colors
 */
export function getSplitComplementary(color: Color): [Color, Color] {
  const h1 = (color.hsl.h + 150) % 360;
  const h2 = (color.hsl.h + 210) % 360;
  return [
    createColorFromHSLA(h1, color.hsl.s, color.hsl.l, color.hsl.a),
    createColorFromHSLA(h2, color.hsl.s, color.hsl.l, color.hsl.a)
  ];
}

/**
 * Get tetradic (square) colors
 */
export function getTetradic(color: Color): [Color, Color, Color] {
  const h1 = (color.hsl.h + 90) % 360;
  const h2 = (color.hsl.h + 180) % 360;
  const h3 = (color.hsl.h + 270) % 360;
  return [
    createColorFromHSLA(h1, color.hsl.s, color.hsl.l, color.hsl.a),
    createColorFromHSLA(h2, color.hsl.s, color.hsl.l, color.hsl.a),
    createColorFromHSLA(h3, color.hsl.s, color.hsl.l, color.hsl.a)
  ];
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get suggested color name based on hue
 */
export function getColorName(color: Color): string {
  const { h, s, l } = color.hsl;

  // Grayscale
  if (s < 10) {
    if (l < 10) return 'Black';
    if (l < 30) return 'Dark Gray';
    if (l < 50) return 'Gray';
    if (l < 70) return 'Light Gray';
    if (l < 90) return 'Silver';
    return 'White';
  }

  // Low saturation
  if (s < 30) {
    if (l < 30) return 'Dark';
    if (l < 70) return 'Muted';
    return 'Pale';
  }

  // Hue-based names
  const prefix = l < 30 ? 'Dark ' : l > 70 ? 'Light ' : '';

  if (h < 15 || h >= 345) return `${prefix}Red`;
  if (h < 45) return `${prefix}Orange`;
  if (h < 65) return `${prefix}Yellow`;
  if (h < 150) return `${prefix}Green`;
  if (h < 200) return `${prefix}Cyan`;
  if (h < 260) return `${prefix}Blue`;
  if (h < 290) return `${prefix}Purple`;
  if (h < 330) return `${prefix}Magenta`;
  return `${prefix}Pink`;
}
