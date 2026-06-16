import React from 'react';
import { safeUrl, safeCssUrl } from '../../_internal';

export interface CardMediaProps {
  image?: string;
  title?: string;
  height?: number;
  component?: 'img' | 'video' | 'div';
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const CardMedia: React.FC<CardMediaProps> = ({
  image,
  title,
  height = 200,
  component = 'img',
  children,
  style,
  className
}) => {
  const mediaStyles: React.CSSProperties = {
    width: '100%',
    height: `${height}px`,
    objectFit: 'cover',
    display: 'block',
    marginBottom: '16px',
    ...style
  };

  if (component === 'img' && image) {
    return (
      <img
        src={safeUrl(image)}
        alt={title || 'Card media'}
        style={mediaStyles}
        className={className}
      />
    );
  }

  if (component === 'video' && image) {
    return (
      <video
        src={safeUrl(image)}
        title={title}
        style={mediaStyles}
        className={className}
        controls
      />
    );
  }

  if (component === 'div') {
    return (
      <div
        style={{
          ...mediaStyles,
          ...(image && {
            backgroundImage: `url(${safeCssUrl(image)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          })
        }}
        className={className}
      >
        {children}
      </div>
    );
  }

  return null;
};
