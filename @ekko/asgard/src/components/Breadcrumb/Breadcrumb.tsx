import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { safeUrl } from '../../_internal';

export type BreadcrumbSize = 'small' | 'normal' | 'large';
export type BreadcrumbSemantic = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type BreadcrumbVariant = 'default' | 'underline' | 'bold';
export type SeparatorType = 'slash' | 'chevron' | 'dot' | 'dash' | 'arrow';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];

  // Appearance
  size?: BreadcrumbSize;
  semantic?: BreadcrumbSemantic;
  variant?: BreadcrumbVariant;
  separator?: SeparatorType | string;

  // Behavior
  maxItems?: number; // Show collapsed breadcrumbs if items exceed this number
  showHome?: boolean; // Show home icon for first item

  // Style
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  size = 'normal',
  semantic = 'primary',
  variant = 'default',
  separator = 'slash',
  maxItems,
  showHome = false,
  className
}) => {
  const { theme } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Size configurations
  const sizeConfig = {
    small: {
      fontSize: 12,
      iconSize: 14,
      gap: 6,
      padding: '2px 4px'
    },
    normal: {
      fontSize: 14,
      iconSize: 16,
      gap: 8,
      padding: '4px 6px'
    },
    large: {
      fontSize: 16,
      iconSize: 20,
      gap: 10,
      padding: '6px 8px'
    }
  };

  const config = sizeConfig[size];

  // Get semantic color
  const getSemanticColor = () => {
    switch (semantic) {
      case 'primary': return theme.accent.primary;
      case 'secondary': return theme.accent.secondary;
      case 'error': return theme.semantic.error;
      case 'warning': return theme.semantic.warning;
      case 'success': return theme.semantic.success;
      case 'info': return theme.semantic.info;
      default: return theme.accent.primary;
    }
  };

  const semanticColor = getSemanticColor();

  // Get separator character
  const getSeparator = () => {
    switch (separator) {
      case 'slash': return '/';
      case 'chevron': return '›';
      case 'dot': return '•';
      case 'dash': return '-';
      case 'arrow': return '→';
      default: return separator;
    }
  };

  const separatorChar = getSeparator();

  // Home icon (simple house)
  const homeIcon = (
    <svg
      width={config.iconSize}
      height={config.iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );

  // Handle collapsed breadcrumbs
  const getDisplayItems = () => {
    if (!maxItems || items.length <= maxItems) {
      return items;
    }

    // Show first, ..., and last items
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 2));

    return [
      firstItem,
      { label: '...', onClick: undefined, href: undefined },
      ...lastItems
    ];
  };

  const displayItems = getDisplayItems();

  // Item styles
  const getItemStyles = (index: number, isLast: boolean): React.CSSProperties => {
    const isHovered = hoveredIndex === index;
    const isClickable = !isLast && (displayItems[index].onClick || displayItems[index].href);

    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: config.gap / 2,
      padding: config.padding,
      fontSize: config.fontSize,
      fontWeight: variant === 'bold' ? 600 : isLast ? 500 : 400,
      color: isLast
        ? semanticColor // Last item uses semantic color
        : isHovered && isClickable
        ? semanticColor // Hovered clickable items use semantic color
        : semanticColor + 'AA', // Non-hovered items use semantic color with transparency
      textDecoration: variant === 'underline' && isHovered && isClickable ? 'underline' : 'none',
      cursor: isClickable ? 'pointer' : 'default',
      transition: 'color 0.2s ease, text-decoration 0.2s ease, background-color 0.2s ease',
      borderRadius: '4px',
      backgroundColor: isHovered && isClickable ? `${semanticColor}11` : 'transparent',
      whiteSpace: 'nowrap'
    };
  };

  // Separator styles
  const separatorStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    color: theme.text.disabled,
    fontSize: config.fontSize,
    padding: `0 ${config.gap}px`,
    userSelect: 'none'
  };

  // Handle click
  const handleClick = (item: BreadcrumbItem, index: number) => {
    if (index === displayItems.length - 1) return; // Don't allow clicking last item

    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      window.location.href = safeUrl(item.href);
    }
  };

  return (
    <nav
      className={className}
      aria-label="breadcrumb"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        fontFamily: 'inherit'
      }}
    >
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={index}>
            <span
              style={getItemStyles(index, isLast)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleClick(item, index)}
              role={!isLast && (item.onClick || item.href) ? 'link' : undefined}
              aria-current={isLast ? 'page' : undefined}
            >
              {/* Show home icon for first item if enabled */}
              {isFirst && showHome && (
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {homeIcon}
                </span>
              )}

              {/* Show custom icon if provided */}
              {!isFirst && item.icon && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: config.iconSize
                  }}
                >
                  {item.icon}
                </span>
              )}

              {/* Show label */}
              <span>{item.label}</span>
            </span>

            {/* Separator (not after last item) */}
            {!isLast && (
              <span style={separatorStyles} aria-hidden="true">
                {separatorChar}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
