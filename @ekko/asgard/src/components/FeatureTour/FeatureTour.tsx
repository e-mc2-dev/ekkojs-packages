import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { isBrowser } from '../../_internal';
import { FloatingPanel } from '../FloatingPanel/FloatingPanel';
import { TourOverlay } from './TourOverlay';
import { TourTooltip } from './TourTooltip';
import type { FeatureTourProps, TourStep } from './types';

export const FeatureTour: React.FC<FeatureTourProps> = ({
  config,
  isOpen,
  onClose,
  startStep = 0
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(startStep);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  const virtualAnchorRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const autoAdvanceStartTimeRef = useRef<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = config.steps[currentStepIndex];
  const totalSteps = config.steps.length;

  // Get target element
  const getTargetElement = useCallback((step: TourStep): HTMLElement | null => {
    if (!step.target) return null;

    if (typeof step.target === 'string') {
      return document.querySelector(step.target);
    } else if (typeof step.target === 'function') {
      return step.target();
    } else {
      return step.target;
    }
  }, []);

  // Execute step action and wait
  const executeStepSetup = useCallback(async (step: TourStep) => {
    setIsProcessing(true);

    try {
      // Execute action before showing step
      if (step.action) {
        await Promise.resolve(step.action());
      }

      // Wait if specified
      if (step.wait) {
        if (typeof step.wait === 'number') {
          await new Promise(resolve => setTimeout(resolve, step.wait as number));
        } else {
          await step.wait();
        }
      }

      // Scroll element into view
      const targetEl = getTargetElement(step);
      if (targetEl && step.scrollIntoView !== false) {
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });

        // Wait for scroll to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      setIsProcessing(false);
    }
  }, [getTargetElement]);

  // Update target rect when step changes
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const updateTarget = async () => {
      await executeStepSetup(currentStep);

      const targetEl = getTargetElement(currentStep);
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        setTargetRect(rect);

        // Update virtual anchor position for FloatingPanel
        if (virtualAnchorRef.current) {
          virtualAnchorRef.current.style.position = 'fixed';
          virtualAnchorRef.current.style.top = `${rect.top}px`;
          virtualAnchorRef.current.style.left = `${rect.left}px`;
          virtualAnchorRef.current.style.width = `${rect.width}px`;
          virtualAnchorRef.current.style.height = `${rect.height}px`;
        }
      } else {
        setTargetRect(null);
      }
    };

    updateTarget();

    // Update on window resize/scroll
    const handleUpdate = () => {
      const targetEl = getTargetElement(currentStep);
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        setTargetRect(rect);

        if (virtualAnchorRef.current) {
          virtualAnchorRef.current.style.top = `${rect.top}px`;
          virtualAnchorRef.current.style.left = `${rect.left}px`;
          virtualAnchorRef.current.style.width = `${rect.width}px`;
          virtualAnchorRef.current.style.height = `${rect.height}px`;
        }
      }
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen, currentStep, currentStepIndex, getTargetElement, executeStepSetup]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    if (isProcessing) return;

    // Execute onNext callback
    if (currentStep.onNext) {
      setIsProcessing(true);
      await Promise.resolve(currentStep.onNext());
      setIsProcessing(false);
    }

    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      config.onStepChange?.(nextIndex);
    } else {
      // Tour complete
      config.onComplete?.();
      onClose();
    }
  }, [isProcessing, currentStep, currentStepIndex, totalSteps, config, onClose]);

  const handlePrevious = useCallback(async () => {
    if (isProcessing || currentStepIndex === 0) return;

    // Execute onPrevious callback
    if (currentStep.onPrevious) {
      setIsProcessing(true);
      await Promise.resolve(currentStep.onPrevious());
      setIsProcessing(false);
    }

    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);
    config.onStepChange?.(prevIndex);
  }, [isProcessing, currentStepIndex, currentStep, config]);

  const handleSkip = useCallback(() => {
    if (isProcessing) return;
    config.onSkip?.();
    onClose();
  }, [isProcessing, config, onClose]);

  // Auto-advance timer
  useEffect(() => {
    if (!isOpen || !currentStep || isProcessing) return;

    const shouldAutoAdvance = currentStep.autoAdvance ||
      (config.autoAdvance && currentStep.autoAdvance !== false);

    if (!shouldAutoAdvance) {
      setAutoAdvanceProgress(0);
      return;
    }

    const delay = currentStep.autoAdvanceDelay ?? config.autoAdvanceDelay ?? 5000;
    const startTime = Date.now();
    autoAdvanceStartTimeRef.current = startTime;

    // Update progress animation
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / delay, 1);
      setAutoAdvanceProgress(progress);

      if (progress < 1) {
        autoAdvanceTimerRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Auto-advance to next step
        handleNext();
      }
    };

    autoAdvanceTimerRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (autoAdvanceTimerRef.current !== null) {
        cancelAnimationFrame(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      setAutoAdvanceProgress(0);
      autoAdvanceStartTimeRef.current = null;
    };
  }, [isOpen, currentStep, currentStepIndex, isProcessing, config.autoAdvance, config.autoAdvanceDelay, handleNext]);

  // Block all events at window level except for tooltip navigation
  useEffect(() => {
    if (!isOpen || currentStep?.allowInteraction) return;

    const blockEvent = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // ALWAYS block the original event first
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Only process click events for tooltip buttons
      if (e.type === 'click' && tooltipRef.current && tooltipRef.current.contains(target)) {
        // Find which button was clicked by checking the element or its ancestors
        let element: HTMLElement | null = target;
        while (element && element !== tooltipRef.current) {
          const text = element.textContent?.trim();
          const isButton = element.tagName === 'BUTTON' || element.getAttribute('role') === 'button';

          // Only check text content if this is actually a button element
          if (isButton) {
            // Check for Next/Finish button
            if (text === 'Next' || text === 'Finish') {
              handleNext();
              return;
            }

            // Check for Previous button
            if (text === 'Previous') {
              handlePrevious();
              return;
            }

            // Check for Skip button (exact match only)
            if (text === 'Skip Tour') {
              handleSkip();
              return;
            }
          }

          element = element.parentElement;
        }
        // If we get here, user clicked somewhere in the tooltip but NOT on a button
        // Do nothing - just keep the event blocked
      }
    };

    // Add listeners at window level in CAPTURE phase to block before anything else
    window.addEventListener('mousedown', blockEvent, true);
    window.addEventListener('click', blockEvent, true);
    window.addEventListener('mouseup', blockEvent, true);
    window.addEventListener('contextmenu', blockEvent, true);
    window.addEventListener('mousemove', blockEvent, true);
    window.addEventListener('mouseenter', blockEvent, true);
    window.addEventListener('mouseleave', blockEvent, true);
    window.addEventListener('mouseover', blockEvent, true);
    window.addEventListener('mouseout', blockEvent, true);

    return () => {
      window.removeEventListener('mousedown', blockEvent, true);
      window.removeEventListener('click', blockEvent, true);
      window.removeEventListener('mouseup', blockEvent, true);
      window.removeEventListener('contextmenu', blockEvent, true);
      window.removeEventListener('mousemove', blockEvent, true);
      window.removeEventListener('mouseenter', blockEvent, true);
      window.removeEventListener('mouseleave', blockEvent, true);
      window.removeEventListener('mouseover', blockEvent, true);
      window.removeEventListener('mouseout', blockEvent, true);
    };
  }, [isOpen, currentStep?.allowInteraction, handleNext, handlePrevious, handleSkip]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || !config.keyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          handlePrevious();
          break;
        case 'Escape':
          e.preventDefault();
          handleSkip();
          break;
        case 'Enter':
          e.preventDefault();
          handleNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, config.keyboard, isProcessing, handleNext, handlePrevious, handleSkip]);

  if (!isOpen || !currentStep) return null;

  const overlayType = currentStep.disableOverlay ? 'none' : (config.overlay || 'dark');
  const highlightType = currentStep.highlight || 'spotlight';
  const highlightStyle = currentStep.highlightStyle || 'solid';
  const highlightPadding = currentStep.highlightPadding ?? 8;

  if (!isBrowser) return null;
  return createPortal(
    <>
      {/* Overlay with highlight */}
      <TourOverlay
        targetRect={targetRect}
        overlayType={overlayType}
        overlayOpacity={config.overlayOpacity ?? 0.7}
        highlightType={highlightType}
        highlightStyle={highlightStyle}
        highlightPadding={highlightPadding}
        pulseAnimation={highlightType === 'pulse'}
      />

      {/* Virtual anchor for FloatingPanel positioning */}
      <div
        ref={virtualAnchorRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 10002
        }}
      />

      {/* Tooltip */}
      {targetRect && (
        <FloatingPanel
          anchorRef={virtualAnchorRef}
          isOpen={true}
          position={currentStep.position || 'bottom'}
          offset={16}
          width={config.tooltipWidth || 'auto'}
          maxWidth={config.tooltipMaxWidth || 400}
          closeOnClickOutside={false}
          closeOnEscape={false}
          elevation={4}
          zIndex={10002}
        >
          <div ref={tooltipRef}>
            <TourTooltip
              title={currentStep.title}
              content={currentStep.content}
              currentStep={currentStepIndex}
              totalSteps={totalSteps}
              showProgress={config.showProgress !== false}
              showSkip={config.showSkip !== false}
              showStepNumbers={config.showStepNumbers !== false}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSkip={handleSkip}
              width={config.tooltipWidth}
              autoAdvance={currentStep.autoAdvance || (config.autoAdvance && currentStep.autoAdvance !== false)}
              autoAdvanceDelay={currentStep.autoAdvanceDelay ?? config.autoAdvanceDelay ?? 5000}
              autoAdvanceProgress={autoAdvanceProgress}
            />
          </div>
        </FloatingPanel>
      )}
    </>,
    document.body
  );
};
