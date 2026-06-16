import React from 'react';
import { useTheme } from '../../theme';
import { Typography } from '../Typography/Typography';

export type ProgressSize = 'small' | 'normal' | 'large';
export type ProgressType = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

export interface LinearProgressProps {
  value?: number;
  min?: number;
  max?: number;
  size?: ProgressSize;
  type?: ProgressType;
  indeterminate?: boolean;
  showLabel?: boolean;
  label?: string;
  color?: string;
  gradient?: { from: string; to: string };
  style?: React.CSSProperties;
  className?: string;
}

const SIZE_CONFIG = {
  small: {
    height: 4,
    fontSize: 11
  },
  normal: {
    height: 8,
    fontSize: 12
  },
  large: {
    height: 12,
    fontSize: 14
  }
};

export const LinearProgress: React.FC<LinearProgressProps> = ({
  value = 0,
  min = 0,
  max = 100,
  size = 'normal',
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
  const config = SIZE_CONFIG[size];

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

  // Get background for progress bar
  const getProgressBackground = (): string => {
    if (gradient) {
      return `linear-gradient(to right, ${gradient.from}, ${gradient.to})`;
    }
    return progressColor;
  };

  const containerStyles: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    ...style
  };

  const trackStyles: React.CSSProperties = {
    width: '100%',
    height: config.height,
    backgroundColor: theme.border.default,
    borderRadius: config.height / 2,
    overflow: 'hidden',
    position: 'relative'
  };

  const barStyles: React.CSSProperties = {
    height: '100%',
    width: indeterminate ? '30%' : `${percentage}%`,
    background: getProgressBackground(),
    borderRadius: config.height / 2,
    transition: indeterminate ? 'none' : 'width 0.3s ease',
    ...(indeterminate && {
      position: 'absolute',
      animation: 'indeterminate 1.5s infinite ease-in-out'
    })
  };

  const labelContainerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  };

  return (
    <div style={containerStyles} className={className}>
      {(showLabel || label) && (
        <div style={labelContainerStyles}>
          <Typography variant="caption" color="secondary">
            {label || ''}
          </Typography>
          {showLabel && !indeterminate && (
            <Typography variant="caption" color="secondary" weight="medium">
              {Math.round(percentage)}%
            </Typography>
          )}
        </div>
      )}
      <div style={trackStyles}>
        <div style={barStyles} />
      </div>
      <style>{`
        @keyframes indeterminate {
          0% {
            left: -30%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
};
