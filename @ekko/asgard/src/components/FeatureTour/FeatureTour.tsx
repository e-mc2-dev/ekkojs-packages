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

  // Live ref to the current step so the index-keyed effects below read fresh step data WITHOUT
  // re-running on every parent re-render. Critical: a step `action` that sets parent state recreates
  // the inline `config` (new step objects). Depending on the step OBJECT would re-run the setup effect
  // and re-fire the action → setState → re-render → … infinite loop that freezes the tab (made total
  // by the window-level event blocker). Keying on currentStepIndex + this ref avoids that entirely.
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

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

  // Run a step's setup (action → wait → scroll) and position the tooltip. Keyed on currentStepIndex
  // (a stable number), NOT the step object, so it runs EXACTLY ONCE per step — re-renders triggered by
  // a step's own action don't re-enter it. The step is read from the ref so it's always current.
  useEffect(() => {
    if (!isOpen) return;
    const step = currentStepRef.current;
    if (!step) return;

    let cancelled = false;

    // Move the virtual anchor AND set the rect together: the panel's next position calc reads the new
    // target's coordinates, so the tooltip appears at the right place instead of flashing the previous
    // step's position then jumping. Also used as the scroll/resize handler so it stays glued.
    const place = () => {
      const el = getTargetElement(currentStepRef.current);
      if (!el) { setTargetRect(null); return; }
      const rect = el.getBoundingClientRect();
      const a = virtualAnchorRef.current;
      if (a) {
        a.style.position = 'fixed';
        a.style.top = `${rect.top}px`;
        a.style.left = `${rect.left}px`;
        a.style.width = `${rect.width}px`;
        a.style.height = `${rect.height}px`;
      }
      setTargetRect(rect);
    };

    const run = async () => {
      setIsProcessing(true);
      try {
        // Run the step's action + explicit wait once (they may create/reveal the target).
        if (step.action) await Promise.resolve(step.action());
        if (step.wait) {
          if (typeof step.wait === 'number') await new Promise(resolve => setTimeout(resolve, step.wait as number));
          else await step.wait();
        }
        if (cancelled) return;

        // Reveal immediately at the target's current position (no jump, no long disappearance)…
        place();

        // …then scroll it into view; the listeners below keep it tracking during the smooth scroll.
        const el = getTargetElement(step);
        if (el && step.scrollIntoView !== false) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          await new Promise(resolve => setTimeout(resolve, 500));
          if (cancelled) return;
          place();
        }
      } finally {
        if (!cancelled) setIsProcessing(false);
      }
    };

    run();

    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStepIndex, getTargetElement]);

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

  // Latest-handler refs so the window/keyboard/auto-advance effects stay keyed on stable deps
  // (index / isOpen) instead of re-subscribing on every render as these callbacks are recreated.
  const handleNextRef = useRef(handleNext);
  const handlePreviousRef = useRef(handlePrevious);
  const handleSkipRef = useRef(handleSkip);
  handleNextRef.current = handleNext;
  handlePreviousRef.current = handlePrevious;
  handleSkipRef.current = handleSkip;

  // Auto-advance timer. Keyed on the index (not the step object / handleNext) so the rAF progress
  // updates don't re-run it (which would reset the timer every frame and never advance).
  useEffect(() => {
    if (!isOpen || isProcessing) return;
    const step = currentStepRef.current;
    if (!step) return;

    const shouldAutoAdvance = step.autoAdvance ||
      (config.autoAdvance && step.autoAdvance !== false);

    if (!shouldAutoAdvance) {
      setAutoAdvanceProgress(0);
      return;
    }

    const delay = step.autoAdvanceDelay ?? config.autoAdvanceDelay ?? 5000;
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
        handleNextRef.current();
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
  }, [isOpen, currentStepIndex, isProcessing, config.autoAdvance, config.autoAdvanceDelay]);

  // Block all events at window level except for tooltip navigation
  useEffect(() => {
    if (!isOpen || currentStepRef.current?.allowInteraction) return;

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
              handleNextRef.current();
              return;
            }

            // Check for Previous button
            if (text === 'Previous') {
              handlePreviousRef.current();
              return;
            }

            // Check for Skip button (exact match only)
            if (text === 'Skip Tour') {
              handleSkipRef.current();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStepIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || !config.keyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          handleNextRef.current();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          handlePreviousRef.current();
          break;
        case 'Escape':
          e.preventDefault();
          handleSkipRef.current();
          break;
        case 'Enter':
          e.preventDefault();
          handleNextRef.current();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, config.keyboard, isProcessing]);

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
