import React, { useState, cloneElement, isValidElement } from 'react';

export interface AccordionGroupProps {
  children: React.ReactNode;
  allowMultiple?: boolean;
  defaultExpanded?: string | string[];
  onChange?: (expanded: string | string[]) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const AccordionGroup: React.FC<AccordionGroupProps> = ({
  children,
  allowMultiple = false,
  defaultExpanded,
  onChange,
  style,
  className
}) => {
  const [expandedPanels, setExpandedPanels] = useState<string[]>(() => {
    if (!defaultExpanded) return [];
    return Array.isArray(defaultExpanded) ? defaultExpanded : [defaultExpanded];
  });

  const handleAccordionChange = (id: string, isExpanded: boolean) => {
    let newExpanded: string[];

    if (allowMultiple) {
      newExpanded = isExpanded
        ? [...expandedPanels, id]
        : expandedPanels.filter(panelId => panelId !== id);
    } else {
      newExpanded = isExpanded ? [id] : [];
    }

    setExpandedPanels(newExpanded);
    onChange?.(allowMultiple ? newExpanded : newExpanded[0] || '');
  };

  const childArray = React.Children.toArray(children).filter(isValidElement);

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    ...style
  };

  return (
    <div style={containerStyles} className={className}>
      {childArray.map((child, index) => {
        if (!isValidElement(child)) return child;

        const accordionId = `accordion-${index}`;
        const isExpanded = expandedPanels.includes(accordionId);
        const childProps = child.props as any;

        return cloneElement(child, {
          key: accordionId,
          expanded: isExpanded,
          onChange: (expanded: boolean) => {
            handleAccordionChange(accordionId, expanded);
            // Also call the original onChange if it exists
            if (childProps.onChange) {
              childProps.onChange(expanded);
            }
          }
        } as any);
      })}
    </div>
  );
};
