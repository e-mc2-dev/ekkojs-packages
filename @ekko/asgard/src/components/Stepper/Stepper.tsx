import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { Typography } from '../Typography/Typography';

export type StepperSize = 'small' | 'normal' | 'large';
export type StepperSemantic = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type StepperVariant = 'default' | 'numbered' | 'icon' | 'dotted';
export type StepperOrientation = 'horizontal' | 'vertical';
export type ConnectorStyle = 'line' | 'dashed' | 'none';

export interface Step {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  optional?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export interface StepperProps {
  steps: Step[];
  activeStep: number;

  // Appearance
  size?: StepperSize;
  semantic?: StepperSemantic;
  variant?: StepperVariant;
  orientation?: StepperOrientation;
  connectorStyle?: ConnectorStyle;

  // Behavior
  onStepClick?: (step: number) => void;
  allowStepClick?: boolean;
  alternativeLabel?: boolean; // For horizontal: show labels below steps

  // Style
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStep,
  size = 'normal',
  semantic = 'primary',
  variant = 'default',
  orientation = 'horizontal',
  connectorStyle = 'line',
  onStepClick,
  allowStepClick = false,
  alternativeLabel = false,
  className
}) => {
  const { theme } = useTheme();
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // Size configurations
  const sizeConfig = {
    small: {
      circleSize: 24,
      fontSize: 12,
      labelFontSize: 12,
      descriptionFontSize: 10,
      iconSize: 14,
      connectorThickness: 1,
      gap: 16
    },
    normal: {
      circleSize: 32,
      fontSize: 14,
      labelFontSize: 14,
      descriptionFontSize: 12,
      iconSize: 18,
      connectorThickness: 2,
      gap: 24
    },
    large: {
      circleSize: 40,
      fontSize: 16,
      labelFontSize: 16,
      descriptionFontSize: 14,
      iconSize: 22,
      connectorThickness: 2,
      gap: 32
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

  // Step states
  const isStepCompleted = (index: number) => index < activeStep;
  const isStepActive = (index: number) => index === activeStep;
  const isStepError = (index: number) => steps[index].error;
  const isStepClickable = (index: number) =>
    allowStepClick && onStepClick && !steps[index].disabled;

  // Circle/indicator styles
  const getCircleStyles = (index: number): React.CSSProperties => {
    const completed = isStepCompleted(index);
    const active = isStepActive(index);
    const error = isStepError(index);
    const hovered = hoveredStep === index;
    const clickable = isStepClickable(index);

    let backgroundColor: string;
    let borderColor: string;
    let color: string;

    if (error) {
      backgroundColor = active ? theme.semantic.error : 'transparent';
      borderColor = theme.semantic.error;
      color = active ? '#fff' : theme.semantic.error;
    } else if (completed) {
      backgroundColor = semanticColor;
      borderColor = semanticColor;
      color = '#fff';
    } else if (active) {
      backgroundColor = semanticColor;
      borderColor = semanticColor;
      color = '#fff';
    } else {
      backgroundColor = 'transparent';
      borderColor = theme.border.default;
      color = theme.text.disabled;
    }

    return {
      width: config.circleSize,
      height: config.circleSize,
      borderRadius: variant === 'dotted' ? '50%' : '50%',
      border: variant === 'dotted' ? 'none' : `2px solid ${borderColor}`,
      backgroundColor: variant === 'dotted' && !active && !completed
        ? theme.border.default
        : backgroundColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: config.fontSize,
      fontWeight: 500,
      color: color,
      cursor: clickable ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      transform: hovered && clickable ? 'scale(1.1)' : 'scale(1)',
      boxShadow: active ? `0 0 0 4px ${semanticColor}22` : 'none',
      flexShrink: 0
    };
  };

  // Connector line styles
  const getConnectorStyles = (index: number): React.CSSProperties => {
    const completed = isStepCompleted(index + 1);
    // const active = isStepActive(index + 1); // Not used currently

    let color: string;
    if (steps[index + 1]?.error) {
      color = theme.semantic.error;
    } else if (completed) {
      color = semanticColor;
    } else {
      color = theme.border.default;
    }

    const baseStyles: React.CSSProperties = {
      backgroundColor: connectorStyle === 'line' ? color : 'transparent',
      borderTop: connectorStyle === 'dashed' ? `${config.connectorThickness}px dashed ${color}` : 'none',
      borderLeft: connectorStyle === 'dashed' && orientation === 'vertical'
        ? `${config.connectorThickness}px dashed ${color}`
        : 'none',
      transition: 'all 0.3s ease'
    };

    if (orientation === 'horizontal') {
      return {
        ...baseStyles,
        flex: 1,
        height: connectorStyle !== 'none' ? config.connectorThickness : 0,
        marginLeft: config.gap,
        marginRight: config.gap,
        alignSelf: alternativeLabel ? 'flex-start' : 'center',
        marginTop: alternativeLabel ? (config.circleSize / 2) : 0
      };
    } else {
      return {
        ...baseStyles,
        width: connectorStyle !== 'none' ? config.connectorThickness : 0,
        height: 40,
        marginLeft: config.circleSize / 2 - config.connectorThickness / 2,
        marginTop: 8,
        marginBottom: 8
      };
    }
  };

  // Check icon for completed steps
  const checkIcon = (
    <svg
      width={config.iconSize}
      height={config.iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  // Error icon
  const errorIcon = (
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );

  // Render step indicator content
  const renderStepContent = (step: Step, index: number) => {
    const completed = isStepCompleted(index);
    const error = isStepError(index);

    if (variant === 'dotted') {
      return null;
    }

    if (error) {
      return errorIcon;
    }

    if (variant === 'numbered' || variant === 'default') {
      if (completed) {
        return checkIcon;
      }
      return index + 1;
    }

    if (variant === 'icon') {
      if (completed) {
        return checkIcon;
      }
      return step.icon || (index + 1);
    }

    return index + 1;
  };

  // Handle step click
  const handleStepClick = (index: number) => {
    if (isStepClickable(index)) {
      onStepClick?.(index);
    }
  };

  // Render horizontal stepper
  const renderHorizontal = () => {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: alternativeLabel ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step */}
            <div
              style={{
                display: 'flex',
                flexDirection: alternativeLabel ? 'column' : 'row',
                alignItems: 'center',
                flex: alternativeLabel ? 1 : '0 0 auto',
                minWidth: alternativeLabel ? 80 : undefined
              }}
            >
              {/* Circle/Indicator */}
              <div
                style={getCircleStyles(index)}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
                onClick={() => handleStepClick(index)}
              >
                {renderStepContent(step, index)}
              </div>

              {/* Label */}
              {!alternativeLabel && (
                <div
                  style={{
                    whiteSpace: 'nowrap',
                    paddingRight: config.gap,
                    marginLeft: 12
                  }}
                >
                  <Typography
                    variant="body2"
                    style={{
                      fontSize: config.labelFontSize,
                      fontWeight: isStepActive(index) ? 600 : 400,
                      color: isStepError(index)
                        ? theme.semantic.error
                        : isStepActive(index) || isStepCompleted(index)
                        ? theme.text.primary
                        : theme.text.secondary,
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {step.label}
                  </Typography>
                  {step.optional && (
                    <Typography
                      variant="caption"
                      style={{
                        fontSize: config.descriptionFontSize,
                        fontStyle: 'italic',
                        color: theme.text.secondary,
                        marginTop: 4
                      }}
                    >
                      Optional
                    </Typography>
                  )}
                  {step.description && (
                    <Typography
                      variant="caption"
                      style={{
                        fontSize: config.descriptionFontSize,
                        color: theme.text.secondary,
                        marginTop: 4
                      }}
                    >
                      {step.description}
                    </Typography>
                  )}
                </div>
              )}

              {/* Label for alternative layout (below circle) */}
              {alternativeLabel && (
                <div
                  style={{
                    width: '100%',
                    overflow: 'hidden',
                    marginTop: 8,
                    textAlign: 'center'
                  }}
                >
                  <Typography
                    variant="body2"
                    style={{
                      fontSize: config.labelFontSize,
                      fontWeight: isStepActive(index) ? 600 : 400,
                      color: isStepError(index)
                        ? theme.semantic.error
                        : isStepActive(index) || isStepCompleted(index)
                        ? theme.text.primary
                        : theme.text.secondary,
                      transition: 'color 0.2s ease',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {step.label}
                  </Typography>
                  {step.optional && (
                    <Typography
                      variant="caption"
                      style={{
                        fontSize: config.descriptionFontSize,
                        fontStyle: 'italic',
                        color: theme.text.secondary,
                        marginTop: 4
                      }}
                    >
                      Optional
                    </Typography>
                  )}
                  {step.description && (
                    <Typography
                      variant="caption"
                      style={{
                        fontSize: config.descriptionFontSize - 1,
                        color: theme.text.secondary,
                        marginTop: 4,
                        whiteSpace: 'normal'
                      }}
                    >
                      {step.description}
                    </Typography>
                  )}
                </div>
              )}
            </div>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div style={getConnectorStyles(index)} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Render vertical stepper
  const renderVertical = () => {
    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column' }}>
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step */}
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {/* Circle/Indicator */}
              <div
                style={getCircleStyles(index)}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
                onClick={() => handleStepClick(index)}
              >
                {renderStepContent(step, index)}
              </div>

              {/* Label */}
              <div style={{ flex: 1, marginLeft: 12 }}>
                <Typography
                  variant="body2"
                  style={{
                    fontSize: config.labelFontSize,
                    fontWeight: isStepActive(index) ? 600 : 400,
                    color: isStepError(index)
                      ? theme.semantic.error
                      : isStepActive(index) || isStepCompleted(index)
                      ? theme.text.primary
                      : theme.text.secondary,
                    transition: 'color 0.2s ease'
                  }}
                >
                  {step.label}
                </Typography>
                {step.optional && (
                  <Typography
                    variant="caption"
                    style={{
                      fontSize: config.descriptionFontSize,
                      fontStyle: 'italic',
                      color: theme.text.secondary,
                      marginTop: 4
                    }}
                  >
                    Optional
                  </Typography>
                )}
                {step.description && (
                  <Typography
                    variant="caption"
                    style={{
                      fontSize: config.descriptionFontSize,
                      color: theme.text.secondary,
                      marginTop: 4
                    }}
                  >
                    {step.description}
                  </Typography>
                )}
              </div>
            </div>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div style={getConnectorStyles(index)} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return orientation === 'horizontal' ? renderHorizontal() : renderVertical();
};
