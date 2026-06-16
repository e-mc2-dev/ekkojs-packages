import React, { useState, Children, cloneElement } from 'react';
import type { ReactElement } from 'react';
import { useTheme } from '../../theme';
import type { ButtonProps } from './Button';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';
export type ButtonGroupMode = 'normal' | 'toggle' | 'radio';

export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: ButtonGroupOrientation;
  mode?: ButtonGroupMode;
  value?: number | number[];  // Index or indices of active buttons
  onChange?: (value: number | number[]) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  spacing?: number;  // Spacing between buttons (0 means merged)
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  mode = 'normal',
  value,
  onChange,
  disabled = false,
  fullWidth = false,
  spacing = 0
}) => {
  const { theme: _theme } = useTheme();
  const [internalValue, setInternalValue] = useState<number | number[]>(
    mode === 'radio' ? -1 : []
  );

  const isControlled = onChange !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleButtonClick = (index: number, originalOnClick?: (e: React.MouseEvent<HTMLButtonElement>) => void) => {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      // Call original onClick if provided
      originalOnClick?.(e);

      // Handle mode-specific behavior
      if (mode === 'radio') {
        const newValue = index;
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      } else if (mode === 'toggle') {
        const currentArray = Array.isArray(currentValue) ? currentValue : [];
        const newValue = currentArray.includes(index)
          ? currentArray.filter(i => i !== index)
          : [...currentArray, index];

        if (!isControlled) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      }
    };
  };

  const isButtonActive = (index: number): boolean => {
    if (mode === 'normal') return false;
    if (mode === 'radio') return currentValue === index;
    if (mode === 'toggle') {
      return Array.isArray(currentValue) && currentValue.includes(index);
    }
    return false;
  };

  const getBorderRadius = (index: number, total: number) => {
    if (spacing > 0) return '4px';  // Individual buttons keep their radius
    if (total === 1) return '4px';

    if (orientation === 'horizontal') {
      if (index === 0) return '4px 0 0 4px';
      if (index === total - 1) return '0 4px 4px 0';
      return '0';
    } else {
      if (index === 0) return '4px 4px 0 0';
      if (index === total - 1) return '0 0 4px 4px';
      return '0';
    }
  };

  const getBorderStyle = (index: number, total: number, buttonVariant?: string) => {
    // If spacing > 0, buttons are separate - use default borders
    if (spacing > 0) return {};
    if (total === 1) return {};

    // For merged buttons, we need to remove specific borders
    const noBorder = '0';

    if (orientation === 'horizontal') {
      // Left button: remove right border
      if (index === 0) {
        return buttonVariant === 'outlined' || buttonVariant === 'ghost'
          ? { borderRight: noBorder }
          : {};
      }
      // Right button: remove left border
      if (index === total - 1) {
        return buttonVariant === 'outlined' || buttonVariant === 'ghost'
          ? { borderLeft: noBorder }
          : {};
      }
      // Middle buttons: remove left and right borders
      return buttonVariant === 'outlined' || buttonVariant === 'ghost'
        ? { borderLeft: noBorder, borderRight: noBorder }
        : {};
    } else {
      // Vertical orientation
      // Top button: remove bottom border
      if (index === 0) {
        return buttonVariant === 'outlined' || buttonVariant === 'ghost'
          ? { borderBottom: noBorder }
          : {};
      }
      // Bottom button: remove top border
      if (index === total - 1) {
        return buttonVariant === 'outlined' || buttonVariant === 'ghost'
          ? { borderTop: noBorder }
          : {};
      }
      // Middle buttons: remove top and bottom borders
      return buttonVariant === 'outlined' || buttonVariant === 'ghost'
        ? { borderTop: noBorder, borderBottom: noBorder }
        : {};
    }
  };

  const childArray = Children.toArray(children).filter(child =>
    React.isValidElement(child)
  ) as ReactElement<ButtonProps>[];

  const totalButtons = childArray.length;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: orientation === 'horizontal' ? 'row' : 'column',
        gap: spacing > 0 ? `${spacing}px` : '0',
        width: fullWidth ? '100%' : 'auto',
        position: 'relative'
      }}
    >
      {childArray.map((child, index) => {
        const buttonProps = child.props;
        const isActive = isButtonActive(index);
        const borderStyle = getBorderStyle(index, totalButtons, buttonProps.variant);

        return (
          <div
            key={index}
            style={{
              flex: fullWidth ? 1 : orientation === 'vertical' ? '1 1 auto' : '0 0 auto',
              position: 'relative',
              marginLeft: spacing === 0 && index > 0 && orientation === 'horizontal' ? '-1px' : '0',
              marginTop: spacing === 0 && index > 0 && orientation === 'vertical' ? '-1px' : '0',
              zIndex: isActive ? 2 : 1
            }}
          >
            {cloneElement(child, {
              ...buttonProps,
              disabled: disabled || buttonProps.disabled,
              active: isActive || buttonProps.active,
              fullWidth: fullWidth || orientation === 'vertical',
              onClick: handleButtonClick(index, buttonProps.onClick),
              style: {
                ...buttonProps.style,
                borderRadius: getBorderRadius(index, totalButtons),
                ...borderStyle,
                width: fullWidth || orientation === 'vertical' ? '100%' : buttonProps.style?.width
              }
            })}
          </div>
        );
      })}
    </div>
  );
};
