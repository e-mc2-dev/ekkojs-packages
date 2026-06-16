import React, { useState, useRef, useEffect } from 'react';
import { useSsrId } from '../../_internal';
import { useTheme } from '../../theme';
import { Typography } from '../Typography/Typography';
import { Button } from '../Button/Button';

export type TimePickerSize = 'small' | 'normal' | 'large';
export type TimePickerSemantic = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type TimeFormat = '12h' | '24h';

export interface TimeValue {
  hour: number;
  minute: number;
  period?: 'AM' | 'PM'; // For 12h format
}

export interface TimePickerProps {
  value?: TimeValue;
  defaultValue?: TimeValue;
  onChange?: (value: TimeValue) => void;

  // Appearance
  size?: TimePickerSize;
  semantic?: TimePickerSemantic;
  format?: TimeFormat;
  layout?: 'vertical' | 'horizontal'; // Layout orientation

  // Behavior
  minuteStep?: number; // Step for minutes (1, 5, 10, 15, 30)

  // Actions
  onOk?: (value: TimeValue) => void; // Pass current value when OK is clicked
  onCancel?: () => void;
  showActions?: boolean;

  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value: controlledValue,
  defaultValue = { hour: 12, minute: 0, period: 'AM' },
  onChange,
  size = 'normal',
  semantic = 'primary',
  format = '12h',
  layout = 'vertical',
  minuteStep = 5,
  onOk,
  onCancel,
  showActions = true,
  className
}) => {
  const { theme} = useTheme();
  const [internalValue, setInternalValue] = useState<TimeValue>(defaultValue);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const scrollId = useSsrId('timepicker');

  const value = controlledValue || internalValue;

  // Size configurations
  const sizeConfig = {
    small: {
      itemHeight: 32,
      fontSize: 13,
      width: 50,
      padding: 8
    },
    normal: {
      itemHeight: 40,
      fontSize: 15,
      width: 60,
      padding: 12
    },
    large: {
      itemHeight: 48,
      fontSize: 17,
      width: 70,
      padding: 16
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

  // Generate arrays
  const hours = format === '12h'
    ? Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i))
    : Array.from({ length: 24 }, (_, i) => i);

  const minutes = Array.from(
    { length: Math.floor(60 / minuteStep) },
    (_, i) => i * minuteStep
  );

  // const periods = ['AM', 'PM']; // Not used - period buttons use hardcoded values

  // Handle value change
  const handleChange = (newValue: Partial<TimeValue>) => {
    const updated = { ...value, ...newValue };
    if (!controlledValue) {
      setInternalValue(updated);
    }
    onChange?.(updated);
  };

  // Scroll to selected value
  useEffect(() => {
    if (hourRef.current) {
      const index = hours.indexOf(value.hour);
      hourRef.current.scrollTop = index * config.itemHeight;
    }
    if (minuteRef.current) {
      const index = minutes.indexOf(value.minute);
      minuteRef.current.scrollTop = index * config.itemHeight;
    }
  }, []);

  // Scroll item styles
  const getItemStyles = (selected: boolean): React.CSSProperties => ({
    height: config.itemHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: selected ? semanticColor + '22' : 'transparent',
    color: selected ? semanticColor : theme.text.primary,
    fontWeight: selected ? 600 : 400,
    transition: 'all 0.2s ease',
    userSelect: 'none'
  });

  const scrollContainerStyle: React.CSSProperties = {
    height: layout === 'horizontal' ? config.itemHeight * 3 : config.itemHeight * 5,
    overflowY: 'scroll',
    overflowX: 'hidden',
    scrollbarWidth: 'thin',
    position: 'relative',
    backgroundColor: theme.background.secondary,
    borderRadius: '4px'
  };

  // Render components
  const renderTimeDisplay = () => (
    <>
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
        justifyContent: layout === 'horizontal' ? 'flex-start' : 'center',
        gap: 8,
        marginBottom: layout === 'horizontal' ? 0 : 16
      }}>
        <Typography variant="h4" style={{ fontSize: 36, fontWeight: 400 }}>
          {String(value.hour).padStart(2, '0')}:{String(value.minute).padStart(2, '0')}
        </Typography>
        {format === '12h' && (
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
        )}
      </div>
    </>
  );

  const renderScrollableColumns = () => (
    <div style={{
      display: 'flex',
      gap: 8,
      marginBottom: layout === 'horizontal' ? 0 : (showActions ? 16 : 0)
    }}>
      {/* Hours */}
      <div style={{ width: layout === 'horizontal' ? config.width : undefined, flex: layout === 'vertical' ? 1 : undefined }}>
        <div
          ref={hourRef}
          className={`${scrollId}-scroll`}
          style={scrollContainerStyle}
        >
          {hours.map((hour) => (
            <div
              key={hour}
              style={getItemStyles(value.hour === hour)}
              onClick={() => handleChange({ hour })}
            >
              <Typography variant="body2" style={{ fontSize: config.fontSize }}>
                {format === '12h' ? hour : String(hour).padStart(2, '0')}
              </Typography>
            </div>
          ))}
        </div>
      </div>

      {/* Minutes */}
      <div style={{ width: layout === 'horizontal' ? config.width : undefined, flex: layout === 'vertical' ? 1 : undefined }}>
        <div
          ref={minuteRef}
          className={`${scrollId}-scroll`}
          style={scrollContainerStyle}
        >
          {minutes.map((minute) => (
            <div
              key={minute}
              style={getItemStyles(value.minute === minute)}
              onClick={() => handleChange({ minute })}
            >
              <Typography variant="body2" style={{ fontSize: config.fontSize }}>
                {String(minute).padStart(2, '0')}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActionButtons = () => showActions && (
    <div style={{
      display: 'flex',
      flexDirection: layout === 'horizontal' ? 'column' : 'row',
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
  );

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
      {/* Themed scrollbar styles */}
      <style>
        {`
          .${scrollId}-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .${scrollId}-scroll::-webkit-scrollbar-track {
            background: ${theme.components.scrollbar.track};
          }
          .${scrollId}-scroll::-webkit-scrollbar-thumb {
            background: ${theme.components.scrollbar.thumb};
            border-radius: 4px;
          }
          .${scrollId}-scroll::-webkit-scrollbar-thumb:hover {
            background: ${theme.components.scrollbar.thumbHover};
          }
          .${scrollId}-scroll {
            scrollbar-width: thin;
            scrollbar-color: ${theme.components.scrollbar.thumb} ${theme.components.scrollbar.track};
          }
        `}
      </style>

      {layout === 'vertical' ? (
        <>
          {renderTimeDisplay()}
          {renderScrollableColumns()}
          {renderActionButtons()}
        </>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
          {/* Left section: Title + Time + AM/PM */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingRight: 16,
            borderRight: `1px solid ${theme.border.default}`
          }}>
            {renderTimeDisplay()}
          </div>

          {/* Middle section: Scrollable columns */}
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            {renderScrollableColumns()}
          </div>

          {/* Right section: Action buttons */}
          {showActions && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 16,
              borderLeft: `1px solid ${theme.border.default}`
            }}>
              {renderActionButtons()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
