import React from 'react';
import { useTheme } from '../../theme';
import { Typography } from '../Typography/Typography';

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  avatar,
  action,
  style,
  className
}) => {
  const { theme: _theme } = useTheme();

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
    ...style
  };

  const avatarContainerStyles: React.CSSProperties = {
    flexShrink: 0
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    minWidth: 0
  };

  const actionStyles: React.CSSProperties = {
    marginLeft: 'auto',
    flexShrink: 0
  };

  return (
    <div style={headerStyles} className={className}>
      {avatar && (
        <div style={avatarContainerStyles}>
          {avatar}
        </div>
      )}
      <div style={contentStyles}>
        <Typography variant="h6" gutterBottom={!!subtitle}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="secondary">
            {subtitle}
          </Typography>
        )}
      </div>
      {action && (
        <div style={actionStyles}>
          {action}
        </div>
      )}
    </div>
  );
};
