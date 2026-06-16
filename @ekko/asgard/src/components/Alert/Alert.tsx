import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Typography } from '../Typography/Typography';
import { Button } from '../Button/Button';

export type AlertSeverity = 'success' | 'info' | 'warning' | 'error';
export type AlertVariant = 'standard' | 'outlined' | 'filled';

export interface AlertProps {
  severity?: AlertSeverity;
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode | false;
  action?: React.ReactNode;
  onClose?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

const DEFAULT_ICONS: Record<AlertSeverity, string> = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '⊗'
};

export const Alert: React.FC<AlertProps> = ({
  severity = 'info',
  variant = 'standard',
  title,
  children,
  icon,
  action,
  onClose,
  style,
  className
}) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  // Get severity color
  const getSeverityColor = (): string => {
    switch (severity) {
      case 'success':
        return theme.semantic.success;
      case 'info':
        return theme.semantic.info;
      case 'warning':
        return theme.semantic.warning;
      case 'error':
        return theme.semantic.error;
      default:
        return theme.semantic.info;
    }
  };

  const severityColor = getSeverityColor();

  // Get severity type for Button component
  const getSeverityType = (): 'success' | 'info' | 'warning' | 'error' => {
    return severity;
  };

  // Get background color based on variant
  const getBackgroundColor = (): string => {
    if (variant === 'filled') {
      return severityColor;
    }
    if (variant === 'outlined') {
      return 'transparent';
    }
    // standard variant - light background
    return `${severityColor}22`;
  };

  // Get text color based on variant
  const getTextColor = (): 'primary' | 'inherit' => {
    if (variant === 'filled') {
      return 'inherit';
    }
    return 'primary';
  };

  // Get icon color based on variant
  const getIconColor = (): string => {
    if (variant === 'filled') {
      return '#ffffff';
    }
    return severityColor;
  };

  // Get border style
  const getBorderStyle = (): string => {
    if (variant === 'outlined') {
      return `1px solid ${severityColor}`;
    }
    if (variant === 'filled') {
      return 'none';
    }
    return `1px solid ${severityColor}44`;
  };

  const alertStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '4px',
    backgroundColor: getBackgroundColor(),
    border: getBorderStyle(),
    color: variant === 'filled' ? '#ffffff' : theme.text.primary,
    gap: '12px',
    ...style
  };

  const iconContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '20px',
    color: getIconColor(),
    flexShrink: 0,
    lineHeight: 1
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  };

  const actionContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: 'auto',
    flexShrink: 0
  };

  // Determine which icon to show
  const renderIcon = () => {
    if (icon === false) return null;
    if (icon !== undefined) return icon;
    return DEFAULT_ICONS[severity];
  };

  return (
    <div style={alertStyles} className={className} role="alert">
      {icon !== false && (
        <div style={iconContainerStyles}>
          {renderIcon()}
        </div>
      )}

      <div style={contentStyles}>
        {title && (
          <Typography variant="body2" weight="medium" color={getTextColor()}>
            {title}
          </Typography>
        )}
        {children && (
          <Typography variant="body2" color={getTextColor()}>
            {children}
          </Typography>
        )}
      </div>

      {(action || onClose) && (
        <div style={actionContainerStyles}>
          {action}
          {onClose && (
            <Button
              variant="ghost"
              size="small"
              type={getSeverityType()}
              iconOnly
              leftIcon="✕"
              onClick={handleClose}
              title="Close"
              style={{
                minWidth: '24px',
                width: '24px',
                height: '24px',
                padding: '0',
                color: variant === 'filled' ? '#ffffff' : severityColor
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
