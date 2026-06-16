import React from 'react';
import { useTheme } from '../../theme';

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'subtitle1'
  | 'subtitle2'
  | 'body1'
  | 'body2'
  | 'button'
  | 'caption'
  | 'overline';

export type TypographyColor =
  | 'primary'
  | 'secondary'
  | 'disabled'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'inherit';

export type TypographyAlign = 'left' | 'center' | 'right' | 'justify' | 'inherit';

export type TypographyWeight = 'normal' | 'medium' | 'bold' | 'inherit';

export type TypographyComponent =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'div'
  | 'label'
  | 'caption'
  | 'strong'
  | 'em';

export interface TypographyProps {
  variant?: TypographyVariant;
  component?: TypographyComponent;
  color?: TypographyColor;
  align?: TypographyAlign;
  weight?: TypographyWeight;
  gutterBottom?: boolean;
  noWrap?: boolean;
  paragraph?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  title?: string;
}

// Default component mapping for each variant
const variantMapping: Record<TypographyVariant, TypographyComponent> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  button: 'span',
  caption: 'span',
  overline: 'span'
};

// Typography styles for each variant
const getVariantStyles = (variant: TypographyVariant): React.CSSProperties => {
  switch (variant) {
    case 'h1':
      return {
        fontSize: '96px',
        fontWeight: 300,
        lineHeight: 1.167,
        letterSpacing: '-1.5px'
      };
    case 'h2':
      return {
        fontSize: '60px',
        fontWeight: 300,
        lineHeight: 1.2,
        letterSpacing: '-0.5px'
      };
    case 'h3':
      return {
        fontSize: '48px',
        fontWeight: 400,
        lineHeight: 1.167,
        letterSpacing: '0px'
      };
    case 'h4':
      return {
        fontSize: '34px',
        fontWeight: 400,
        lineHeight: 1.235,
        letterSpacing: '0.25px'
      };
    case 'h5':
      return {
        fontSize: '24px',
        fontWeight: 400,
        lineHeight: 1.334,
        letterSpacing: '0px'
      };
    case 'h6':
      return {
        fontSize: '20px',
        fontWeight: 500,
        lineHeight: 1.6,
        letterSpacing: '0.15px'
      };
    case 'subtitle1':
      return {
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: 1.75,
        letterSpacing: '0.15px'
      };
    case 'subtitle2':
      return {
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: 1.57,
        letterSpacing: '0.1px'
      };
    case 'body1':
      return {
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: '0.15px'
      };
    case 'body2':
      return {
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: 1.43,
        letterSpacing: '0.15px'
      };
    case 'button':
      return {
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: 1.75,
        letterSpacing: '0.4px',
        textTransform: 'uppercase'
      };
    case 'caption':
      return {
        fontSize: '12px',
        fontWeight: 400,
        lineHeight: 1.66,
        letterSpacing: '0.4px'
      };
    case 'overline':
      return {
        fontSize: '12px',
        fontWeight: 400,
        lineHeight: 2.66,
        letterSpacing: '1px',
        textTransform: 'uppercase'
      };
    default:
      return {};
  }
};

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  component,
  color = 'primary',
  align = 'inherit',
  weight = 'inherit',
  gutterBottom = false,
  noWrap = false,
  paragraph = false,
  children,
  style,
  className,
  onClick,
  title
}) => {
  const { theme } = useTheme();

  // Determine which HTML tag to use
  const Component = component || (paragraph ? 'p' : variantMapping[variant]);

  // Get color from theme
  const getColor = (): string => {
    if (color === 'inherit') return 'inherit';
    if (color === 'primary') return theme.text.primary;
    if (color === 'secondary') return theme.text.secondary;
    if (color === 'disabled') return theme.text.disabled;
    if (color === 'error') return theme.semantic.error;
    if (color === 'success') return theme.semantic.success;
    if (color === 'warning') return theme.semantic.warning;
    if (color === 'info') return theme.semantic.info;
    return theme.text.primary;
  };

  // Get font weight
  const getFontWeight = (): number | string => {
    if (weight === 'inherit') return 'inherit';
    if (weight === 'normal') return 400;
    if (weight === 'medium') return 500;
    if (weight === 'bold') return 700;
    return 'inherit';
  };

  const typographyStyles: React.CSSProperties = {
    margin: 0,
    ...getVariantStyles(variant),
    color: getColor(),
    textAlign: align,
    ...(weight !== 'inherit' && { fontWeight: getFontWeight() }),
    ...(gutterBottom && { marginBottom: '0.35em' }),
    ...(noWrap && {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }),
    ...(onClick && { cursor: 'pointer' }),
    ...style
  };

  return React.createElement(
    Component,
    {
      style: typographyStyles,
      className,
      onClick,
      title
    },
    children
  );
};
