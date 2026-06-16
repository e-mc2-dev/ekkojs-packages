import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { FloatingWindow } from '../FloatingWindow';
import { PromptPopup } from './PromptPopup';
import { useTheme } from '../../theme';

// Action button configuration
export interface PopupAction {
  label: string;
  value?: any;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
}

// Base popup configuration
export interface BasePopupConfig {
  title?: string;
  icon?: React.ReactNode;
  width?: number;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
}

// Confirm popup configuration
export interface ConfirmConfig extends BasePopupConfig {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
}

// Prompt popup configuration
export interface PromptConfig extends BasePopupConfig {
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  validation?: RegExp | ((value: string) => boolean);
  validationMessage?: string;
}

// Custom popup configuration
export interface CustomConfig extends BasePopupConfig {
  content: React.ReactNode;
  actions?: PopupAction[];
  footer?: string;
}

// Internal popup state
interface PopupState {
  id: string;
  type: 'confirm' | 'prompt' | 'custom';
  config: ConfirmConfig | PromptConfig | CustomConfig;
  resolve: (value: any) => void;
  reject: () => void;
}

// Context value
interface PopupsContextValue {
  confirm: (config: ConfirmConfig) => Promise<boolean>;
  prompt: (config: PromptConfig) => Promise<string | null>;
  custom: (config: CustomConfig) => Promise<any>;
}

const PopupsContext = createContext<PopupsContextValue | null>(null);

export const usePopups = (): PopupsContextValue => {
  const context = useContext(PopupsContext);
  if (!context) {
    throw new Error('usePopups must be used within PopupsProvider');
  }
  return context;
};

export const PopupsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const [popups, setPopups] = useState<PopupState[]>([]);
  const nextId = useRef(0);

  const createPopup = useCallback(<T,>(
    type: PopupState['type'],
    config: ConfirmConfig | PromptConfig | CustomConfig
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const id = `popup-${nextId.current++}`;
      setPopups((prev) => [...prev, { id, type, config, resolve, reject }]);
    });
  }, []);

  const confirm = useCallback(
    (config: ConfirmConfig): Promise<boolean> => {
      return createPopup<boolean>('confirm', config);
    },
    [createPopup]
  );

  const prompt = useCallback(
    (config: PromptConfig): Promise<string | null> => {
      return createPopup<string | null>('prompt', config);
    },
    [createPopup]
  );

  const custom = useCallback(
    (config: CustomConfig): Promise<any> => {
      return createPopup<any>('custom', config);
    },
    [createPopup]
  );

  // Unused - keeping for potential future use
  // const _closePopup = useCallback((id: string) => {
  //   setPopups((prev) => prev.filter((p) => p.id !== id));
  // }, []);

  const handleResolve = useCallback((id: string, value: any) => {
    setPopups((prev) => {
      const popup = prev.find((p) => p.id === id);
      if (popup) {
        popup.resolve(value);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleReject = useCallback((id: string) => {
    setPopups((prev) => {
      const popup = prev.find((p) => p.id === id);
      if (popup) {
        popup.reject();
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  // Button styles
  const getButtonStyle = (variant: 'primary' | 'secondary' | 'danger' = 'primary'): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'inherit',
      transition: 'background-color 0.2s, opacity 0.2s',
      fontWeight: 500
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.accent.primary,
          color: theme.text.inverse
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.background.secondary,
          color: theme.text.primary,
          border: `1px solid ${theme.border.default}`
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: '#d32f2f',
          color: '#ffffff'
        };
      default:
        return baseStyle;
    }
  };

  const value: PopupsContextValue = {
    confirm,
    prompt,
    custom
  };

  return (
    <PopupsContext.Provider value={value}>
      {children}
      {popups.map((popup) => {
        if (popup.type === 'confirm') {
          const config = popup.config as ConfirmConfig;
          return (
            <FloatingWindow
              key={popup.id}
              title={config.title || 'Confirm'}
              isOpen={true}
              onClose={() => handleResolve(popup.id, false)}
              modal={true}
              width={config.width || 400}
              icon={config.icon || '❓'}
              closeOnEscape={config.closeOnEscape ?? true}
              closeOnClickOutside={config.closeOnClickOutside ?? false}
              showCloseButton={false}
              actions={
                <>
                  <button
                    onClick={() => handleResolve(popup.id, false)}
                    style={getButtonStyle('secondary')}
                  >
                    {config.cancelLabel || 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleResolve(popup.id, true)}
                    style={getButtonStyle(config.confirmVariant || 'primary')}
                  >
                    {config.confirmLabel || 'OK'}
                  </button>
                </>
              }
            >
              <div style={{ color: theme.text.primary }}>
                {config.message}
              </div>
            </FloatingWindow>
          );
        }

        if (popup.type === 'prompt') {
          const config = popup.config as PromptConfig;
          return (
            <PromptPopup
              key={popup.id}
              id={popup.id}
              config={config}
              onResolve={(value) => handleResolve(popup.id, value)}
            />
          );
        }

        if (popup.type === 'custom') {
          const config = popup.config as CustomConfig;
          return (
            <FloatingWindow
              key={popup.id}
              title={config.title || 'Dialog'}
              isOpen={true}
              onClose={() => handleReject(popup.id)}
              modal={true}
              width={config.width || 500}
              icon={config.icon}
              closeOnEscape={config.closeOnEscape ?? true}
              closeOnClickOutside={config.closeOnClickOutside ?? false}
              footer={config.footer}
              actions={
                config.actions && config.actions.length > 0 ? (
                  <>
                    {config.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          action.onClick?.();
                          handleResolve(popup.id, action.value ?? action.label);
                        }}
                        style={getButtonStyle(action.variant || 'primary')}
                      >
                        {action.label}
                      </button>
                    ))}
                  </>
                ) : undefined
              }
            >
              {config.content}
            </FloatingWindow>
          );
        }

        return null;
      })}
    </PopupsContext.Provider>
  );
};
