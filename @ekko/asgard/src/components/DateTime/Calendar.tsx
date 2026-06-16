import React, { useState, useEffect } from 'react';
import { useTheme } from '../../theme';
import { Typography } from '../Typography/Typography';
import { Button } from '../Button/Button';

export type CalendarSize = 'small' | 'normal' | 'large';
export type CalendarSemantic = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type SelectionMode = 'single' | 'range' | 'multiple';
export type DayType = 'full' | 'half-morning' | 'half-afternoon';

export interface DateSelection {
  date: Date;
  dayType?: DayType;
}

export interface RangeHalfDayConfig {
  startDayType?: DayType; // Default day type for range start (e.g., 'half-afternoon' for hotel check-in)
  endDayType?: DayType;   // Default day type for range end (e.g., 'half-morning' for hotel check-out)
}

export interface CalendarProps {
  // Value
  value?: Date | Date[];
  defaultValue?: Date | Date[];
  onChange?: (value: Date | Date[] | null, selections?: DateSelection[]) => void;

  // Appearance
  size?: CalendarSize;
  semantic?: CalendarSemantic;

  // Behavior
  selectionMode?: SelectionMode;
  allowHalfDay?: boolean; // Enable half-day selection
  rangeHalfDayConfig?: RangeHalfDayConfig; // Auto-configure half-day for range start/end
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];

  // Display
  showWeekNumbers?: boolean;
  firstDayOfWeek?: 0 | 1; // 0 = Sunday, 1 = Monday

  // Actions
  onValidate?: () => void; // Called when user clicks Validate button
  onCancel?: () => void;   // Called when user clicks Cancel button

  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  value: controlledValue,
  defaultValue,
  onChange,
  size = 'normal',
  semantic = 'primary',
  selectionMode = 'single',
  allowHalfDay = false,
  rangeHalfDayConfig,
  minDate,
  maxDate,
  disabledDates = [],
  // showWeekNumbers = false, // TODO: Implement week numbers display
  firstDayOfWeek = 0,
  onValidate,
  onCancel,
  className
}) => {
  const { theme } = useTheme();

  // Internal state
  const [internalValue, setInternalValue] = useState<Date | Date[] | undefined>(defaultValue);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dateSelections, setDateSelections] = useState<Map<string, DateSelection>>(new Map());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Initialize dateSelections from rangeHalfDayConfig when value changes
  useEffect(() => {
    if (rangeHalfDayConfig && allowHalfDay && selectionMode === 'range' && Array.isArray(value) && value.length === 2) {
      const newSelections = new Map<string, DateSelection>();
      const [startDate, endDate] = value;

      if (rangeHalfDayConfig.startDayType) {
        newSelections.set(dateToString(startDate), {
          date: startDate,
          dayType: rangeHalfDayConfig.startDayType
        });
      }

      if (rangeHalfDayConfig.endDayType) {
        newSelections.set(dateToString(endDate), {
          date: endDate,
          dayType: rangeHalfDayConfig.endDayType
        });
      }

      console.log('useEffect - Initializing dateSelections from rangeHalfDayConfig:', newSelections);
      setDateSelections(newSelections);
    }
  }, [value, rangeHalfDayConfig, allowHalfDay, selectionMode]);

  // Size configurations
  const sizeConfig = {
    small: {
      cellSize: 32,
      fontSize: 12,
      headerFontSize: 14,
      padding: 12
    },
    normal: {
      cellSize: 40,
      fontSize: 14,
      headerFontSize: 16,
      padding: 16
    },
    large: {
      cellSize: 48,
      fontSize: 16,
      headerFontSize: 18,
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

  // Contrast checker utility - determines if text should be inverse based on background color
  const getContrastTextColor = (backgroundColor: string): string => {
    // Helper to convert hex to RGB
    const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Calculate relative luminance
    const getLuminance = (r: number, g: number, b: number): number => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    // Calculate contrast ratio between two colors
    const getContrastRatio = (l1: number, l2: number): number => {
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    const bgRgb = hexToRgb(backgroundColor);
    const textRgb = hexToRgb(theme.text.primary);

    if (!bgRgb || !textRgb) {
      return theme.text.inverse; // Fallback to inverse if parsing fails
    }

    const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const textLuminance = getLuminance(textRgb.r, textRgb.g, textRgb.b);
    const contrastRatio = getContrastRatio(bgLuminance, textLuminance);

    // WCAG AA standard recommends at least 4.5:1 for normal text
    // If contrast is too low, use inverse text color
    return contrastRatio < 4.5 ? theme.text.inverse : theme.text.primary;
  };

  // Date utility functions
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const dateToString = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return disabledDates.some(d => isSameDay(d, date));
  };

  const isDateSelected = (date: Date) => {
    if (!value) return false;
    if (Array.isArray(value)) {
      return value.some(d => isSameDay(d, date));
    }
    return isSameDay(value, date);
  };

  const isDateInRange = (date: Date) => {
    if (selectionMode !== 'range' || !Array.isArray(value) || value.length !== 2) {
      return false;
    }
    const [start, end] = value;
    return date > start && date < end;
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    let newValue: Date | Date[];
    let rangeCompleted = false;

    if (selectionMode === 'single') {
      newValue = date;
    } else if (selectionMode === 'range') {
      const result = handleRangeSelection(date);
      newValue = result.dates;
      rangeCompleted = result.rangeCompleted;
    } else {
      newValue = handleMultipleSelection(date);
    }

    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }

    // Prepare selections with day types
    const newSelections = new Map(dateSelections);
    const selections: DateSelection[] = [];
    const dates = Array.isArray(newValue) ? newValue : [newValue];

    // If range was just completed and we have rangeHalfDayConfig, apply it
    console.log('Calendar - rangeCompleted:', rangeCompleted, 'rangeHalfDayConfig:', rangeHalfDayConfig, 'allowHalfDay:', allowHalfDay, 'dates.length:', dates.length);
    if (rangeCompleted && rangeHalfDayConfig && allowHalfDay && dates.length === 2) {
      console.log('Calendar - Applying rangeHalfDayConfig:', rangeHalfDayConfig);
      const [startDate, endDate] = dates;

      // Apply configured day types to start and end dates
      if (rangeHalfDayConfig.startDayType) {
        const startKey = dateToString(startDate);
        newSelections.set(startKey, {
          date: startDate,
          dayType: rangeHalfDayConfig.startDayType
        });
      }

      if (rangeHalfDayConfig.endDayType) {
        const endKey = dateToString(endDate);
        newSelections.set(endKey, {
          date: endDate,
          dayType: rangeHalfDayConfig.endDayType
        });
      }

      setDateSelections(newSelections);
    }

    // Build selections array from current state
    dates.forEach(d => {
      const key = dateToString(d);
      const selection = newSelections.get(key) || { date: d, dayType: 'full' };
      selections.push(selection);
    });

    onChange?.(newValue, selections);
  };

  const handleRangeSelection = (date: Date): { dates: Date[], rangeCompleted: boolean } => {
    if (!Array.isArray(value) || value.length === 0) {
      return { dates: [date], rangeCompleted: false };
    }
    if (value.length === 1) {
      const dates = date < value[0] ? [date, value[0]] : [value[0], date];
      return { dates, rangeCompleted: true };
    }
    return { dates: [date], rangeCompleted: false };
  };

  const handleMultipleSelection = (date: Date): Date[] => {
    const current = Array.isArray(value) ? value : [];
    const index = current.findIndex(d => isSameDay(d, date));
    if (index >= 0) {
      return current.filter((_, i) => i !== index);
    }
    return [...current, date];
  };

  // Toggle day type (full/half-morning/half-afternoon)
  const toggleDayType = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!allowHalfDay) return;

    const key = dateToString(date);
    const current = dateSelections.get(key) || { date, dayType: 'full' as DayType };

    const nextType: DayType =
      current.dayType === 'full' ? 'half-morning' :
      current.dayType === 'half-morning' ? 'half-afternoon' :
      'full';

    const newSelections = new Map(dateSelections);
    newSelections.set(key, { date, dayType: nextType });
    setDateSelections(newSelections);

    // Trigger onChange with updated selections
    const selections: DateSelection[] = Array.from(newSelections.values());
    onChange?.(value || null, selections);
  };

  // Calendar generation
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDayOfWeek === 1 ? (day === 0 ? 6 : day - 1) : day;
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: (Date | null)[] = [];

    // Previous month days
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }

    return days;
  };

  const weekDays = firstDayOfWeek === 1
    ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const calendarDays = generateCalendarDays();

  // Navigation
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Year/Month picker handlers
  const handleYearClick = () => {
    setShowYearPicker(!showYearPicker);
    setShowMonthPicker(false);
  };

  const handleMonthClick = () => {
    setShowMonthPicker(!showMonthPicker);
    setShowYearPicker(false);
  };

  const selectYear = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth()));
    setShowYearPicker(false);
  };

  const selectMonth = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex));
    setShowMonthPicker(false);
  };

  // Generate year range for picker (current year ± 20 years)
  const generateYearRange = () => {
    const currentYear = currentMonth.getFullYear();
    const startYear = currentYear - 20;
    const years: number[] = [];
    for (let i = 0; i < 41; i++) {
      years.push(startYear + i);
    }
    return years;
  };

  // Cell styles
  const getCellStyles = (date: Date | null): React.CSSProperties => {
    if (!date) {
      return {
        width: config.cellSize,
        height: config.cellSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      };
    }

    const selected = isDateSelected(date);
    const inRange = isDateInRange(date);
    const disabled = isDateDisabled(date);
    const today = isSameDay(date, new Date());
    const hovered = hoveredDate && isSameDay(hoveredDate, date);

    // Check if this date has a half-day selection
    const key = dateToString(date);
    const selection = dateSelections.get(key);
    const hasHalfDay = selected && allowHalfDay && selection && selection.dayType !== 'full';

    // Determine text color based on background
    let textColor: string;
    if (selected && !hasHalfDay) {
      textColor = getContrastTextColor(semanticColor);
    } else if (disabled) {
      textColor = theme.text.disabled;
    } else if (today) {
      textColor = semanticColor;
    } else {
      textColor = theme.text.primary;
    }

    return {
      width: config.cellSize,
      height: config.cellSize,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      cursor: disabled ? 'not-allowed' : 'pointer',
      backgroundColor: selected && !hasHalfDay
        ? semanticColor
        : inRange
        ? semanticColor + '22'
        : hovered && !disabled
        ? theme.background.secondary
        : 'transparent',
      color: textColor,
      fontWeight: today ? 600 : selected ? 600 : 400,
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.2s ease',
      border: today && !selected ? `2px solid ${semanticColor}` : 'none',
      position: 'relative'
    };
  };

  const getDayTypeIndicator = (date: Date) => {
    if (!allowHalfDay) return null;

    const key = dateToString(date);
    const selection = dateSelections.get(key);
    console.log('getDayTypeIndicator - date:', date, 'key:', key, 'selection:', selection, 'dateSelections size:', dateSelections.size);
    if (!selection || !isDateSelected(date)) return null;

    const dayType = selection.dayType || 'full';
    console.log('getDayTypeIndicator - rendering dayType:', dayType);

    // For full day, no indicator needed (entire circle is colored)
    if (dayType === 'full') return null;

    // For half-day, show COLORED overlay on the SELECTED half
    // Base circle is transparent, overlay provides the color
    // Use the SAME color as range selection (darker green) not bright green
    const rangeColor = semanticColor + '22';

    if (dayType === 'half-morning') {
      // Morning selected (left half), so COLOR the left half
      return (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '50%',
            height: '100%',
            backgroundColor: rangeColor
          }} />
        </div>
      );
    }

    if (dayType === 'half-afternoon') {
      // Afternoon selected (right half), so COLOR the right half
      return (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '50%',
            height: '100%',
            backgroundColor: rangeColor
          }} />
        </div>
      );
    }

    return null;
  };

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
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <Button
          variant="ghost"
          size={size}
          onClick={previousMonth}
          iconOnly
          leftIcon={<span>‹</span>}
        />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            onClick={handleMonthClick}
            style={{
              fontSize: config.headerFontSize,
              fontWeight: 600,
              cursor: 'pointer',
              color: theme.text.primary,
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease',
              backgroundColor: showMonthPicker ? theme.background.secondary : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!showMonthPicker) {
                e.currentTarget.style.backgroundColor = theme.background.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (!showMonthPicker) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {monthNames[currentMonth.getMonth()]}
          </span>
          <span
            onClick={handleYearClick}
            style={{
              fontSize: config.headerFontSize,
              fontWeight: 600,
              cursor: 'pointer',
              color: theme.text.primary,
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease',
              backgroundColor: showYearPicker ? theme.background.secondary : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!showYearPicker) {
                e.currentTarget.style.backgroundColor = theme.background.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (!showYearPicker) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {currentMonth.getFullYear()}
          </span>
        </div>

        <Button
          variant="ghost"
          size={size}
          onClick={nextMonth}
          iconOnly
          leftIcon={<span>›</span>}
        />
      </div>

      {/* Year Picker */}
      {showYearPicker && (
        <div style={{
          backgroundColor: theme.background.primary,
          border: `1px solid ${theme.border.default}`,
          borderRadius: '8px',
          padding: 12,
          marginBottom: 16,
          maxHeight: 280,
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8
          }}>
            {generateYearRange().map((year) => {
              const isActive = year === currentMonth.getFullYear();
              const textColor = isActive ? getContrastTextColor(semanticColor) : theme.text.primary;

              return (
                <div
                  key={year}
                  onClick={() => selectYear(year)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: isActive
                      ? semanticColor
                      : 'transparent',
                    color: textColor,
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    fontWeight: isActive ? 600 : 400
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = theme.background.secondary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Typography variant="body2" style={{ fontSize: config.fontSize, color: textColor }}>
                    {year}
                  </Typography>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month Picker */}
      {showMonthPicker && (
        <div style={{
          backgroundColor: theme.background.primary,
          border: `1px solid ${theme.border.default}`,
          borderRadius: '8px',
          padding: 12,
          marginBottom: 16
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8
          }}>
            {monthNames.map((month, index) => {
              const isActive = index === currentMonth.getMonth();
              const textColor = isActive ? getContrastTextColor(semanticColor) : theme.text.primary;

              return (
                <div
                  key={index}
                  onClick={() => selectMonth(index)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: isActive
                      ? semanticColor
                      : 'transparent',
                    color: textColor,
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    fontWeight: isActive ? 600 : 400
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = theme.background.secondary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Typography variant="body2" style={{ fontSize: config.fontSize, color: textColor }}>
                    {month}
                  </Typography>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week days header */}
      {!showYearPicker && !showMonthPicker && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(7, ${config.cellSize}px)`,
          gap: 4,
          marginBottom: 8
        }}>
        {weekDays.map((day, index) => (
          <div
            key={index}
            style={{
              width: config.cellSize,
              height: config.cellSize / 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography
              variant="caption"
              style={{
                fontSize: config.fontSize - 2,
                fontWeight: 600,
                color: theme.text.secondary
              }}
            >
              {day}
            </Typography>
          </div>
        ))}
      </div>
      )}

      {/* Calendar grid */}
      {!showYearPicker && !showMonthPicker && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(7, ${config.cellSize}px)`,
            gap: 4
          }}>
            {calendarDays.map((date, index) => {
              const cellStyles = getCellStyles(date);

              return (
                <div
                  key={index}
                  style={cellStyles}
                  onClick={() => date && handleDateClick(date)}
                  onMouseEnter={() => date && setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                  onDoubleClick={(e) => date && allowHalfDay && isDateSelected(date) && toggleDayType(date, e)}
                >
                  {date && getDayTypeIndicator(date)}
                  {date && (
                    <Typography
                      variant="body2"
                      style={{
                        fontSize: config.fontSize,
                        position: 'relative',
                        zIndex: 1,
                        color: cellStyles.color
                      }}
                    >
                      {date.getDate()}
                    </Typography>
                  )}
                </div>
              );
            })}
          </div>

          {/* Helper text for half-day */}
          {allowHalfDay && (
            <Typography
              variant="caption"
              style={{
                fontSize: config.fontSize - 2,
                color: theme.text.secondary,
                marginTop: 12,
                display: 'block',
                textAlign: 'center'
              }}
            >
              {rangeHalfDayConfig && selectionMode === 'range'
                ? `Start: ${rangeHalfDayConfig.startDayType === 'half-afternoon' ? 'Afternoon' : rangeHalfDayConfig.startDayType === 'half-morning' ? 'Morning' : 'Full day'}, End: ${rangeHalfDayConfig.endDayType === 'half-morning' ? 'Morning' : rangeHalfDayConfig.endDayType === 'half-afternoon' ? 'Afternoon' : 'Full day'}`
                : 'Double-click selected dates to toggle full/half-day'}
            </Typography>
          )}

          {/* Cancel/Validate buttons for range or half-day selections */}
          {(selectionMode === 'range' || allowHalfDay) && (onCancel || onValidate) && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 16,
              paddingTop: 12,
              borderTop: `1px solid ${theme.border.default}`
            }}>
              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outlined"
                  size={size}
                  type="secondary"
                >
                  Cancel
                </Button>
              )}
              {onValidate && (
                <Button
                  onClick={onValidate}
                  variant="filled"
                  size={size}
                  type={semantic}
                >
                  Validate
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
