import React from 'react';

export interface CardContentProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  style,
  className
}) => {
  const contentStyles: React.CSSProperties = {
    ...style
  };

  return (
    <div style={contentStyles} className={className}>
      {children}
    </div>
  );
};
