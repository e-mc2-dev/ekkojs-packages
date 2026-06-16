import React from 'react';
import { Button } from './Button';
import type { ButtonProps } from './Button';

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon' | 'iconOnly'> {
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  badge,
  badgeColor,
  ...buttonProps
}) => {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <Button
        {...buttonProps}
        leftIcon={icon}
        iconOnly={true}
      />

      {badge !== undefined && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#ffffff',
            backgroundColor: badgeColor || '#f85552',
            borderRadius: '9px',
            border: '2px solid var(--bg-primary, #1e1e1e)',
            pointerEvents: 'none'
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
};
