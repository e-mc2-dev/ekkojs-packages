import React, { createContext, useContext, useState, useCallback } from 'react';
let toastSeq = 0;

export type ToastSeverity = 'success' | 'info' | 'warning' | 'error';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastOptions {
  severity?: ToastSeverity;
  title?: string;
  message: string;
  position?: ToastPosition;
  duration?: number; // 0 = persistent
  action?: React.ReactNode;
  icon?: React.ReactNode | false;
}

export interface Toast extends ToastOptions {
  id: string;
  createdAt: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (options: ToastOptions) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((options: ToastOptions): string => {
    const id = `toast-${++toastSeq}`;
    const toast: Toast = {
      id,
      createdAt: Date.now(),
      severity: 'info',
      position: 'top-right',
      duration: 5000,
      ...options
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-hide if duration is set
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, clearAllToasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
