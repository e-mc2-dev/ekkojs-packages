import React, { cloneElement, isValidElement } from 'react';

export interface SwitchGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  spacing?: number;
  name?: string;
}

export const SwitchGroup: React.FC<SwitchGroupProps> = ({
  children,
  orientation = 'vertical',
  disabled = false,
  spacing = 12,
  name
}) => {
  const childArray = React.Children.toArray(children).filter(isValidElement);

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    gap: spacing,
    alignItems: orientation === 'horizontal' ? 'center' : 'flex-start'
  };

  return (
    <div style={containerStyles}>
      {childArray.map((child, index) => {
        if (!isValidElement(child)) return child;

        const childProps = child.props as { disabled?: boolean };
        const switchProps: Record<string, unknown> = {
          disabled: disabled || childProps.disabled
        };

        if (name) {
          switchProps.name = name;
        }

        return cloneElement(child, {
          key: index,
          ...switchProps
        });
      })}
    </div>
  );
};
