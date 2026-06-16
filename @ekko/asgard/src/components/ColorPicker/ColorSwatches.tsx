import React from 'react';
import { useTheme } from '../../theme';
import { SDiv } from '../SDiv/SDiv';
import { Typography } from '../Typography/Typography';
import type { ColorSwatchesProps } from './types';
import { formatColor } from './utils';

export const ColorSwatches: React.FC<ColorSwatchesProps> = ({
  colors,
  selectedColor,
  onColorSelect,
  onColorRemove,
  maxColors = 6,
  title,
  allowRemove = false,
  allowAdd = false,
  onColorAdd
}) => {
  const { theme } = useTheme();

  if (colors.length === 0 && !allowAdd) return null;

  const displayColors = colors.slice(0, maxColors);
  // Always show 6 slots total (including add button if present)
  const totalSlots = 6;
  const colorSlots = allowAdd ? totalSlots - 1 : totalSlots; // Reserve 1 slot for + button
  const slots = Array.from({ length: colorSlots }, (_, i) => displayColors[i] || null);

  return (
    <SDiv
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}
    >
      {title && (
        <SDiv style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Typography
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: theme.text.secondary,
              textTransform: 'uppercase'
            }}
          >
            {title}
          </Typography>
          {allowRemove && (
            <Typography
              style={{
                fontSize: '11px',
                fontWeight: 400,
                color: theme.text.primary
              }}
            >
              (Right-click to remove)
            </Typography>
          )}
        </SDiv>
      )}

      <SDiv
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '6px',
          overflow: 'hidden'
        }}
      >
        {slots.map((color, index) => {
          // Empty slot - render with visibility hidden to maintain grid layout
          if (!color) {
            return (
              <SDiv
                key={`empty-${index}`}
                style={{
                  width: '24px',
                  height: '24px',
                  visibility: 'hidden'
                }}
              />
            );
          }

          const colorString = formatColor(color, 'hex');
          const isSelected = selectedColor && formatColor(selectedColor, 'hex') === colorString;

          return (
            <SDiv
              key={index}
              onClick={() => onColorSelect(color)}
              onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
                if (allowRemove && onColorRemove) {
                  e.preventDefault();
                  onColorRemove(index);
                }
              }}
              style={{
                position: 'relative',
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                cursor: 'pointer',
                border: `2px solid ${isSelected ? theme.accent.primary : theme.border.default}`,
                boxShadow: isSelected ? `0 0 0 1px ${theme.accent.primary}` : 'none',
                transition: 'all 0.2s',
                overflow: 'hidden'
              }}
              title={`${colorString}${allowRemove ? ' (Right-click to remove)' : ''}`}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                if (!isSelected) {
                  e.currentTarget.style.boxShadow = `0 0 4px ${theme.accent.primary}80`;
                }
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                if (!isSelected) {
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Checkered background for transparency */}
              {color.rgb.a < 1 && (
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
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                  }}
                />
              )}

              {/* Color */}
              <SDiv
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: formatColor(color, 'rgb', true)
                }}
              />
            </SDiv>
          );
        })}

        {/* Add button (for custom swatches) */}
        {allowAdd && onColorAdd && (
          <SDiv
            onClick={onColorAdd}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              border: `1px dashed ${theme.border.default}`,
              backgroundColor: theme.background.secondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.backgroundColor = theme.interactive.hover;
              e.currentTarget.style.borderColor = theme.accent.primary;
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.backgroundColor = theme.background.secondary;
              e.currentTarget.style.borderColor = theme.border.default;
            }}
            title="Add current color to custom swatches"
          >
            <Typography style={{ fontSize: '16px', lineHeight: '1', color: theme.text.secondary }}>
              +
            </Typography>
          </SDiv>
        )}
      </SDiv>
    </SDiv>
  );
};
