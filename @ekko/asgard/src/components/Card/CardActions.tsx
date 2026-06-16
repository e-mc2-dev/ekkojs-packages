import React from 'react';

export interface CardActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center' | 'space-between';
  style?: React.CSSProperties;
  className?: string;
}

export const CardActions: React.FC<CardActionsProps> = ({
  children,
  align = 'left',
  style,
  className
}) => {
  const getJustifyContent = () => {
    switch (align) {
      case 'left':
        return 'flex-start';
      case 'right':
        return 'flex-end';
      case 'center':
        return 'center';
      case 'space-between':
        return 'space-between';
      default:
        return 'flex-start';
    }
  };

  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    justifyContent: getJustifyContent(),
    ...style
  };

  return (
    <div style={actionsStyles} className={className}>
      {children}
    </div>
  );
};
