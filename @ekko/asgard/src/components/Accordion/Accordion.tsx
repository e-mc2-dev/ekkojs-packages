import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../theme';
import { Typography } from '../Typography/Typography';

export type AccordionVariant = 'plain' | 'outlined' | 'filled';
export type AccordionType = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

export interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
  disabled?: boolean;
  variant?: AccordionVariant;
  type?: AccordionType;
  elevation?: boolean;
  icon?: React.ReactNode;
  summary?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onChange,
  disabled = false,
  variant = 'outlined',
  type = 'primary',
  elevation = false,
  icon,
  summary,
  style,
  className
}) => {
  const { theme } = useTheme();
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, expanded]);

  const handleToggle = () => {
    if (disabled) return;

    const newExpanded = !expanded;
    if (!isControlled) {
      setInternalExpanded(newExpanded);
    }
    onChange?.(newExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  // Get type color
  const getTypeColor = (): string => {
    if (type === 'primary') return theme.accent.primary;
    if (type === 'secondary') return theme.accent.secondary;
    return theme.semantic[type];
  };

  const typeColor = getTypeColor();

  // Get accordion background and border based on variant
  const getAccordionStyles = () => {
    const base: React.CSSProperties = {
      borderRadius: '4px',
      overflow: 'hidden',
      transition: 'all 0.2s ease'
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
        border: `1px solid ${typeColor}`,
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

  // Get summary styles based on variant
  const getSummaryBaseStyles = (): React.CSSProperties => {
    if (variant === 'plain') {
      return {
        backgroundColor: 'transparent',
        borderBottom: expanded ? `1px solid ${typeColor}` : 'none',
        borderLeft: `3px solid ${typeColor}`
      };
    }

    if (variant === 'outlined') {
      return {
        backgroundColor: theme.background.primary,
        borderBottom: expanded ? `1px solid ${typeColor}` : 'none'
      };
    }

    if (variant === 'filled') {
      return {
        backgroundColor: `${typeColor}11`,
        borderBottom: expanded ? `1px solid ${typeColor}22` : 'none'
      };
    }

    return {};
  };

  const getSummaryHoverStyles = (): React.CSSProperties => {
    if (variant === 'plain') {
      return {
        backgroundColor: theme.background.secondary
      };
    }

    if (variant === 'outlined') {
      return {
        backgroundColor: theme.background.secondary
      };
    }

    if (variant === 'filled') {
      return {
        backgroundColor: `${typeColor}22`
      };
    }

    return {};
  };

  const accordionStyles: React.CSSProperties = {
    ...getAccordionStyles(),
    ...(elevation && {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }),
    ...(disabled && {
      opacity: 0.6
    }),
    ...style
  };

  const summaryStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...getSummaryBaseStyles(),
    transition: 'background-color 0.2s ease',
    userSelect: 'none'
  };

  const expandIconStyles: React.CSSProperties = {
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
    color: typeColor,
    fontSize: '12px'
  };

  const contentWrapperStyles: React.CSSProperties = {
    height: expanded ? contentHeight : 0,
    overflow: 'hidden',
    transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: variant === 'plain' ? 'transparent' : variant === 'filled' ? `${typeColor}11` : theme.background.primary
  };

  const contentStyles: React.CSSProperties = {
    padding: '16px'
  };

  const titleContainerStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const iconColorStyle = variant === 'filled' ? { color: typeColor } : {};

  return (
    <div style={accordionStyles} className={className}>
      <div
        style={summaryStyles}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={expanded}
        aria-disabled={disabled}
        onMouseEnter={(e) => {
          if (!disabled) {
            Object.assign(e.currentTarget.style, getSummaryHoverStyles());
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            Object.assign(e.currentTarget.style, getSummaryBaseStyles());
          }
        }}
      >
        <div style={expandIconStyles}>
          ▶
        </div>
        <div style={titleContainerStyles}>
          {icon && (
            <div style={{ display: 'flex', alignItems: 'center', ...iconColorStyle }}>
              {icon}
            </div>
          )}
          <Typography variant="body1" weight="medium">
            {title}
          </Typography>
        </div>
        {summary && (
          <div style={{ marginLeft: 'auto' }}>
            {summary}
          </div>
        )}
      </div>
      <div style={contentWrapperStyles}>
        <div ref={contentRef} style={contentStyles}>
          {children}
        </div>
      </div>
    </div>
  );
};
