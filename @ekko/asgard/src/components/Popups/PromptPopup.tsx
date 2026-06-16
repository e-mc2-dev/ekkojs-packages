import React, { useState } from 'react';
import { FloatingWindow } from '../FloatingWindow';
import { TextBox } from '../TextBox';
import { useTheme } from '../../theme';
import type { PromptConfig } from './PopupsProvider';

interface PromptPopupProps {
  id: string;
  config: PromptConfig;
  onResolve: (value: string | null) => void;
}

export const PromptPopup: React.FC<PromptPopupProps> = ({ id, config, onResolve }) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState(config.defaultValue || '');
  const [isValid, setIsValid] = useState(true);

  const handleConfirm = () => {
    if (config.validation) {
      const valid =
        typeof config.validation === 'function'
          ? config.validation(inputValue)
          : config.validation.test(inputValue);

      if (!valid) {
        setIsValid(false);
        return;
      }
    }
    onResolve(inputValue);
  };

  const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary'): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'inherit',
      transition: 'background-color 0.2s',
      fontWeight: 500
    };

    if (variant === 'primary') {
      return {
        ...baseStyle,
        backgroundColor: theme.accent.primary,
        color: theme.text.inverse
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: theme.background.secondary,
        color: theme.text.primary,
        border: `1px solid ${theme.border.default}`
      };
    }
  };

  return (
    <FloatingWindow
      key={id}
      title={config.title || 'Input Required'}
      isOpen={true}
      onClose={() => onResolve(null)}
      modal={true}
      width={config.width || 450}
      icon={config.icon || '✏️'}
      closeOnEscape={config.closeOnEscape ?? true}
      closeOnClickOutside={config.closeOnClickOutside ?? false}
      showCloseButton={false}
      actions={
        <>
          <button onClick={() => onResolve(null)} style={getButtonStyle('secondary')}>
            {config.cancelLabel || 'Cancel'}
          </button>
          <button onClick={handleConfirm} style={getButtonStyle('primary')}>
            {config.confirmLabel || 'OK'}
          </button>
        </>
      }
    >
      <div>
        {config.message && (
          <p style={{ marginTop: 0, marginBottom: '16px', color: theme.text.primary }}>
            {config.message}
          </p>
        )}
        <TextBox
          value={inputValue}
          onChange={(value) => {
            setInputValue(value);
            setIsValid(true);
          }}
          placeholder={config.placeholder}
          width="full"
          semantic={isValid ? 'primary' : 'error'}
          hintText={!isValid && config.validationMessage ? config.validationMessage : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleConfirm();
            }
          }}
        />
      </div>
    </FloatingWindow>
  );
};
