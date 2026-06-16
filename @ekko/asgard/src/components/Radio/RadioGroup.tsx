import React, { Children, cloneElement } from 'react';
import type { ReactElement } from 'react';
import type { RadioProps } from './Radio';

export type RadioGroupOrientation = 'horizontal' | 'vertical';

export interface RadioGroupProps {
  children: React.ReactNode;
  orientation?: RadioGroupOrientation;
  value?: string;  // Selected value
  onChange?: (value: string) => void;
  disabled?: boolean;
  spacing?: number;
  name: string;  // Required for radio groups
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  children,
  orientation = 'vertical',
  value,
  onChange,
  disabled = false,
  spacing = 8,
  name
}) => {
  const handleRadioChange = (radioValue: string | undefined) => {
    if (radioValue && radioValue !== value) {
      onChange?.(radioValue);
    }
  };

  const childArray = Children.toArray(children).filter(child =>
    React.isValidElement(child)
  ) as ReactElement<RadioProps>[];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: orientation === 'horizontal' ? 'row' : 'column',
        gap: `${spacing}px`,
        alignItems: orientation === 'horizontal' ? 'center' : 'flex-start'
      }}
      role="radiogroup"
    >
      {childArray.map((child, index) => {
        const radioProps = child.props;
        const radioValue = radioProps.value;
        const isChecked = radioValue === value;

        return cloneElement(child, {
          key: index,
          ...radioProps,
          checked: isChecked,
          disabled: disabled || radioProps.disabled,
          name: name,
          onChange: () => {
            radioProps.onChange?.(true);
            handleRadioChange(radioValue);
          }
        });
      })}
    </div>
  );
};
