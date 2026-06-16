import React from 'react';
import { useTheme } from '../../theme';

export type CardVariant = 'plain' | 'outlined' | 'filled';
export type CardType = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  type?: CardType;
  elevation?: number;
  hoverable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'outlined',
  type = 'primary',
  elevation = 0,
  hoverable = false,
  onClick,
  style,
  className
}) => {
  const { theme } = useTheme();

  // Get type color
  const getTypeColor = (): string => {
    if (type === 'primary') return theme.accent.primary;
    if (type === 'secondary') return theme.accent.secondary;
    return theme.semantic[type];
  };

  const typeColor = getTypeColor();

  // Get elevation shadow
  const getElevation = (level: number): string => {
    const elevations: Record<number, string> = {
      0: 'none',
      1: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      2: '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
      3: '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)',
      4: '0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)',
      5: '0 20px 40px rgba(0, 0, 0, 0.2)'
    };
    return elevations[level] || elevations[0];
  };

  // Get card styles based on variant
  const getCardStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      borderRadius: '4px',
      padding: '16px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: getElevation(elevation),
      ...(onClick && { cursor: 'pointer' })
    };

    if (variant === 'plain') {
      return {
        ...base,
        border: 'none',
        backgroundColor: 'transparent'
      };
    }

    if (variant === 'outlined') {
      return {
        ...base,
        border: `1px solid ${theme.border.default}`,
        backgroundColor: theme.background.primary
      };
    }

    if (variant === 'filled') {
      return {
        ...base,
        border: 'none',
        backgroundColor: `${typeColor}11`
      };
    }

    return base;
  };

  const cardStyles: React.CSSProperties = {
    ...getCardStyles(),
    ...style
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverable || onClick) {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = getElevation(elevation + 2);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverable || onClick) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = getElevation(elevation);
    }
  };

  return (
    <div
      style={cardStyles}
      className={className}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};
