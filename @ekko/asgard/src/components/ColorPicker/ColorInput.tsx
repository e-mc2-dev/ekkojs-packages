import React, { useState, useEffect } from 'react';
import { useTheme } from '../../theme';
import { SDiv } from '../SDiv/SDiv';
import { Typography } from '../Typography/Typography';
import { TextBox } from '../TextBox/TextBox';
import type { ColorInputProps, ColorFormat } from './types';
import { formatColor, parseColor, createColorFromRGBA, createColorFromHSLA } from './utils';

export const ColorInput: React.FC<ColorInputProps> = ({
  color,
  format,
  onChange,
  onFormatChange,
  showAlpha = false,
  width
}) => {
  const { theme } = useTheme();
  const [hexInput, setHexInput] = useState(color.hex);
  const [rgbInputs, setRgbInputs] = useState({
    r: String(color.rgb.r),
    g: String(color.rgb.g),
    b: String(color.rgb.b),
    a: String(Math.round(color.rgb.a * 100))
  });
  const [hslInputs, setHslInputs] = useState({
    h: String(color.hsl.h),
    s: String(color.hsl.s),
    l: String(color.hsl.l),
    a: String(Math.round(color.hsl.a * 100))
  });

  // Update inputs when color changes externally
  useEffect(() => {
    setHexInput(color.hex);
    setRgbInputs({
      r: String(color.rgb.r),
      g: String(color.rgb.g),
      b: String(color.rgb.b),
      a: String(Math.round(color.rgb.a * 100))
    });
    setHslInputs({
      h: String(color.hsl.h),
      s: String(color.hsl.s),
      l: String(color.hsl.l),
      a: String(Math.round(color.hsl.a * 100))
    });
  }, [color]);

  // Handle HEX input
  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      const parsed = parseColor(value);
      if (parsed) {
        onChange({ ...parsed, rgb: { ...parsed.rgb, a: color.rgb.a }, hsl: { ...parsed.hsl, a: color.hsl.a } });
      }
    }
  };

  // Handle RGB input
  const handleRgbChange = (channel: 'r' | 'g' | 'b' | 'a', value: string) => {
    const newInputs = { ...rgbInputs, [channel]: value };
    setRgbInputs(newInputs);

    const r = parseInt(newInputs.r) || 0;
    const g = parseInt(newInputs.g) || 0;
    const b = parseInt(newInputs.b) || 0;
    const a = (parseInt(newInputs.a) || 0) / 100;

    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      onChange(createColorFromRGBA(r, g, b, a));
    }
  };

  // Handle HSL input
  const handleHslChange = (channel: 'h' | 's' | 'l' | 'a', value: string) => {
    const newInputs = { ...hslInputs, [channel]: value };
    setHslInputs(newInputs);

    const h = parseInt(newInputs.h) || 0;
    const s = parseInt(newInputs.s) || 0;
    const l = parseInt(newInputs.l) || 0;
    const a = (parseInt(newInputs.a) || 0) / 100;

    if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
      onChange(createColorFromHSLA(h, s, l, a));
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    const colorString = formatColor(color, format, showAlpha);
    try {
      await navigator.clipboard.writeText(colorString);
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  };

  // Format toggle buttons
  const formatButtons: ColorFormat[] = ['hex', 'rgb', 'hsl'];

  return (
    <SDiv
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: width ? `${width}px` : '100%',
        maxWidth: width ? `${width}px` : '100%'
      }}
    >
      {/* Format selector */}
      <SDiv
        style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center'
        }}
      >
        {formatButtons.map(fmt => (
          <SDiv
            key={fmt}
            onClick={() => onFormatChange?.(fmt)}
            style={{
              flex: 1,
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: format === fmt ? theme.accent.primary : theme.background.secondary,
              border: `1px solid ${format === fmt ? theme.accent.primary : theme.border.default}`,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              if (format !== fmt) {
                e.currentTarget.style.backgroundColor = theme.interactive.hover;
              }
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              if (format !== fmt) {
                e.currentTarget.style.backgroundColor = theme.background.secondary;
              }
            }}
          >
            <Typography
              style={{
                fontSize: '11px',
                fontWeight: format === fmt ? 600 : 400,
                color: format === fmt ? theme.text.inverse : theme.text.primary,
                textTransform: 'uppercase'
              }}
            >
              {fmt}
            </Typography>
          </SDiv>
        ))}

        {/* Copy button */}
        <SDiv
          onClick={handleCopy}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: theme.background.secondary,
            border: `1px solid ${theme.border.default}`,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
            e.currentTarget.style.backgroundColor = theme.interactive.hover;
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
            e.currentTarget.style.backgroundColor = theme.background.secondary;
          }}
          title="Copy to clipboard"
        >
          <Typography style={{ fontSize: '11px' }}>📋</Typography>
        </SDiv>
      </SDiv>

      {/* Input fields based on format */}
      {format === 'hex' && (
        <SDiv style={{ paddingTop: '3px' }}>
          <TextBox
            value={hexInput}
            onChange={handleHexChange}
            placeholder="HEX"
            size="small"
            width="full"
            validation={/^#[0-9A-Fa-f]{6}$/}
            validationMessage="Invalid HEX color"
          />
        </SDiv>
      )}

      {format === 'rgb' && (
        <SDiv style={{ display: 'flex', gap: '4px', minHeight: '28px'}}>
          <SDiv style={{ flex: '1 1 0', minWidth: 0, minHeight: '28px', paddingTop: '3px'  }}>
            <TextBox
              value={rgbInputs.r}
              onChange={(v) => handleRgbChange('r', v)}
              placeholder="R"
              size="small"
              width="full"
              type="number"
              min={0}
              max={255}
              step={1}
              showSpinners={true}
              allowMouseWheel={true}
            />
          </SDiv>
          <SDiv style={{ flex: '1 1 0', minWidth: 0, minHeight: '28px', paddingTop: '3px' }}>
            <TextBox
              value={rgbInputs.g}
              onChange={(v) => handleRgbChange('g', v)}
              placeholder="G"
              size="small"
              width="full"
              type="number"
              min={0}
              max={255}
              step={1}
              showSpinners={true}
              allowMouseWheel={true}
            />
          </SDiv>
          <SDiv style={{ flex: '1 1 0', minWidth: 0, minHeight: '28px', paddingTop: '3px' }}>
            <TextBox
              value={rgbInputs.b}
              onChange={(v) => handleRgbChange('b', v)}
              placeholder="B"
              size="small"
              width="full"
              type="number"
              min={0}
              max={255}
              step={1}
              showSpinners={true}
              allowMouseWheel={true}
            />
          </SDiv>
          {showAlpha && (
            <SDiv style={{ flex: '1 1 0', minWidth: 0, minHeight: '28px', paddingTop: '3px' }}>
              <TextBox
                value={rgbInputs.a}
                onChange={(v) => handleRgbChange('a', v)}
                placeholder="A%"
                size="small"
                width="full"
                type="number"
                min={0}
                max={100}
                step={1}
                showSpinners={true}
                allowMouseWheel={true}
              />
            </SDiv>
          )}
        </SDiv>
      )}

      {format === 'hsl' && (
        <SDiv style={{ display: 'flex', gap: '4px', minHeight: '28px' }}>
          <SDiv style={{ flex: '1 1 0', minWidth: 0, minHeight: '28px', paddingTop: '3px' }}>
            <TextBox
              value={hslInputs.h}
              onChange={(v) => handleHslChange('h', v)}
              placeholder="H"
              size="small"
              width="full"
              type="number"
              min={0}
              max={360}
              step={1}
              showSpinners={true}
              allowMouseWheel={true}
            />
          </SDiv>
          <SDiv style={{ flex: '1 1 0', minWidth: 0, minHeight: '28px', paddingTop: '3px' }}>
            <TextBox
              value={hslInputs.s}
              onChange={(v) => handleHslChange('s', v)}
              placeholder="S%"
              size="small"
              width="full"
              type="number"
              min={0}
              max={100}
              step={1}
              showSpinners={true}
              allowMouseWheel={true}
            />
          </SDiv>
          <SDiv style={{ flex: '1 1 0', minWidth: 0, minHeight: '28px', paddingTop: '3px' }}>
            <TextBox
              value={hslInputs.l}
              onChange={(v) => handleHslChange('l', v)}
              placeholder="L%"
              size="small"
              width="full"
              type="number"
              min={0}
              max={100}
              step={1}
              showSpinners={true}
              allowMouseWheel={true}
            />
          </SDiv>
          {showAlpha && (
            <SDiv style={{ flex: '1 1 0', minWidth: 0, minHeight: '28px', paddingTop: '3px' }}>
              <TextBox
                value={hslInputs.a}
                onChange={(v) => handleHslChange('a', v)}
                placeholder="A%"
                size="small"
                width="full"
                type="number"
                min={0}
                max={100}
                step={1}
                showSpinners={true}
                allowMouseWheel={true}
              />
            </SDiv>
          )}
        </SDiv>
      )}
    </SDiv>
  );
};
