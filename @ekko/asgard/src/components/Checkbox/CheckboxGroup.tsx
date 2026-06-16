import React, { Children, cloneElement } from 'react';
import type { ReactElement } from 'react';
import type { CheckboxProps } from './Checkbox';

export type CheckboxGroupOrientation = 'horizontal' | 'vertical';

export interface CheckboxGroupProps {
  children: React.ReactNode;
  orientation?: CheckboxGroupOrientation;
  value?: string[];  // Array of checked values
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  spacing?: number;
  name?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  children,
  orientation = 'vertical',
  value = [],
  onChange,
  disabled = false,
  spacing = 8,
  name
}) => {
  const handleCheckboxChange = (checkboxValue: string | undefined, checked: boolean) => {
    if (!checkboxValue) return;

    const newValue = checked
      ? [...value, checkboxValue]
      : value.filter(v => v !== checkboxValue);

    onChange?.(newValue);
  };

  const childArray = Children.toArray(children).filter(child =>
    React.isValidElement(child)
  ) as ReactElement<CheckboxProps>[];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: orientation === 'horizontal' ? 'row' : 'column',
        gap: `${spacing}px`,
        alignItems: orientation === 'horizontal' ? 'center' : 'flex-start'
      }}
    >
      {childArray.map((child, index) => {
        const checkboxProps = child.props;
        const checkboxValue = checkboxProps.value;
        const isChecked = checkboxValue ? value.includes(checkboxValue) : checkboxProps.checked;

        return cloneElement(child, {
          key: index,
          ...checkboxProps,
          checked: isChecked,
          disabled: disabled || checkboxProps.disabled,
          name: name || checkboxProps.name,
          onChange: (checked: boolean) => {
            checkboxProps.onChange?.(checked);
            handleCheckboxChange(checkboxValue, checked);
          }
        });
      })}
    </div>
  );
};
