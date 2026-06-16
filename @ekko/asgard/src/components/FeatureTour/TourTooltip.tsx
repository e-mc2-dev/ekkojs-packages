import React from 'react';
import { useTheme } from '../../theme';
import { SDiv } from '../SDiv/SDiv';
import { Typography } from '../Typography/Typography';
import { Button } from '../Button/Button';
import { LinearProgress } from '../ProgressBar/LinearProgress';

interface TourTooltipProps {
  title: string;
  content: string | React.ReactNode;
  currentStep: number;
  totalSteps: number;
  showProgress: boolean;
  showSkip: boolean;
  showStepNumbers: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  width?: number;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
  autoAdvanceProgress?: number; // 0-1 value
}

export const TourTooltip: React.FC<TourTooltipProps> = ({
  title,
  content,
  currentStep,
  totalSteps,
  showProgress,
  showSkip,
  showStepNumbers,
  onNext,
  onPrevious,
  onSkip,
  width = 320,
  autoAdvance = false,
  autoAdvanceDelay = 5000,
  autoAdvanceProgress = 0
}) => {
  const { theme } = useTheme();

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Calculate progress percentage for LinearProgress (0-100)
  const progressPercentage = autoAdvanceProgress * 100;
  const remainingSeconds = Math.ceil((1 - autoAdvanceProgress) * (autoAdvanceDelay / 1000));

  return (
    <SDiv
      style={{
        width: `${width}px`,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Header with step number */}
      <SDiv style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {showStepNumbers && (
          <Typography
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: theme.accent.primary,
              textTransform: 'uppercase'
            }}
          >
            Step {currentStep + 1} of {totalSteps}
          </Typography>
        )}
        {showSkip && (
          <Button
            variant="ghost"
            size="small"
            onClick={onSkip}
            style={{ marginLeft: 'auto' }}
          >
            Skip Tour
          </Button>
        )}
      </SDiv>

      {/* Title */}
      <Typography
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: theme.text.primary,
          lineHeight: 1.4
        }}
      >
        {title}
      </Typography>

      {/* Content */}
      <SDiv style={{ color: theme.text.secondary, lineHeight: 1.6 }}>
        {typeof content === 'string' ? (
          <Typography style={{ fontSize: '14px' }}>{content}</Typography>
        ) : (
          content
        )}
      </SDiv>

      {/* Progress dots */}
      {showProgress && (
        <SDiv style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <SDiv
              key={i}
              style={{
                width: i === currentStep ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: i === currentStep ? theme.accent.primary : theme.border.default,
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </SDiv>
      )}

      {/* Auto-advance progress bar and countdown */}
      {autoAdvance && (
        <SDiv style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <SDiv style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography
              style={{
                fontSize: '12px',
                color: theme.text.secondary
              }}
            >
              Auto-advancing in {remainingSeconds}s
            </Typography>
          </SDiv>
          <LinearProgress
            key={`progress-${autoAdvanceProgress}`}
            value={progressPercentage}
            type="primary"
            size="small"
            showLabel={false}
          />
        </SDiv>
      )}

      {/* Navigation buttons */}
      <SDiv style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
        {!isFirstStep && (
          <Button
            variant="outlined"
            size="normal"
            onClick={onPrevious}
          >
            Previous
          </Button>
        )}
        <Button
          variant="filled"
          size="normal"
          onClick={onNext}
        >
          {isLastStep ? 'Finish' : 'Next'}
        </Button>
      </SDiv>
    </SDiv>
  );
};
