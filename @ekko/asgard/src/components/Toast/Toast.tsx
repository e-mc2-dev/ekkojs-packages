import React, { useState, useEffect } from 'react';
import { useTheme } from '../../theme';
import { Typography } from '../Typography/Typography';
import { Button } from '../Button/Button';
import type { Toast as ToastType, ToastSeverity } from './ToastContext';

export interface ToastProps extends ToastType {
  onClose: (id: string) => void;
}

const DEFAULT_ICONS: Record<ToastSeverity, string> = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '⊗'
};

export const Toast: React.FC<ToastProps> = ({
  id,
  severity = 'info',
  title,
  message,
  action,
  icon,
  onClose
}) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
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

  const getSeverityType = (): 'success' | 'info' | 'warning' | 'error' => {
    return severity;
  };

  const toastStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '4px',
    backgroundColor: theme.background.primary,
    border: `1px solid ${severityColor}`,
    color: theme.text.primary,
    gap: '12px',
    minWidth: '300px',
    maxWidth: '500px',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
    opacity: isExiting ? 0 : isVisible ? 1 : 0,
    transform: isExiting ? 'translateY(-10px)' : isVisible ? 'translateY(0)' : 'translateY(-10px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    marginBottom: '8px'
  };

  const iconContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '20px',
    color: severityColor,
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

  const renderIcon = () => {
    if (icon === false) return null;
    if (icon !== undefined) return icon;
    return DEFAULT_ICONS[severity];
  };

  return (
    <div style={toastStyles} role="alert">
      {icon !== false && (
        <div style={iconContainerStyles}>
          {renderIcon()}
        </div>
      )}

      <div style={contentStyles}>
        {title && (
          <Typography variant="body2" weight="medium" color="primary">
            {title}
          </Typography>
        )}
        <Typography variant="body2" color="primary">
          {message}
        </Typography>
      </div>

      <div style={actionContainerStyles}>
        {action}
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
            color: severityColor
          }}
        />
      </div>
    </div>
  );
};
