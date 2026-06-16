export type TourPosition = 'top' | 'bottom' | 'left' | 'right' |
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' |
  'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';

export type HighlightType = 'spotlight' | 'outline' | 'pulse' | 'none';

export type HighlightStyle = 'solid' | 'dashed' | 'dotted';

export type OverlayType = 'dark' | 'blur' | 'gradient' | 'none';

export interface TourStep {
  // Target element
  target: string | HTMLElement | (() => HTMLElement | null);

  // Content
  title: string;
  content: string | React.ReactNode;

  // Positioning
  position?: TourPosition;

  // Highlighting
  highlight?: HighlightType;
  highlightStyle?: HighlightStyle;
  highlightPadding?: number; // Padding around element bbox

  // Actions and timing
  action?: () => void | Promise<void>; // Execute before showing step
  onNext?: () => void | Promise<void>; // Execute when going to next
  onPrevious?: () => void | Promise<void>; // Execute when going back
  wait?: number | (() => Promise<void>); // Wait time or condition

  // Behavior
  scrollIntoView?: boolean;
  allowInteraction?: boolean; // Allow clicking on highlighted element
  disableOverlay?: boolean; // Skip overlay for this step
  autoAdvance?: boolean; // Auto-advance this step
  autoAdvanceDelay?: number; // Milliseconds before auto-advance
}

export interface TourConfig {
  steps: TourStep[];

  // Overlay settings
  overlay?: OverlayType;
  overlayOpacity?: number;

  // UI options
  showProgress?: boolean;
  showSkip?: boolean;
  showStepNumbers?: boolean;

  // Navigation
  keyboard?: boolean;
  autoAdvance?: boolean; // Auto-advance after time
  autoAdvanceDelay?: number; // Milliseconds

  // Callbacks
  onComplete?: () => void;
  onSkip?: () => void;
  onStepChange?: (stepIndex: number) => void;

  // Styling
  tooltipWidth?: number;
  tooltipMaxWidth?: number;
}

export interface FeatureTourProps {
  config: TourConfig;
  isOpen: boolean;
  onClose: () => void;
  startStep?: number;
}

export interface TourContextValue {
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  goToStep: (index: number) => void;
}
