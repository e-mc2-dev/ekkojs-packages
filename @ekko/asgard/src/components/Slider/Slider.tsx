import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../theme';

export type SliderVariant = 'continuous' | 'discrete';
export type SliderType = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type SliderSize = 'small' | 'medium' | 'large';
export type SliderOrientation = 'horizontal' | 'vertical';

export interface SliderMark {
  value: number;
  label?: string;
}

export interface SliderProps {
  value?: number | number[];
  defaultValue?: number | number[];
  min?: number;
  max?: number;
  step?: number;
  marks?: boolean | SliderMark[];
  variant?: SliderVariant;
  type?: SliderType;
  size?: SliderSize;
  orientation?: SliderOrientation;
  disabled?: boolean;
  valueLabelDisplay?: 'on' | 'off' | 'auto';
  onChange?: (value: number | number[]) => void;
  onChangeCommitted?: (value: number | number[]) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value: controlledValue,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  marks = false,
  variant = 'continuous',
  type = 'primary',
  size = 'medium',
  orientation = 'horizontal',
  disabled = false,
  valueLabelDisplay = 'auto',
  onChange,
  onChangeCommitted,
  style,
  className
}) => {
  const { theme } = useTheme();

  // Determine if this is a range slider
  const isRange = Array.isArray(defaultValue) || Array.isArray(controlledValue);

  const [internalValue, setInternalValue] = useState(defaultValue);
  const [activeThumb, setActiveThumb] = useState<number | null>(null);
  const [showValueLabel, setShowValueLabel] = useState<boolean[]>(
    isRange ? [valueLabelDisplay === 'on', valueLabelDisplay === 'on'] : [valueLabelDisplay === 'on']
  );
  const sliderRef = useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Normalize value to array
  const values = Array.isArray(value) ? value : [value];
  const minValue = isRange ? values[0] : min;
  const maxValue = isRange ? values[1] : values[0];

  // Get type color
  const getTypeColor = (): string => {
    if (type === 'primary') return theme.accent.primary;
    if (type === 'secondary') return theme.accent.secondary;
    return theme.semantic[type];
  };

  const typeColor = getTypeColor();

  // Size configurations
  const getSizeConfig = () => {
    const configs = {
      small: { track: 2, thumb: 12, height: 20 },
      medium: { track: 4, thumb: 16, height: 24 },
      large: { track: 6, thumb: 20, height: 28 }
    };
    return configs[size];
  };

  const sizeConfig = getSizeConfig();

  // Calculate percentage
  const getPercentage = (val: number): number => {
    return ((val - min) / (max - min)) * 100;
  };

  // Calculate value from position
  const getValueFromPosition = (clientX: number, clientY: number): number => {
    if (!sliderRef.current) return values[0];

    const rect = sliderRef.current.getBoundingClientRect();
    let percentage: number;

    if (orientation === 'horizontal') {
      percentage = ((clientX - rect.left) / rect.width) * 100;
    } else {
      percentage = ((rect.bottom - clientY) / rect.height) * 100;
    }

    percentage = Math.max(0, Math.min(100, percentage));
    let newValue = min + (percentage / 100) * (max - min);

    // Apply step
    if (step > 0) {
      newValue = Math.round(newValue / step) * step;
    }

    return Math.max(min, Math.min(max, newValue));
  };

  // Find closest thumb
  const findClosestThumb = (clientX: number, clientY: number): number => {
    if (!isRange) return 0;

    const clickValue = getValueFromPosition(clientX, clientY);
    const dist0 = Math.abs(clickValue - values[0]);
    const dist1 = Math.abs(clickValue - values[1]);

    return dist0 < dist1 ? 0 : 1;
  };

  // Handle mouse/touch move
  const handleMove = (clientX: number, clientY: number) => {
    if (activeThumb === null) return;

    const newValue = getValueFromPosition(clientX, clientY);

    if (isRange) {
      const newValues = [...values];

      if (activeThumb === 0) {
        // Moving left thumb - can't go past right thumb
        newValues[0] = Math.min(newValue, values[1]);
      } else {
        // Moving right thumb - can't go past left thumb
        newValues[1] = Math.max(newValue, values[0]);
      }

      if (controlledValue === undefined) {
        setInternalValue(newValues);
      }
      onChange?.(newValues);
    } else {
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    }
  };

  // Shared drag-start (mouse + touch): pick the nearest thumb and jump it to the press position
  const startDrag = (clientX: number, clientY: number) => {
    if (disabled) return;

    const thumbIndex = findClosestThumb(clientX, clientY);
    setActiveThumb(thumbIndex);

    if (valueLabelDisplay === 'auto') {
      const newLabels = [...showValueLabel];
      newLabels[thumbIndex] = true;
      setShowValueLabel(newLabels);
    }

    // Immediately update position
    const newValue = getValueFromPosition(clientX, clientY);

    if (isRange) {
      const newValues = [...values];
      if (thumbIndex === 0) {
        newValues[0] = Math.min(newValue, values[1]);
      } else {
        newValues[1] = Math.max(newValue, values[0]);
      }
      if (controlledValue === undefined) {
        setInternalValue(newValues);
      }
      onChange?.(newValues);
    } else {
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  // Touch events (mobile): swipe to move the value/range
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    if (!touch) return;
    startDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    if (activeThumb === null) return;

    const thumbIndex = activeThumb;

    const endDrag = () => {
      setActiveThumb(null);
      if (valueLabelDisplay === 'auto') {
        const newLabels = [...showValueLabel];
        newLabels[thumbIndex] = false;
        setShowValueLabel(newLabels);
      }
      onChangeCommitted?.(value);
    };

    const handleMouseMove = (_e: MouseEvent) => {
      handleMove(_e.clientX, _e.clientY);
    };

    const handleTouchMove = (_e: TouchEvent) => {
      const touch = _e.touches[0];
      if (!touch) return;
      // Prevent the page from scrolling while dragging the slider.
      _e.preventDefault();
      handleMove(touch.clientX, touch.clientY);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', endDrag);
    document.addEventListener('touchcancel', endDrag);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', endDrag);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', endDrag);
      document.removeEventListener('touchcancel', endDrag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThumb, min, max, step, orientation, values]);

  // Generate marks
  const getMarks = (): SliderMark[] => {
    if (!marks) return [];
    if (Array.isArray(marks)) return marks;

    // Auto-generate marks
    const autoMarks: SliderMark[] = [];
    const stepCount = variant === 'discrete' && step > 0 ? Math.floor((max - min) / step) + 1 : 11;
    const markStep = (max - min) / (stepCount - 1);

    for (let i = 0; i < stepCount; i++) {
      autoMarks.push({ value: min + i * markStep });
    }

    return autoMarks;
  };

  const marksArray = getMarks();

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: orientation === 'horizontal' ? '100%' : `${sizeConfig.height}px`,
    height: orientation === 'horizontal' ? `${sizeConfig.height}px` : '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    paddingTop: orientation === 'horizontal' ? '20px' : '0',
    paddingBottom: orientation === 'horizontal' ? '20px' : '0',
    // Let the slider own touch gestures so a swipe drags the thumb instead of scrolling the page.
    touchAction: 'none',
    ...style
  };

  const railStyles: React.CSSProperties = {
    position: 'absolute',
    ...(orientation === 'horizontal' ? {
      width: '100%',
      height: `${sizeConfig.track}px`,
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)'
    } : {
      height: '100%',
      width: `${sizeConfig.track}px`,
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)'
    }),
    backgroundColor: theme.border.default,
    borderRadius: `${sizeConfig.track / 2}px`
  };

  const trackStyles: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: typeColor,
    borderRadius: `${sizeConfig.track / 2}px`,
    ...(orientation === 'horizontal' ? {
      height: `${sizeConfig.track}px`,
      left: isRange ? `${getPercentage(minValue)}%` : 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: isRange
        ? `${getPercentage(maxValue) - getPercentage(minValue)}%`
        : `${getPercentage(maxValue)}%`
    } : {
      width: `${sizeConfig.track}px`,
      bottom: isRange ? `${getPercentage(minValue)}%` : 0,
      left: '50%',
      transform: 'translateX(-50%)',
      height: isRange
        ? `${getPercentage(maxValue) - getPercentage(minValue)}%`
        : `${getPercentage(maxValue)}%`
    })
  };

  const getThumbStyles = (thumbValue: number, thumbIndex: number): React.CSSProperties => {
    const isDragging = activeThumb === thumbIndex;
    return {
      position: 'absolute',
      width: `${sizeConfig.thumb}px`,
      height: `${sizeConfig.thumb}px`,
      backgroundColor: typeColor,
      borderRadius: '50%',
      border: `2px solid ${theme.background.primary}`,
      boxShadow: isDragging
        ? '0 4px 8px rgba(0, 0, 0, 0.3)'
        : '0 2px 4px rgba(0, 0, 0, 0.2)',
      transition: isDragging ? 'none' : 'all 0.15s ease-in-out',
      cursor: disabled ? 'not-allowed' : 'grab',
      zIndex: isDragging ? 3 : 2,
      ...(orientation === 'horizontal' ? {
        left: `${getPercentage(thumbValue)}%`,
        top: '50%',
        transform: `translate(-50%, -50%) ${isDragging ? 'scale(1.2)' : 'scale(1)'}`
      } : {
        bottom: `${getPercentage(thumbValue)}%`,
        left: '50%',
        transform: `translate(-50%, 50%) ${isDragging ? 'scale(1.2)' : 'scale(1)'}`
      })
    };
  };

  const getValueLabelStyles = (thumbIndex: number): React.CSSProperties => ({
    position: 'absolute',
    bottom: orientation === 'horizontal' ? 'calc(100% + 4px)' : 'auto',
    top: orientation === 'vertical' ? '50%' : 'auto',
    left: orientation === 'horizontal' ? '50%' : 'calc(100% + 4px)',
    transform: orientation === 'horizontal' ? 'translateX(-50%)' : 'translateY(-50%)',
    backgroundColor: typeColor,
    color: '#ffffff',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    opacity: showValueLabel[thumbIndex] ? 1 : 0,
    transition: 'opacity 0.15s ease-in-out',
    pointerEvents: 'none',
    zIndex: 4,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
  });

  const markStyles = (mark: SliderMark): React.CSSProperties => {
    const isActive = isRange
      ? mark.value >= minValue && mark.value <= maxValue
      : mark.value <= maxValue;
    return {
      position: 'absolute',
      width: variant === 'discrete' ? '2px' : '1px',
      height: variant === 'discrete' ? '2px' : '1px',
      backgroundColor: isActive ? typeColor : theme.border.default,
      borderRadius: '50%',
      ...(orientation === 'horizontal' ? {
        left: `${getPercentage(mark.value)}%`,
        top: '50%',
        transform: 'translate(-50%, -50%)'
      } : {
        bottom: `${getPercentage(mark.value)}%`,
        left: '50%',
        transform: 'translate(-50%, 50%)'
      })
    };
  };

  const markLabelStyles = (mark: SliderMark): React.CSSProperties => ({
    position: 'absolute',
    fontSize: '12px',
    color: theme.text.secondary,
    ...(orientation === 'horizontal' ? {
      left: `${getPercentage(mark.value)}%`,
      top: 'calc(50% + 12px)',
      transform: 'translateX(-50%)'
    } : {
      bottom: `${getPercentage(mark.value)}%`,
      left: '100%',
      transform: 'translate(4px, 50%)'
    })
  });

  return (
    <div
      ref={sliderRef}
      style={containerStyles}
      className={className}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div style={railStyles} />
      <div style={trackStyles} />

      {marksArray.map((mark, index) => (
        <React.Fragment key={index}>
          <div style={markStyles(mark)} />
          {mark.label && <div style={markLabelStyles(mark)}>{mark.label}</div>}
        </React.Fragment>
      ))}

      {/* Render thumbs */}
      {values.map((thumbValue, index) => (
        <div key={index} style={getThumbStyles(thumbValue, index)}>
          <div style={getValueLabelStyles(index)}>
            {Math.round(thumbValue)}
          </div>
        </div>
      ))}
    </div>
  );
};
