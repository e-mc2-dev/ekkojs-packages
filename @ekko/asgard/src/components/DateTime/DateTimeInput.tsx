import React, { useState, useRef } from 'react';
// import { useTheme } from '../../theme'; // Not used currently
import { TextBox } from '../TextBox/TextBox';
import type { TextBoxSize, TextBoxVariant, TextBoxSemantic } from '../TextBox/TextBox';
import { FloatingPanel } from '../FloatingPanel/FloatingPanel';
import { Calendar } from './Calendar';
import type { DateSelection, RangeHalfDayConfig } from './Calendar';
import { TimePicker } from './TimePicker';
import type { TimeValue } from './TimePicker';
import { CircularTimePicker } from './CircularTimePicker';

export type DateTimeMode = 'date' | 'time' | 'datetime' | 'date-range' | 'datetime-range';
export type TimePickerType = 'scroll' | 'circular';

export interface DateTimeValue {
  date?: Date | Date[];
  time?: TimeValue;
  selections?: DateSelection[];
}

export interface DateTimeInputProps {
  value?: DateTimeValue;
  defaultValue?: DateTimeValue;
  onChange?: (value: DateTimeValue) => void;

  // Mode
  mode?: DateTimeMode;
  timePickerType?: TimePickerType;
  timePickerLayout?: 'vertical' | 'horizontal'; // Layout for scroll time picker

  // Appearance (inherited from TextBox)
  size?: TextBoxSize;
  variant?: TextBoxVariant;
  semantic?: TextBoxSemantic;
  width?: 'fixed' | 'full' | 'flex';
  fixedWidth?: number;

  // TextBox props
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;

  // Calendar options
  allowHalfDay?: boolean;
  rangeHalfDayConfig?: RangeHalfDayConfig;
  minDate?: Date;
  maxDate?: Date;

  className?: string;
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({
  value: controlledValue,
  defaultValue,
  onChange,
  mode = 'date',
  timePickerType = 'scroll',
  timePickerLayout = 'vertical',
  size = 'normal',
  variant = 'outlined',
  semantic = 'primary',
  width = 'flex',
  fixedWidth,
  placeholder,
  disabled = false,
  // readonly = false, // Not used - TextBox is always readonly for DateTimeInput
  error = false,
  helperText,
  allowHalfDay = false,
  rangeHalfDayConfig,
  minDate,
  maxDate,
  className
}) => {
  // const { theme } = useTheme(); // Not used currently
  const [internalValue, setInternalValue] = useState<DateTimeValue>(defaultValue || {});
  const [isOpen, setIsOpen] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [workingValue, setWorkingValue] = useState<DateTimeValue>({}); // Temporary state while editing
  const containerRef = useRef<HTMLDivElement>(null);

  const value = controlledValue || internalValue;

  const needsDate = mode.includes('date');
  const needsTime = mode.includes('time') || mode.includes('datetime');
  const isRange = mode.includes('range');

  // Determine if we need validation buttons (for range or half-day selections)
  const needsValidation = (isRange || allowHalfDay) && needsDate;

  // Format display value
  const formatDisplayValue = (): string => {
    console.log('DateTimeInput formatDisplayValue - value:', value);
    if (!value.date && !value.time) return '';

    const parts: string[] = [];

    // Format date
    if (value.date) {
      if (Array.isArray(value.date)) {
        if (value.date.length === 1) {
          parts.push(formatDate(value.date[0]));
        } else if (value.date.length === 2) {
          parts.push(`${formatDate(value.date[0])} - ${formatDate(value.date[1])}`);
        }
      } else {
        parts.push(formatDate(value.date));
      }
    }

    // Format time
    if (value.time) {
      parts.push(formatTime(value.time));
    }

    return parts.join(' ');
  };

  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatTime = (time: TimeValue): string => {
    const hour = String(time.hour).padStart(2, '0');
    const minute = String(time.minute).padStart(2, '0');
    return time.period ? `${hour}:${minute} ${time.period}` : `${hour}:${minute}`;
  };

  // Handle changes
  const handleDateChange = (date: Date | Date[] | null, selections?: DateSelection[]) => {
    if (needsValidation) {
      // For range/half-day selections, update working value only
      setWorkingValue({ ...workingValue, date: date || undefined, selections });
    } else {
      // For simple selections without validation buttons, update immediately
      const newValue = { ...value, date: date || undefined, selections };

      if (!controlledValue) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);

      // If datetime mode, show time picker after date selection
      if (needsTime && date && !isRange) {
        setShowTimePicker(true);
      } else if (!needsTime && !isRange && !allowHalfDay) {
        // For single date selection WITHOUT half-day, close immediately
        setIsOpen(false);
      }
    }
  };

  const handleCalendarValidate = () => {
    // Commit working value to actual value
    const newValue = { ...value, ...workingValue };
    if (!controlledValue) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
    setIsOpen(false);
  };

  const handleCalendarCancel = () => {
    // Discard working value
    setWorkingValue({});
    setIsOpen(false);
  };

  const handleTimeChange = (time: TimeValue) => {
    // Time pickers always have OK/Cancel buttons, so just update working state
    setWorkingValue({ ...workingValue, time });
  };

  const handleTimeOk = (time: TimeValue) => {
    // Save the time value when OK is clicked (even if user didn't change it)
    const newValue = { ...value, time };

    if (!controlledValue) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);

    setShowTimePicker(false);
    setIsOpen(false);
    setWorkingValue({});
  };

  const handleTimeCancel = () => {
    // Discard time changes
    setWorkingValue({});
    setShowTimePicker(false);
    if (!needsDate) {
      setIsOpen(false);
    }
  };

  // Get placeholder
  const getPlaceholder = (): string => {
    if (placeholder) return placeholder;

    switch (mode) {
      case 'date': return 'MM/DD/YYYY';
      case 'time': return 'HH:MM';
      case 'datetime': return 'MM/DD/YYYY HH:MM';
      case 'date-range': return 'MM/DD/YYYY - MM/DD/YYYY';
      case 'datetime-range': return 'MM/DD/YYYY HH:MM - MM/DD/YYYY HH:MM';
      default: return 'Select...';
    }
  };

  // Icon based on mode
  const getIcon = () => {
    if (mode.includes('time') && !mode.includes('date')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        style={{
          outline: 'none',
          display: width === 'full' ? 'block' : 'inline-block',
          width: width === 'full' ? '100%' : undefined
        }}
      >
        <TextBox
          value={formatDisplayValue()}
          placeholder={getPlaceholder()}
          size={size}
          variant={variant}
          semantic={error ? 'error' : semantic}
          width={width}
          fixedWidth={fixedWidth}
          disabled={disabled}
          readonly={true}
          hintText={helperText}
          onClick={() => {
            if (!disabled) {
              // Initialize working value with current value when opening
              if (needsValidation) {
                setWorkingValue({ ...value });
              }
              setIsOpen(true);
            }
          }}
          rightIcon={getIcon()}
          showIconDivider={false}
        />
      </div>

      <FloatingPanel
        anchorRef={containerRef}
        isOpen={isOpen && !disabled}
        onClose={() => {
          setIsOpen(false);
          setShowTimePicker(false);
        }}
        position="bottom-left"
        offset={4}
        closeOnClickOutside={true}
        closeOnEscape={true}
      >
        {!showTimePicker && needsDate && (
          <Calendar
            value={needsValidation ? workingValue.date : value.date}
            onChange={handleDateChange}
            size={size}
            semantic={semantic}
            selectionMode={isRange ? 'range' : 'single'}
            allowHalfDay={allowHalfDay}
            rangeHalfDayConfig={rangeHalfDayConfig}
            minDate={minDate}
            maxDate={maxDate}
            onValidate={needsValidation ? handleCalendarValidate : undefined}
            onCancel={needsValidation ? handleCalendarCancel : undefined}
          />
        )}

        {showTimePicker && needsTime && timePickerType === 'scroll' && (
          <TimePicker
            value={workingValue.time || value.time}
            onChange={handleTimeChange}
            size={size}
            semantic={semantic}
            layout={timePickerLayout}
            onOk={handleTimeOk}
            onCancel={handleTimeCancel}
          />
        )}

        {showTimePicker && needsTime && timePickerType === 'circular' && (
          <CircularTimePicker
            value={workingValue.time || value.time}
            onChange={handleTimeChange}
            size={size}
            semantic={semantic}
            onOk={handleTimeOk}
            onCancel={handleTimeCancel}
          />
        )}

        {!showTimePicker && !needsDate && needsTime && timePickerType === 'scroll' && (
          <TimePicker
            value={workingValue.time || value.time}
            onChange={handleTimeChange}
            size={size}
            semantic={semantic}
            layout={timePickerLayout}
            onOk={(time) => {
              const newValue = { ...value, time };
              if (!controlledValue) {
                setInternalValue(newValue);
              }
              onChange?.(newValue);
              setWorkingValue({});
              setIsOpen(false);
            }}
            onCancel={() => {
              setWorkingValue({});
              setIsOpen(false);
            }}
          />
        )}

        {!showTimePicker && !needsDate && needsTime && timePickerType === 'circular' && (
          <CircularTimePicker
            value={workingValue.time || value.time}
            onChange={handleTimeChange}
            size={size}
            semantic={semantic}
            onOk={(time) => {
              const newValue = { ...value, time };
              if (!controlledValue) {
                setInternalValue(newValue);
              }
              onChange?.(newValue);
              setWorkingValue({});
              setIsOpen(false);
            }}
            onCancel={() => {
              setWorkingValue({});
              setIsOpen(false);
            }}
          />
        )}
      </FloatingPanel>
    </>
  );
};
