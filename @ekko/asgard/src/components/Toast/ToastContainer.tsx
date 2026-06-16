import React from 'react';
import { useToast } from './ToastContext';
import type { ToastPosition } from './ToastContext';
// NOTE: value import — `Toast` is used as a component (<Toast/>) below. A `import type` here erases it at
// runtime, leaving `Toast` undefined and crashing hydration the moment a toast renders.
import { Toast } from './Toast';

export const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  // Group toasts by position
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const position = toast.position || 'top-right';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(toast);
    return acc;
  }, {} as Record<ToastPosition, typeof toasts>);

  const getPositionStyles = (position: ToastPosition): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      pointerEvents: 'none',
      padding: '16px'
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: 0, left: 0 };
      case 'top-center':
        return { ...baseStyles, top: 0, left: '50%', transform: 'translateX(-50%)' };
      case 'top-right':
        return { ...baseStyles, top: 0, right: 0 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 0, left: 0, flexDirection: 'column-reverse' };
      case 'bottom-center':
        return { ...baseStyles, bottom: 0, left: '50%', transform: 'translateX(-50%)', flexDirection: 'column-reverse' };
      case 'bottom-right':
        return { ...baseStyles, bottom: 0, right: 0, flexDirection: 'column-reverse' };
      default:
        return { ...baseStyles, top: 0, right: 0 };
    }
  };

  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div key={position} style={getPositionStyles(position as ToastPosition)}>
          {positionToasts.map((toast) => (
            <div key={toast.id} style={{ pointerEvents: 'auto' }}>
              <Toast {...toast} onClose={hideToast} />
            </div>
          ))}
        </div>
      ))}
    </>
  );
};
