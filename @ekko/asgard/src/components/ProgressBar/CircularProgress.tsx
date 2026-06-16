import React from 'react';
import { useTheme } from '../../theme';
import { Typography } from '../Typography/Typography';
import { useSsrId } from '../../_internal';

export type ProgressSize = 'small' | 'normal' | 'large';
export type ProgressType = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

export interface CircularProgressProps {
  value?: number;
  min?: number;
  max?: number;
  size?: ProgressSize | number;
  thickness?: number;
  type?: ProgressType;
  indeterminate?: boolean;
  showLabel?: boolean;
  label?: string;
  color?: string;
  gradient?: { from: string; to: string };
  style?: React.CSSProperties;
  className?: string;
}

const SIZE_PRESETS = {
  small: 40,
  normal: 60,
  large: 80
};

const THICKNESS_CONFIG = {
  small: 3,
  normal: 4,
  large: 5
};

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value = 0,
  min = 0,
  max = 100,
  size = 'normal',
  thickness,
  type = 'primary',
  indeterminate = false,
  showLabel = false,
  label,
  color,
  gradient,
  style,
  className
}) => {
  const { theme } = useTheme();

  // Determine size in pixels
  const sizeInPx = typeof size === 'number' ? size : SIZE_PRESETS[size];

  // Determine thickness
  const strokeWidth = thickness || (typeof size === 'number' ? 4 : THICKNESS_CONFIG[size]);

  // Calculate percentage
  const percentage = indeterminate ? 0 : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  // Get color from type or custom color
  const getColor = (): string => {
    if (color) return color;
    if (type === 'primary') return theme.accent.primary;
    if (type === 'secondary') return theme.accent.secondary;
    return theme.semantic[type];
  };

  const progressColor = getColor();

  // SVG circle calculations
  const radius = (sizeInPx - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeInPx,
    height: sizeInPx,
    ...style
  };

  const svgStyles: React.CSSProperties = {
    transform: 'rotate(-90deg)',
    ...(indeterminate && {
      animation: 'spin 1.4s linear infinite'
    })
  };

  const labelContainerStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // Create gradient ID for unique gradients
  const gradientId = useSsrId('gradient');

  return (
    <div style={containerStyles} className={className}>
      <svg
        width={sizeInPx}
        height={sizeInPx}
        style={svgStyles}
      >
        {gradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient.from} />
              <stop offset="100%" stopColor={gradient.to} />
            </linearGradient>
          </defs>
        )}

        {/* Background circle */}
        <circle
          cx={sizeInPx / 2}
          cy={sizeInPx / 2}
          r={radius}
          fill="none"
          stroke={theme.border.default}
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          cx={sizeInPx / 2}
          cy={sizeInPx / 2}
          r={radius}
          fill="none"
          stroke={gradient ? `url(#${gradientId})` : progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: indeterminate ? 'none' : 'stroke-dashoffset 0.3s ease'
          }}
        />
      </svg>

      {(showLabel || label) && (
        <div style={labelContainerStyles}>
          {showLabel && !indeterminate ? (
            <Typography
              variant="caption"
              weight="medium"
              style={{
                fontSize: sizeInPx < 50 ? '10px' : sizeInPx < 70 ? '12px' : '14px',
                lineHeight: 1
              }}
            >
              {Math.round(percentage)}%
            </Typography>
          ) : label ? (
            <Typography
              variant="caption"
              style={{
                fontSize: sizeInPx < 50 ? '10px' : sizeInPx < 70 ? '12px' : '14px',
                lineHeight: 1
              }}
            >
              {label}
            </Typography>
          ) : null}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% {
            transform: rotate(-90deg);
          }
          100% {
            transform: rotate(270deg);
          }
        }
      `}</style>
    </div>
  );
};
