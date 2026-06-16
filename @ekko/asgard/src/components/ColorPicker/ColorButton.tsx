import React, { useRef, useState } from 'react';
import { useTheme } from '../../theme';
import { SDiv } from '../SDiv/SDiv';
import { Typography } from '../Typography/Typography';
import { FloatingPanel } from '../FloatingPanel/FloatingPanel';
import { ColorPicker } from './ColorPicker';
import type { ColorButtonProps } from './types';
import { createColorFromHSLA, formatColor } from './utils';
import type { Color } from './utils';

const DEFAULT_COLOR: Color = createColorFromHSLA(220, 90, 50, 1);

export const ColorButton: React.FC<ColorButtonProps> = ({
  value,
  defaultValue = DEFAULT_COLOR,
  onChange,
  showLabel = true,
  label,
  size = 'medium',
  disabled = false,
  pickerMode = 'classic',
  showAlpha = true,
  pickerPosition = 'bottom',
  className = ''
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentColor, setCurrentColor] = useState<Color>(value || defaultValue);

  // Update when controlled value changes
  React.useEffect(() => {
    if (value) {
      setCurrentColor(value);
    }
  }, [value]);

  const handleColorChange = (newColor: Color) => {
    setCurrentColor(newColor);
    onChange?.(newColor);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Size configurations - larger color swatches
  const sizeConfig = {
    small: {
      height: 28,
      colorWidth: 32,
      fontSize: 11,
      padding: '4px 8px'
    },
    medium: {
      height: 36,
      colorWidth: 50,
      fontSize: 13,
      padding: '6px 10px'
    },
    large: {
      height: 44,
      colorWidth: 60,
      fontSize: 14,
      padding: '8px 12px'
    }
  };

  const config = sizeConfig[size];

  // Get position for FloatingPanel
  const getPosition = () => {
    switch (pickerPosition) {
      case 'top': return 'top';
      case 'left': return 'left';
      case 'right': return 'right';
      default: return 'bottom';
    }
  };

  const colorString = formatColor(currentColor, 'hex');
  const displayLabel = label || (showLabel ? colorString : '');

  return (
    <>
      <SDiv
        ref={containerRef}
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: `${config.height}px`,
          borderRadius: '6px',
          border: `1px solid ${isOpen ? theme.accent.primary : isHovered ? theme.border.focus : theme.border.default}`,
          backgroundColor: theme.background.primary,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          boxShadow: isOpen ? `0 0 0 2px ${theme.accent.primary}20` : 'none'
        }}
      >
        {/* Large color swatch - prominent on the left */}
        <SDiv
          style={{
            position: 'relative',
            width: `${config.colorWidth}px`,
            height: '100%',
            flexShrink: 0,
            borderRight: showLabel ? `1px solid ${theme.border.default}` : 'none'
          }}
        >
          {/* Checkered background for transparency */}
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
                backgroundSize: '10px 10px',
                backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
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

        {/* Label and dropdown indicator */}
        {showLabel && (
          <SDiv
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: config.padding,
              flex: 1,
              minWidth: 0,
              gap: '8px'
            }}
          >
            <Typography
              style={{
                fontSize: `${config.fontSize}px`,
                fontWeight: 500,
                color: theme.text.primary,
                fontFamily: 'monospace',
                letterSpacing: '0.5px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {displayLabel}
            </Typography>

            <Typography
              style={{
                fontSize: '9px',
                color: theme.text.secondary,
                flexShrink: 0
              }}
            >
              ▼
            </Typography>
          </SDiv>
        )}
      </SDiv>

      {/* FloatingPanel with ColorPicker */}
      <FloatingPanel
        anchorRef={containerRef}
        isOpen={isOpen}
        onClose={handleClose}
        position={getPosition()}
        closeOnClickOutside
        closeOnEscape
        offset={4}
      >
        <ColorPicker
          value={currentColor}
          onChange={handleColorChange}
          mode={pickerMode}
          showAlpha={showAlpha}
        />
      </FloatingPanel>
    </>
  );
};
