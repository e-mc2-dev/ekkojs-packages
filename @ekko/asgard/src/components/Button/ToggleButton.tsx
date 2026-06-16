import React, { useState } from 'react';
import { Button } from './Button';
import type { ButtonProps } from './Button';

export interface ToggleButtonProps extends Omit<ButtonProps, 'active' | 'onClick'> {
  value?: boolean;
  onChange?: (value: boolean) => void;
  onIcon?: React.ReactNode;
  offIcon?: React.ReactNode;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  value = false,
  onChange,
  onIcon,
  offIcon,
  children,
  ...buttonProps
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const isControlled = onChange !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleClick = (_e: React.MouseEvent<HTMLButtonElement>) => {
    const newValue = !currentValue;

    if (!isControlled) {
      setInternalValue(newValue);
    }

    onChange?.(newValue);
  };

  return (
    <Button
      {...buttonProps}
      active={currentValue}
      onClick={handleClick}
      leftIcon={currentValue && onIcon ? onIcon : !currentValue && offIcon ? offIcon : buttonProps.leftIcon}
    >
      {children}
    </Button>
  );
};
