import React from 'react';
import { useTheme } from '../theme';

interface SideBarIconProps {
  selected?: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
  position?: 'left' | 'right';
}

export const SideBarIcon: React.FC<SideBarIconProps> = ({ selected = false, icon, onClick, position = 'left' }) => {
  const { theme } = useTheme();

  return (
    <div
      onClick={onClick}
      style={{
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        color: selected ? theme.text.primary : theme.text.secondary,
        transition: 'color 0.2s ease'
      }}
    >
      {/* Selection indicator - 2px white bar on the appropriate side */}
      {selected && (
        <div style={{
          position: 'absolute',
          left: position === 'left' ? '0px' : undefined,
          right: position === 'right' ? '1px' : undefined,
          top: '0px',
          bottom: '0px',
          width: '2px',
          backgroundColor: theme.accent.primary,
          pointerEvents: 'none'
        }} />
      )}

      {/* Icon container */}
      <div style={{
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
    </div>
  );
};
