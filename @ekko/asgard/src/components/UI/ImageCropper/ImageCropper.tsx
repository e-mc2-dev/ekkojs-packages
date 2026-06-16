// @ts-nocheck - Pre-existing type issues
import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useTheme } from '../../../theme';
import type { ImageCropperProps, ImageCropperRef, CropArea, ImageDimensions, Point, ResizeHandle, ImageTransform, HistoryState, CroppedImageData } from './types';
import {
  loadImage,
  getAspectRatioValue,
  calculateInitialCrop,
  constrainCropToImage,
  constrainCropToVisibleImage,
  getResizeHandleAtPoint,
  getCursorForHandle,
  isPointInRect,
  resizeCropArea,
  calculateFittedDimensions,
  snapToGrid as snapValueToGrid,
  clamp
} from './utils';

export const ImageCropper = forwardRef<ImageCropperRef, ImageCropperProps>((props, ref) => {
  const {
    src,
    alt = 'Image to crop',
    cropShape = 'rectangle',
    aspectRatio = 'free',
    customAspectRatio,
    initialCrop,
    minCropSize = { width: 20, height: 20 },
    maxCropSize,
    showGrid = true,
    allowRotation = true,
    allowFlip = true,
    showImageAdjustments = false,
    enableHistory = true,
    snapToGrid = false,
    gridSize = 10,
    constrainToImage = false,
    minZoom = 0.1,
    maxZoom = 5,
    initialZoom = 1,
    zoomSpeed = 0.1,
    size = 'normal',
    semantic = 'primary',
    overlayOpacity = 0.5,
    handleSize = 12,
    borderWidth = 2,
    onCropChange,
    onCropComplete,
    onZoomChange,
    onRotationChange,
    onTransformChange,
    onImageLoad,
    onError,
    enableExport = true,
    outputFormat = 'png',
    outputQuality = 0.92,
    exportTransparent = false,
    backgroundColor = '#000000',
    className,
    style
  } = props;

  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({ width: 0, height: 0 });
  const [canvasDimensions, setCanvasDimensions] = useState<ImageDimensions>({ width: 800, height: 600 });
  const [crop, setCropInternal] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [transform, setTransform] = useState<ImageTransform>({
    zoom: initialZoom,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    brightness: 0,
    contrast: 0
  });

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);

  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Get semantic color
  const getSemanticColor = useCallback(() => {
    switch (semantic) {
      case 'primary': return theme.accent.primary;
      case 'secondary': return theme.accent.secondary;
      case 'error': return theme.semantic.error;
      case 'warning': return theme.semantic.warning;
      case 'success': return theme.semantic.success;
      case 'info': return theme.semantic.info;
      default: return theme.accent.primary;
    }
  }, [semantic, theme]);

  const semanticColor = getSemanticColor();

  // Size configurations
  const _sizeConfig = {
    small: { width: 400, height: 300 },
    normal: { width: 800, height: 600 },
    large: { width: 1200, height: 900 }
  };

  // Load image
  useEffect(() => {
    setIsLoading(true);
    loadImage(src)
      .then((img) => {
        setImage(img);
        const dims = { width: img.naturalWidth, height: img.naturalHeight };
        setImageDimensions(dims);
        onImageLoad?.(dims);
        setIsLoading(false);
      })
      .catch((error) => {
        setIsLoading(false);
        onError?.(error as Error);
      });
  }, [src, onImageLoad, onError]);

  // Initialize canvas dimensions
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasDimensions({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Initialize crop area
  useEffect(() => {
    if (image && canvasDimensions.width > 0) {
      const ratio = getAspectRatioValue(aspectRatio, customAspectRatio);
      const initial = initialCrop || calculateInitialCrop(imageDimensions, canvasDimensions, ratio);
      setCropInternal(initial);
    }
  }, [image, imageDimensions, canvasDimensions, aspectRatio, customAspectRatio, initialCrop]);

  // Add to history
  const addToHistory = useCallback((newCrop: CropArea, newTransform: ImageTransform) => {
    if (!enableHistory) return;

    const newState: HistoryState = { crop: newCrop, transform: newTransform };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);

    // Limit history size
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }

    setHistory(newHistory);
  }, [enableHistory, history, historyIndex]);

  // Update crop with constraints
  const updateCrop = useCallback((newCrop: CropArea, addHistory = true) => {
    const ratio = getAspectRatioValue(aspectRatio, customAspectRatio);
    let constrainedCrop = constrainCropToImage(newCrop, canvasDimensions, ratio);

    // Optionally constrain to visible image boundaries
    if (constrainToImage) {
      const displayDims = calculateFittedDimensions(imageDimensions, canvasDimensions, transform.zoom);
      constrainedCrop = constrainCropToVisibleImage(constrainedCrop, displayDims, panOffset, ratio);
    }

    setCropInternal(constrainedCrop);
    onCropChange?.(constrainedCrop);

    if (addHistory) {
      addToHistory(constrainedCrop, transform);
    }
  }, [canvasDimensions, aspectRatio, customAspectRatio, constrainToImage, imageDimensions, transform.zoom, panOffset, onCropChange, transform, addToHistory]);

  // Update transform
  const updateTransform = useCallback((newTransform: Partial<ImageTransform>, addHistory = true) => {
    const updated = { ...transform, ...newTransform };
    setTransform(updated);
    onTransformChange?.(updated);

    if (newTransform.zoom !== undefined) {
      onZoomChange?.(newTransform.zoom);
    }
    if (newTransform.rotation !== undefined) {
      onRotationChange?.(newTransform.rotation);
    }

    if (addHistory) {
      addToHistory(crop, updated);
    }
  }, [transform, crop, onTransformChange, onZoomChange, onRotationChange, addToHistory]);

  // Render canvas
  const render = useCallback(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasDimensions.width;
    canvas.height = canvasDimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate image display dimensions
    const displayDims = calculateFittedDimensions(imageDimensions, canvasDimensions, transform.zoom);

    // Apply pan offset
    const imgX = displayDims.offsetX + panOffset.x;
    const imgY = displayDims.offsetY + panOffset.y;

    // Save context
    ctx.save();

    // Apply transformations
    const centerX = imgX + displayDims.width / 2;
    const centerY = imgY + displayDims.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(
      transform.flipHorizontal ? -1 : 1,
      transform.flipVertical ? -1 : 1
    );

    // Apply image adjustments
    if (transform.brightness !== 0 || transform.contrast !== 0) {
      const brightness = transform.brightness;
      const contrast = transform.contrast;
      ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
    }

    // Draw image
    ctx.drawImage(
      image,
      -displayDims.width / 2,
      -displayDims.height / 2,
      displayDims.width,
      displayDims.height
    );

    // Restore context
    ctx.restore();

    // Fill crop area with background color first (shows where image doesn't cover)
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(crop.x, crop.y, crop.width, crop.height);

    // Clip to crop area and redraw only the image part
    ctx.save();
    ctx.beginPath();
    ctx.rect(crop.x, crop.y, crop.width, crop.height);
    ctx.clip();

    // Redraw the transformed image clipped to crop area
    ctx.translate(centerX, centerY);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(
      transform.flipHorizontal ? -1 : 1,
      transform.flipVertical ? -1 : 1
    );
    if (transform.brightness !== 0 || transform.contrast !== 0) {
      ctx.filter = `brightness(${100 + transform.brightness}%) contrast(${100 + transform.contrast}%)`;
    }
    ctx.drawImage(
      image,
      -displayDims.width / 2,
      -displayDims.height / 2,
      displayDims.width,
      displayDims.height
    );
    ctx.restore();

    // Draw overlay (darken area outside crop)
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayOpacity})`;

    // Top
    ctx.fillRect(0, 0, canvas.width, crop.y);
    // Bottom
    ctx.fillRect(0, crop.y + crop.height, canvas.width, canvas.height - crop.y - crop.height);
    // Left
    ctx.fillRect(0, crop.y, crop.x, crop.height);
    // Right
    ctx.fillRect(crop.x + crop.width, crop.y, canvas.width - crop.x - crop.width, crop.height);

    // Draw crop border
    ctx.strokeStyle = semanticColor;
    ctx.lineWidth = borderWidth;

    if (cropShape === 'circle') {
      // Draw circular crop border
      const centerX = crop.x + crop.width / 2;
      const centerY = crop.y + crop.height / 2;
      const radius = Math.min(crop.width, crop.height) / 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      // Draw rectangular crop border
      ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
    }

    // Draw grid (rule of thirds)
    if (showGrid && cropShape === 'rectangle') {
      ctx.strokeStyle = semanticColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(crop.x + crop.width / 3, crop.y);
      ctx.lineTo(crop.x + crop.width / 3, crop.y + crop.height);
      ctx.moveTo(crop.x + (crop.width * 2) / 3, crop.y);
      ctx.lineTo(crop.x + (crop.width * 2) / 3, crop.y + crop.height);

      // Horizontal lines
      ctx.moveTo(crop.x, crop.y + crop.height / 3);
      ctx.lineTo(crop.x + crop.width, crop.y + crop.height / 3);
      ctx.moveTo(crop.x, crop.y + (crop.height * 2) / 3);
      ctx.lineTo(crop.x + crop.width, crop.y + (crop.height * 2) / 3);
      ctx.stroke();

      ctx.globalAlpha = 1;
    }

    // Draw resize handles
    let handles: Array<{ x: number; y: number }> = [];

    if (cropShape === 'circle') {
      // For circle, only show 4 corner handles
      handles = [
        { x: crop.x, y: crop.y }, // nw
        { x: crop.x + crop.width, y: crop.y }, // ne
        { x: crop.x, y: crop.y + crop.height }, // sw
        { x: crop.x + crop.width, y: crop.y + crop.height } // se
      ];
    } else {
      // For rectangle, show all 8 handles
      handles = [
        { x: crop.x, y: crop.y }, // nw
        { x: crop.x + crop.width / 2, y: crop.y }, // n
        { x: crop.x + crop.width, y: crop.y }, // ne
        { x: crop.x, y: crop.y + crop.height / 2 }, // w
        { x: crop.x + crop.width, y: crop.y + crop.height / 2 }, // e
        { x: crop.x, y: crop.y + crop.height }, // sw
        { x: crop.x + crop.width / 2, y: crop.y + crop.height }, // s
        { x: crop.x + crop.width, y: crop.y + crop.height } // se
      ];
    }

    handles.forEach((handle) => {
      // Draw outer circle (border)
      ctx.fillStyle = theme.background.primary;
      ctx.strokeStyle = semanticColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, handleSize / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw inner circle
      ctx.fillStyle = semanticColor;
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, handleSize / 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [
    image,
    canvasDimensions,
    imageDimensions,
    crop,
    transform,
    panOffset,
    semanticColor,
    overlayOpacity,
    borderWidth,
    showGrid,
    handleSize,
    backgroundColor,
    cropShape,
    theme
  ]);

  // Render on changes
  useEffect(() => {
    render();
  }, [render]);

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const handle = getResizeHandleAtPoint(pos, crop, handleSize);

    if (handle) {
      // Start resizing
      setIsResizing(true);
      setActiveHandle(handle);
      setDragStart(pos);
      setCropStart(crop);
    } else if (isPointInRect(pos, crop)) {
      // Start dragging crop
      setIsDragging(true);
      setDragStart(pos);
      setCropStart(crop);
    } else {
      // Start panning image
      setIsPanning(true);
      setPanStart(pos);
    }
  }, [crop, handleSize, getMousePos]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const pos = getMousePos(e);

    if (isResizing && activeHandle) {
      // Resize crop
      const delta = {
        x: pos.x - dragStart.x,
        y: pos.y - dragStart.y
      };

      const ratio = getAspectRatioValue(aspectRatio, customAspectRatio);
      let newCrop = resizeCropArea(cropStart, activeHandle, delta, ratio, minCropSize, maxCropSize);

      // Apply snap to grid for resize
      if (snapToGrid) {
        newCrop = {
          x: snapValueToGrid(newCrop.x, gridSize),
          y: snapValueToGrid(newCrop.y, gridSize),
          width: snapValueToGrid(newCrop.width, gridSize),
          height: snapValueToGrid(newCrop.height, gridSize)
        };
      }

      updateCrop(newCrop, false);
    } else if (isDragging) {
      // Move crop
      const delta = {
        x: pos.x - dragStart.x,
        y: pos.y - dragStart.y
      };

      let newX = cropStart.x + delta.x;
      let newY = cropStart.y + delta.y;

      if (snapToGrid) {
        newX = snapValueToGrid(newX, gridSize);
        newY = snapValueToGrid(newY, gridSize);
      }

      updateCrop({ ...crop, x: newX, y: newY }, false);
    } else if (isPanning) {
      // Pan image
      const delta = {
        x: pos.x - panStart.x,
        y: pos.y - panStart.y
      };

      setPanOffset(delta);
    } else {
      // Update cursor based on hover
      const handle = getResizeHandleAtPoint(pos, crop, handleSize);
      if (handle) {
        setCursor(getCursorForHandle(handle));
      } else if (isPointInRect(pos, crop)) {
        setCursor('move');
      } else {
        setCursor('grab');
      }
    }
  }, [
    isResizing,
    isDragging,
    isPanning,
    activeHandle,
    dragStart,
    cropStart,
    panStart,
    crop,
    aspectRatio,
    customAspectRatio,
    minCropSize,
    maxCropSize,
    snapToGrid,
    gridSize,
    handleSize,
    getMousePos,
    updateCrop
  ]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isResizing || isDragging) {
      // Add final state to history
      addToHistory(crop, transform);
    }

    setIsResizing(false);
    setIsDragging(false);
    setIsPanning(false);
    setActiveHandle(null);
  }, [isResizing, isDragging, crop, transform, addToHistory]);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, isResizing, isPanning, handleMouseMove, handleMouseUp]);

  // Prevent page scroll on wheel (zoom) - must use native listener with { passive: false }
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
      const newZoom = clamp(transform.zoom + delta, minZoom, maxZoom);
      updateTransform({ zoom: newZoom });
    };

    // Use { passive: false } to allow preventDefault()
    canvas.addEventListener('wheel', handleWheelNative, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheelNative);
    };
  }, [transform.zoom, zoomSpeed, minZoom, maxZoom, updateTransform]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow keys for fine positioning
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const newCrop = { ...crop };

        switch (e.key) {
          case 'ArrowUp': newCrop.y -= step; break;
          case 'ArrowDown': newCrop.y += step; break;
          case 'ArrowLeft': newCrop.x -= step; break;
          case 'ArrowRight': newCrop.x += step; break;
        }

        updateCrop(newCrop);
      }

      // Zoom shortcuts
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        const newZoom = clamp(transform.zoom + zoomSpeed, minZoom, maxZoom);
        updateTransform({ zoom: newZoom });
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        const newZoom = clamp(transform.zoom - zoomSpeed, minZoom, maxZoom);
        updateTransform({ zoom: newZoom });
      }

      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undoAction();
        }
        if (e.key === 'z' && e.shiftKey || e.key === 'y') {
          e.preventDefault();
          redoAction();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [crop, transform, minZoom, maxZoom, zoomSpeed, updateCrop, updateTransform]);

  // Imperative handle methods
  const getCroppedImage = useCallback(
    async (format: 'png' | 'jpeg' | 'webp' = outputFormat, quality: number = outputQuality): Promise<CroppedImageData> => {
      if (!image || !canvasRef.current) {
        throw new Error('Image not loaded');
      }

      // Calculate display dimensions (how image appears on canvas)
      const displayDims = calculateFittedDimensions(imageDimensions, canvasDimensions, transform.zoom);

      // Calculate scale factor from display to original image
      const scaleX = imageDimensions.width / displayDims.width;
      const scaleY = imageDimensions.height / displayDims.height;

      // Map crop coordinates from display space to original image space
      const imgX = displayDims.offsetX + panOffset.x;
      const imgY = displayDims.offsetY + panOffset.y;

      // Crop position relative to the displayed image (in display coordinates)
      const cropRelativeX = crop.x - imgX;
      const cropRelativeY = crop.y - imgY;

      // Convert to original image coordinates (high resolution)
      const sourceX = cropRelativeX * scaleX;
      const sourceY = cropRelativeY * scaleY;
      const sourceWidth = crop.width * scaleX;
      const sourceHeight = crop.height * scaleY;

      // Calculate output dimensions in original resolution
      const outputWidth = Math.round(sourceWidth);
      const outputHeight = Math.round(sourceHeight);

      // Create full-size transformed canvas using ORIGINAL resolution
      const rotationRad = (transform.rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rotationRad));
      const sin = Math.abs(Math.sin(rotationRad));

      // Calculate rotated dimensions at original resolution
      const rotatedWidth = imageDimensions.width * cos + imageDimensions.height * sin;
      const rotatedHeight = imageDimensions.width * sin + imageDimensions.height * cos;

      // Create canvas for full transformed image at original resolution
      const fullCanvas = document.createElement('canvas');
      const fullCtx = fullCanvas.getContext('2d');
      if (!fullCtx) throw new Error('Could not get canvas context');

      fullCanvas.width = rotatedWidth;
      fullCanvas.height = rotatedHeight;

      // Save context
      fullCtx.save();

      // Apply transformations at center
      const centerX = rotatedWidth / 2;
      const centerY = rotatedHeight / 2;

      fullCtx.translate(centerX, centerY);
      fullCtx.rotate(rotationRad);
      fullCtx.scale(
        transform.flipHorizontal ? -1 : 1,
        transform.flipVertical ? -1 : 1
      );

      // Apply image adjustments (brightness/contrast)
      if (transform.brightness !== 0 || transform.contrast !== 0) {
        fullCtx.filter = `brightness(${100 + transform.brightness}%) contrast(${100 + transform.contrast}%)`;
      }

      // Draw the FULL ORIGINAL resolution image with transforms
      fullCtx.drawImage(
        image,
        -imageDimensions.width / 2,
        -imageDimensions.height / 2,
        imageDimensions.width,
        imageDimensions.height
      );

      fullCtx.restore();

      // Now create the final cropped canvas at original resolution
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Could not get canvas context');

      tempCanvas.width = outputWidth;
      tempCanvas.height = outputHeight;

      // Fill with background color if not transparent
      if (!exportTransparent) {
        tempCtx.fillStyle = backgroundColor;
        tempCtx.fillRect(0, 0, outputWidth, outputHeight);
      }
      // If exportTransparent is true, canvas starts with transparent pixels

      // Calculate source position in the transformed full-resolution image
      const transformedSourceX = sourceX + (rotatedWidth - imageDimensions.width) / 2;
      const transformedSourceY = sourceY + (rotatedHeight - imageDimensions.height) / 2;

      if (cropShape === 'circle') {
        // For circular crop, apply circular clipping mask
        tempCtx.save();

        const centerX = outputWidth / 2;
        const centerY = outputHeight / 2;
        const radius = Math.min(outputWidth, outputHeight) / 2;

        // Create circular clipping path
        tempCtx.beginPath();
        tempCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        tempCtx.closePath();
        tempCtx.clip();

        // Draw the image within the circular clip
        tempCtx.drawImage(
          fullCanvas,
          transformedSourceX,
          transformedSourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          outputWidth,
          outputHeight
        );

        tempCtx.restore();
      } else {
        // Extract the rectangular crop from the full-resolution transformed image
        tempCtx.drawImage(
          fullCanvas,
          transformedSourceX,
          transformedSourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          outputWidth,
          outputHeight
        );
      }

      // Convert to blob
      return new Promise((resolve, reject) => {
        tempCanvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            const dataUrl = tempCanvas.toDataURL(`image/${format}`, quality);
            resolve({
              blob,
              dataUrl,
              dimensions: { width: outputWidth, height: outputHeight },
              cropArea: crop
            });
          },
          `image/${format}`,
          quality
        );
      });
    },
    [image, crop, imageDimensions, canvasDimensions, transform, panOffset, outputFormat, outputQuality, exportTransparent, backgroundColor, cropShape]
  );

  const setCrop = useCallback((newCrop: CropArea) => {
    updateCrop(newCrop);
  }, [updateCrop]);

  const setZoom = useCallback((zoom: number) => {
    updateTransform({ zoom: clamp(zoom, minZoom, maxZoom) });
  }, [minZoom, maxZoom, updateTransform]);

  const setRotation = useCallback((rotation: number) => {
    updateTransform({ rotation: rotation % 360 });
  }, [updateTransform]);

  const setBrightness = useCallback((brightness: number) => {
    updateTransform({ brightness: clamp(brightness, -100, 100) });
  }, [updateTransform]);

  const setContrast = useCallback((contrast: number) => {
    updateTransform({ contrast: clamp(contrast, -100, 100) });
  }, [updateTransform]);

  const rotate90 = useCallback((direction: 'cw' | 'ccw') => {
    const delta = direction === 'cw' ? 90 : -90;
    updateTransform({ rotation: (transform.rotation + delta) % 360 });
  }, [transform.rotation, updateTransform]);

  const flipHorizontal = useCallback(() => {
    updateTransform({ flipHorizontal: !transform.flipHorizontal });
  }, [transform.flipHorizontal, updateTransform]);

  const flipVertical = useCallback(() => {
    updateTransform({ flipVertical: !transform.flipVertical });
  }, [transform.flipVertical, updateTransform]);

  const resetTransform = useCallback(() => {
    updateTransform({
      zoom: initialZoom,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      brightness: 0,
      contrast: 0
    });
    setPanOffset({ x: 0, y: 0 });
  }, [initialZoom, updateTransform]);

  const undoAction = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setCropInternal(state.crop);
      setTransform(state.transform);
      setHistoryIndex(newIndex);
      onCropChange?.(state.crop);
      onTransformChange?.(state.transform);
    }
  }, [history, historyIndex, onCropChange, onTransformChange]);

  const redoAction = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setCropInternal(state.crop);
      setTransform(state.transform);
      setHistoryIndex(newIndex);
      onCropChange?.(state.crop);
      onTransformChange?.(state.transform);
    }
  }, [history, historyIndex, onCropChange, onTransformChange]);

  const canUndo = useCallback(() => historyIndex > 0, [historyIndex]);
  const canRedo = useCallback(() => historyIndex < history.length - 1, [historyIndex, history.length]);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    getCroppedImage,
    setCrop,
    setZoom,
    setRotation,
    setBrightness,
    setContrast,
    rotate90,
    flipHorizontal,
    flipVertical,
    resetTransform,
    undo: undoAction,
    redo: redoAction,
    canUndo,
    canRedo
  }), [
    getCroppedImage,
    setCrop,
    setZoom,
    setRotation,
    setBrightness,
    setContrast,
    rotate90,
    flipHorizontal,
    flipVertical,
    resetTransform,
    undoAction,
    redoAction,
    canUndo,
    canRedo
  ]);

  // Handle export button
  const _handleExport = useCallback(async () => {
    try {
      const result = await getCroppedImage();
      onCropComplete?.(result);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [getCroppedImage, onCropComplete, onError]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background.secondary,
    position: 'relative',
    overflow: 'hidden',
    ...style
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
    >
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: theme.text.primary,
          fontSize: 16
        }}>
          Loading image...
        </div>
      )}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{
          cursor: isDragging || isResizing ? cursor : isPanning ? 'grabbing' : cursor,
          display: isLoading ? 'none' : 'block'
        }}
      />
    </div>
  );
});

ImageCropper.displayName = 'ImageCropper';
