import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../theme';
import { Typography } from '../Typography/Typography';
import { Button } from '../Button/Button';
import type { TimeValue } from './TimePicker';

export type CircularTimePickerSize = 'small' | 'normal' | 'large';
export type CircularTimePickerSemantic = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

export interface CircularTimePickerProps {
  value?: TimeValue;
  defaultValue?: TimeValue;
  onChange?: (value: TimeValue) => void;

  // Appearance
  size?: CircularTimePickerSize;
  semantic?: CircularTimePickerSemantic;

  // Actions
  onOk?: (value: TimeValue) => void; // Pass current value when OK is clicked
  onCancel?: () => void;
  showActions?: boolean;

  className?: string;
}

export const CircularTimePicker: React.FC<CircularTimePickerProps> = ({
  value: controlledValue,
  defaultValue = { hour: 3, minute: 30, period: 'AM' },
  onChange,
  size = 'normal',
  semantic = 'primary',
  onOk,
  onCancel,
  showActions = true,
  className
}) => {
  const { theme } = useTheme();
  const [internalValue, setInternalValue] = useState<TimeValue>(defaultValue);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [isDragging, setIsDragging] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);

  const value = controlledValue || internalValue;

  // Size configurations
  const sizeConfig = {
    small: {
      clockSize: 200,
      fontSize: 12,
      displayFontSize: 32,
      dotSize: 6,
      padding: 12
    },
    normal: {
      clockSize: 260,
      fontSize: 14,
      displayFontSize: 48,
      dotSize: 8,
      padding: 16
    },
    large: {
      clockSize: 320,
      fontSize: 16,
      displayFontSize: 56,
      dotSize: 10,
      padding: 20
    }
  };

  const config = sizeConfig[size];

  // Get semantic color
  const getSemanticColor = () => {
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

  const semanticColor = getSemanticColor();

  const hours = Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const radius = (config.clockSize / 2) - 30;
  const centerX = config.clockSize / 2;
  const centerY = config.clockSize / 2;

  // Handle value change
  const handleChange = (newValue: Partial<TimeValue>) => {
    const updated = { ...value, ...newValue };
    if (!controlledValue) {
      setInternalValue(updated);
    }
    onChange?.(updated);
  };

  // Get angle from mouse position
  const getAngleFromPoint = (clientX: number, clientY: number): number => {
    if (!clockRef.current) return 0;

    const rect = clockRef.current.getBoundingClientRect();
    const x = clientX - (rect.left + centerX);
    const y = clientY - (rect.top + centerY);

    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;
    return angle;
  };

  // Convert angle to value
  const angleToValue = (angle: number): number => {
    if (mode === 'hour') {
      const hour = Math.round(angle / 30);
      return hour === 0 ? 12 : hour;
    } else {
      const minute = Math.round(angle / 6);
      return minute === 60 ? 0 : minute;
    }
  };

  // Handle clock interaction
  const handleClockClick = (e: React.MouseEvent) => {
    const angle = getAngleFromPoint(e.clientX, e.clientY);
    const newValue = angleToValue(angle);

    if (mode === 'hour') {
      handleChange({ hour: newValue });
      setMode('minute');
    } else {
      handleChange({ minute: newValue });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const angle = getAngleFromPoint(e.clientX, e.clientY);
    const newValue = angleToValue(angle);

    if (mode === 'hour') {
      handleChange({ hour: newValue });
    } else {
      handleChange({ minute: newValue });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, mode]);

  // Calculate position for clock numbers
  const getNumberPosition = (index: number, isHour: boolean) => {
    const total = isHour ? 12 : 12;
    const angle = (index * (360 / total)) - 90;
    const rad = (angle * Math.PI) / 180;
    const x = centerX + radius * Math.cos(rad);
    const y = centerY + radius * Math.sin(rad);
    return { x, y };
  };

  // Calculate hand angle
  const getHandAngle = () => {
    if (mode === 'hour') {
      return (value.hour % 12) * 30 - 90;
    } else {
      return (value.minute * 6) - 90;
    }
  };

  const handAngle = getHandAngle();
  const handRad = (handAngle * Math.PI) / 180;
  const handEndX = centerX + radius * Math.cos(handRad);
  const handEndY = centerY + radius * Math.sin(handRad);

  return (
    <div
      className={className}
      style={{
        padding: config.padding,
        backgroundColor: theme.background.primary,
        borderRadius: '8px',
        border: `1px solid ${theme.border.default}`,
        display: 'inline-block'
      }}
    >
      {/* Title */}
      <Typography
        variant="body1"
        style={{
          fontSize: config.fontSize + 2,
          fontWeight: 600,
          marginBottom: 12,
          textAlign: 'center'
        }}
      >
        SELECT TIME
      </Typography>

      {/* Time display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16
      }}>
        <div
          onClick={() => setMode('hour')}
          style={{
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: mode === 'hour' ? semanticColor + '22' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <Typography
            variant="h3"
            style={{
              fontSize: config.displayFontSize,
              fontWeight: 300,
              color: mode === 'hour' ? semanticColor : theme.text.secondary
            }}
          >
            {String(value.hour).padStart(2, '0')}
          </Typography>
        </div>
        <Typography variant="h3" style={{ fontSize: config.displayFontSize, fontWeight: 300 }}>
          :
        </Typography>
        <div
          onClick={() => setMode('minute')}
          style={{
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: mode === 'minute' ? semanticColor + '22' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <Typography
            variant="h3"
            style={{
              fontSize: config.displayFontSize,
              fontWeight: 300,
              color: mode === 'minute' ? semanticColor : theme.text.secondary
            }}
          >
            {String(value.minute).padStart(2, '0')}
          </Typography>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Button
            variant={value.period === 'AM' ? 'filled' : 'ghost'}
            size="small"
            type={semantic}
            onClick={() => handleChange({ period: 'AM' })}
            style={{ minWidth: 40, padding: '4px 8px' }}
          >
            AM
          </Button>
          <Button
            variant={value.period === 'PM' ? 'filled' : 'ghost'}
            size="small"
            type={semantic}
            onClick={() => handleChange({ period: 'PM' })}
            style={{ minWidth: 40, padding: '4px 8px' }}
          >
            PM
          </Button>
        </div>
      </div>

      {/* Clock */}
      <div
        ref={clockRef}
        onClick={handleClockClick}
        onMouseDown={() => setIsDragging(true)}
        style={{
          width: config.clockSize,
          height: config.clockSize,
          borderRadius: '50%',
          backgroundColor: theme.background.secondary,
          position: 'relative',
          cursor: 'pointer',
          marginBottom: showActions ? 16 : 0,
          userSelect: 'none'
        }}
      >
        {/* Clock numbers */}
        {(mode === 'hour' ? hours : minutes).map((num, index) => {
          const pos = getNumberPosition(index, mode === 'hour');

          return (
            <div
              key={num}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.text.primary,
                fontWeight: 400
              }}
            >
              <Typography variant="body2" style={{ fontSize: config.fontSize }}>
                {mode === 'hour' ? num : String(num).padStart(2, '0')}
              </Typography>
            </div>
          );
        })}

        {/* Center dot */}
        <div
          style={{
            position: 'absolute',
            left: centerX,
            top: centerY,
            width: config.dotSize * 2,
            height: config.dotSize * 2,
            borderRadius: '50%',
            backgroundColor: semanticColor,
            transform: 'translate(-50%, -50%)'
          }}
        />

        {/* Clock hand */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <line
            x1={centerX}
            y1={centerY}
            x2={handEndX}
            y2={handEndY}
            stroke={semanticColor}
            strokeWidth="2"
          />
          <circle
            cx={handEndX}
            cy={handEndY}
            r={16}
            fill={semanticColor}
          />
          <text
            x={handEndX}
            y={handEndY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize={config.fontSize}
            fontWeight="600"
          >
            {mode === 'hour' ? value.hour : String(value.minute).padStart(2, '0')}
          </text>
        </svg>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8
        }}>
          <Button
            variant="ghost"
            size={size}
            onClick={onCancel}
            type={semantic}
          >
            CANCEL
          </Button>
          <Button
            variant="filled"
            size={size}
            onClick={() => onOk?.(value)}
            type={semantic}
          >
            OK
          </Button>
        </div>
      )}
    </div>
  );
};
