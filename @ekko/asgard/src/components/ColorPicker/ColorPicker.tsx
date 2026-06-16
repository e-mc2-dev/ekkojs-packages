import React, { useState, useEffect, useCallback } from 'react';
import { isBrowser } from '../../_internal';
import { useTheme } from '../../theme';
import { SDiv } from '../SDiv/SDiv';
import { Typography } from '../Typography/Typography';
import type { ColorPickerProps, ColorFormat } from './types';
import { ColorCanvas } from './ColorCanvas';
import { HueSlider } from './HueSlider';
import { OpacitySlider } from './OpacitySlider';
import { ColorInput } from './ColorInput';
import { ColorSwatches } from './ColorSwatches';
import { createColorFromHSLA, formatColor, getColorName, getComplementary, getAnalogous, getTriadic, getSplitComplementary } from './utils';
import type { Color } from './utils';

const DEFAULT_COLOR: Color = createColorFromHSLA(0, 100, 50, 1);
const STORAGE_KEY_RECENT = 'colorpicker_recent_colors';
const STORAGE_KEY_CUSTOM = 'colorpicker_custom_swatches';

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  defaultValue = DEFAULT_COLOR,
  onChange,
  onChangeComplete,
  mode = 'classic',
  showAlpha = true,
  showEyedropper = true,
  showColorName = true,
  format: initialFormat = 'hex',
  onFormatChange,
  showSwatches = true,
  customSwatches,
  onCustomSwatchesChange,
  maxRecentColors = 6,
  showHarmony = mode === 'advanced',
  width = 500,
  className = ''
}) => {
  const { theme } = useTheme();

  // Color state
  const [currentColor, setCurrentColor] = useState<Color>(value || defaultValue);
  const [previousColor] = useState<Color>(value || defaultValue);
  const [format, setFormat] = useState<ColorFormat>(initialFormat);

  // Recent colors
  const [recentColors, setRecentColors] = useState<Color[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RECENT);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Custom swatches
  const [localCustomSwatches, setLocalCustomSwatches] = useState<Color[]>(() => {
    if (customSwatches) return customSwatches;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const effectiveCustomSwatches = customSwatches || localCustomSwatches;

  // Update when controlled value changes
  useEffect(() => {
    if (value) {
      setCurrentColor(value);
    }
  }, [value]);

  // Handle color change
  const handleColorChange = useCallback((newColor: Color) => {
    setCurrentColor(newColor);
    onChange?.(newColor);
  }, [onChange]);

  // Handle change complete (add to recent colors)
  const handleChangeComplete = useCallback((color: Color) => {
    onChangeComplete?.(color);

    // Add to recent colors - only if it's not already there
    const colorString = formatColor(color, 'hex');
    const alreadyExists = recentColors.some(c => formatColor(c, 'hex') === colorString);

    if (!alreadyExists) {
      const newRecent = [color, ...recentColors].slice(0, maxRecentColors);
      setRecentColors(newRecent);
      try {
        localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(newRecent));
      } catch {
        // Ignore storage errors
      }
    }
  }, [onChangeComplete, recentColors, maxRecentColors]);

  // Handle HSL changes
  const handleSaturationLightnessChange = (s: number, l: number) => {
    const newColor = createColorFromHSLA(currentColor.hsl.h, s, l, currentColor.hsl.a);
    handleColorChange(newColor);
  };

  const handleHueChange = (h: number) => {
    const newColor = createColorFromHSLA(h, currentColor.hsl.s, currentColor.hsl.l, currentColor.hsl.a);
    handleColorChange(newColor);
  };

  const handleOpacityChange = (a: number) => {
    const newColor = createColorFromHSLA(
      currentColor.hsl.h,
      currentColor.hsl.s,
      currentColor.hsl.l,
      a
    );
    handleColorChange(newColor);
  };

  // Handle format change
  const handleFormatChange = (newFormat: ColorFormat) => {
    setFormat(newFormat);
    onFormatChange?.(newFormat);
  };

  // Handle swatch selection
  const handleSwatchSelect = (color: Color) => {
    handleColorChange(color);
    handleChangeComplete(color);
  };

  // Handle custom swatch management
  const handleAddToCustom = () => {
    const colorString = formatColor(currentColor, 'hex');
    const exists = effectiveCustomSwatches.some(c => formatColor(c, 'hex') === colorString);
    if (exists) return;

    // Limit to 5 custom swatches max (6th slot is the + button)
    if (effectiveCustomSwatches.length >= 5) return;

    const newSwatches = [...effectiveCustomSwatches, currentColor];

    if (customSwatches) {
      onCustomSwatchesChange?.(newSwatches);
    } else {
      setLocalCustomSwatches(newSwatches);
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(newSwatches));
      } catch {
        // Ignore storage errors
      }
    }
  };

  const handleRemoveCustomSwatch = (index: number) => {
    const newSwatches = effectiveCustomSwatches.filter((_, i) => i !== index);

    if (customSwatches) {
      onCustomSwatchesChange?.(newSwatches);
    } else {
      setLocalCustomSwatches(newSwatches);
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(newSwatches));
      } catch {
        // Ignore storage errors
      }
    }
  };

  // Eyedropper support
  const handleEyedropper = async () => {
    // Button is already hidden if API not available, but double-check for safety
    if (!('EyeDropper' in window)) {
      return;
    }

    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      const colorString = result.sRGBHex;

      const rgb = {
        r: parseInt(colorString.slice(1, 3), 16),
        g: parseInt(colorString.slice(3, 5), 16),
        b: parseInt(colorString.slice(5, 7), 16)
      };

      const { createColorFromRGBA } = await import('./utils');
      const newColor = createColorFromRGBA(rgb.r, rgb.g, rgb.b, currentColor.rgb.a);
      handleColorChange(newColor);
      handleChangeComplete(newColor);
    } catch (err) {
      // User cancelled
    }
  };

  // Get harmony colors
  const harmonyColors = showHarmony ? {
    complementary: getComplementary(currentColor),
    analogous: getAnalogous(currentColor),
    triadic: getTriadic(currentColor),
    splitComplementary: getSplitComplementary(currentColor)
  } : null;

  // Column sizes - all modes use same fixed width (280px for content + 24px padding = 304px total)
  const leftColWidth = 280; // Fixed width for all modes
  const rightColWidth = mode === 'simple' ? 0 : width - leftColWidth - 36; // 36 = padding + gap

  return (
    <SDiv
      className={className}
      style={{
        width: mode === 'simple' ? '304px' : `${width}px`,
        maxWidth: mode === 'simple' ? '304px' : `${width}px`,
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        padding: '12px',
        backgroundColor: theme.background.primary,
        borderRadius: '8px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* LEFT COLUMN: Main color picker */}
      <SDiv
        style={{
          width: `${leftColWidth}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flexShrink: 0
        }}
      >

        {/* Color canvas (for classic and advanced modes) */}
        {mode !== 'simple' && (
          <ColorCanvas
            hue={currentColor.hsl.h}
            saturation={currentColor.hsl.s}
            lightness={currentColor.hsl.l}
            onChange={handleSaturationLightnessChange}
            width={leftColWidth}
            height={180}
          />
        )}

        {/* Hue slider */}
        <HueSlider
          value={currentColor.hsl.h}
          onChange={handleHueChange}
          width={leftColWidth}
        />

        {/* Opacity slider */}
        {showAlpha && (
          <OpacitySlider
            value={currentColor.hsl.a}
            color={currentColor}
            onChange={handleOpacityChange}
            width={leftColWidth}
          />
        )}

        {/* Color input fields */}
        <ColorInput
          color={currentColor}
          format={format}
          onChange={handleColorChange}
          onFormatChange={handleFormatChange}
          showAlpha={showAlpha}
          width={leftColWidth}
        />
      </SDiv>

      {/* RIGHT COLUMN: Swatches & Harmony (only for classic/advanced modes) */}
      {mode !== 'simple' && (
        <SDiv
          style={{
            flex: 1,
            width: `${rightColWidth}px`,
            maxWidth: `${rightColWidth}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {/* Color preview section */}
          <SDiv style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Header with color name */}
            <SDiv style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Typography
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: theme.text.secondary,
                  textTransform: 'uppercase'
                }}
              >
                Color Preview :
              </Typography>
              {showColorName && (
                <Typography
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: theme.text.primary
                  }}
                >
                  {getColorName(currentColor)}
                </Typography>
              )}
            </SDiv>

            <SDiv style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              {/* Previous color */}
              <SDiv style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Typography style={{ fontSize: '9px', color: theme.text.secondary, textAlign: 'center' }}>
                  Previous
                </Typography>
                <SDiv
                  style={{
                    width: '100%',
                    height: '32px',
                    borderRadius: '4px',
                    border: `1px solid ${theme.border.default}`,
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleColorChange(previousColor)}
                  title="Click to restore previous color"
                >
                  {previousColor.rgb.a < 1 && (
                    <SDiv
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `
                          linear-gradient(45deg, #ccc 25%, transparent 25%),
                          linear-gradient(-45deg, #ccc 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #ccc 75%),
                          linear-gradient(-45deg, transparent 75%, #ccc 75%)
                        `,
                        backgroundSize: '12px 12px',
                        backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px'
                      }}
                    />
                  )}
                  <SDiv
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: formatColor(previousColor, 'rgb', true)
                    }}
                  />
                </SDiv>
              </SDiv>

              {/* Current color */}
              <SDiv style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Typography style={{ fontSize: '9px', color: theme.text.secondary, textAlign: 'center' }}>
                  Current
                </Typography>
                <SDiv
                  style={{
                    width: '100%',
                    height: '32px',
                    borderRadius: '4px',
                    border: `2px solid ${theme.accent.primary}`,
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {currentColor.rgb.a < 1 && (
                    <SDiv
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `
                          linear-gradient(45deg, #ccc 25%, transparent 25%),
                          linear-gradient(-45deg, #ccc 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #ccc 75%),
                          linear-gradient(-45deg, transparent 75%, #ccc 75%)
                        `,
                        backgroundSize: '12px 12px',
                        backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px'
                      }}
                    />
                  )}
                  <SDiv
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: formatColor(currentColor, 'rgb', true)
                    }}
                  />
                </SDiv>
              </SDiv>

              {/* Eyedropper button */}
              {showEyedropper && isBrowser && 'EyeDropper' in window && (
                <SDiv style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Typography style={{ fontSize: '9px', color: theme.text.secondary, textAlign: 'center' }}>
                    Pick
                  </Typography>
                  <SDiv
                    onClick={handleEyedropper}
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      border: `1px solid ${theme.border.default}`,
                      backgroundColor: theme.background.secondary,
                      cursor: 'pointer',
                      fontSize: '16px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.currentTarget.style.backgroundColor = theme.interactive.hover;
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.currentTarget.style.backgroundColor = theme.background.secondary;
                    }}
                    title="Pick color from screen"
                  >
                    💧
                  </SDiv>
                </SDiv>
              )}
            </SDiv>
          </SDiv>

          {/* Swatches */}
          {showSwatches && (
            <>
              {/* Custom swatches with + button */}
              <ColorSwatches
                colors={effectiveCustomSwatches}
                selectedColor={currentColor}
                onColorSelect={handleSwatchSelect}
                onColorRemove={handleRemoveCustomSwatch}
                onColorAdd={handleAddToCustom}
                maxColors={5}
                title="Custom"
                allowRemove
                allowAdd
              />

              {/* Recent colors */}
              {recentColors.length > 0 && (
                <ColorSwatches
                  colors={recentColors}
                  selectedColor={currentColor}
                  onColorSelect={handleSwatchSelect}
                  title="Recent"
                />
              )}
            </>
          )}

          {/* Harmony colors (advanced mode) */}
          {showHarmony && harmonyColors && mode === 'advanced' && (
            <SDiv style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Typography
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: theme.text.secondary,
                  textTransform: 'uppercase'
                }}
              >
                Color Harmony
              </Typography>

              {/* Complementary */}
              <SDiv style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Typography style={{ fontSize: '10px', color: theme.text.secondary, width: '90px' }}>
                  Complementary
                </Typography>
                <SDiv
                  onClick={() => handleSwatchSelect(harmonyColors.complementary)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: formatColor(harmonyColors.complementary, 'hex'),
                    border: `1px solid ${theme.border.default}`,
                    cursor: 'pointer'
                  }}
                />
              </SDiv>

              {/* Analogous */}
              <SDiv style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Typography style={{ fontSize: '10px', color: theme.text.secondary, width: '90px' }}>
                  Analogous
                </Typography>
                {harmonyColors.analogous.map((color, i) => (
                  <SDiv
                    key={i}
                    onClick={() => handleSwatchSelect(color)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: formatColor(color, 'hex'),
                      border: `1px solid ${theme.border.default}`,
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </SDiv>

              {/* Triadic */}
              <SDiv style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Typography style={{ fontSize: '10px', color: theme.text.secondary, width: '90px' }}>
                  Triadic
                </Typography>
                {harmonyColors.triadic.map((color, i) => (
                  <SDiv
                    key={i}
                    onClick={() => handleSwatchSelect(color)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: formatColor(color, 'hex'),
                      border: `1px solid ${theme.border.default}`,
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </SDiv>
            </SDiv>
          )}
        </SDiv>
      )}
    </SDiv>
  );
};
