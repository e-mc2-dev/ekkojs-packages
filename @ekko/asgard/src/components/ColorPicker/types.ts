import type { Color } from './utils';

export type ColorFormat = 'hex' | 'rgb' | 'hsl';

export type ColorPickerMode = 'simple' | 'classic' | 'advanced';

export type ColorHarmony = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic';

export interface ColorPickerProps {
  // Value
  value?: Color;
  defaultValue?: Color;
  onChange?: (color: Color) => void;
  onChangeComplete?: (color: Color) => void;

  // Display mode
  mode?: ColorPickerMode;
  showAlpha?: boolean;
  showEyedropper?: boolean;
  showColorName?: boolean;

  // Format
  format?: ColorFormat;
  onFormatChange?: (format: ColorFormat) => void;

  // Swatches
  showSwatches?: boolean;
  customSwatches?: Color[];
  onCustomSwatchesChange?: (swatches: Color[]) => void;
  maxRecentColors?: number;

  // Advanced features
  showHarmony?: boolean;
  showContrastChecker?: boolean;

  // Size
  width?: number;
  height?: number;

  // Style
  className?: string;
}

export interface ColorCanvasProps {
  hue: number;
  saturation: number;
  lightness: number;
  onChange: (saturation: number, lightness: number) => void;
  width?: number;
  height?: number;
}

export interface HueSliderProps {
  value: number; // 0-360
  onChange: (hue: number) => void;
  width?: number;
  height?: number;
  orientation?: 'horizontal' | 'vertical';
}

export interface OpacitySliderProps {
  value: number; // 0-1
  color: Color;
  onChange: (opacity: number) => void;
  width?: number;
  height?: number;
  orientation?: 'horizontal' | 'vertical';
}

export interface ColorInputProps {
  color: Color;
  format: ColorFormat;
  onChange: (color: Color) => void;
  onFormatChange?: (format: ColorFormat) => void;
  showAlpha?: boolean;
  width?: number;
}

export interface ColorSwatchesProps {
  colors: Color[];
  selectedColor?: Color;
  onColorSelect: (color: Color) => void;
  onColorRemove?: (index: number) => void;
  maxColors?: number;
  title?: string;
  allowAdd?: boolean;
  allowRemove?: boolean;
  onColorAdd?: () => void;
}

export interface ColorButtonProps {
  // Value
  value?: Color;
  defaultValue?: Color;
  onChange?: (color: Color) => void;

  // Button appearance
  showLabel?: boolean;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;

  // Picker configuration
  pickerMode?: ColorPickerMode;
  showAlpha?: boolean;
  pickerPosition?: 'bottom' | 'top' | 'left' | 'right';

  // Style
  className?: string;
}

export interface ColorHarmonyDisplayProps {
  baseColor: Color;
  harmony: ColorHarmony;
  onColorSelect: (color: Color) => void;
}

export interface ContrastCheckerProps {
  foreground: Color;
  background: Color;
}
