import type { AspectRatio, CropArea, ImageDimensions, Point, ResizeHandle } from './types';

/**
 * Get numeric aspect ratio from preset or custom value
 */
export function getAspectRatioValue(ratio: AspectRatio, customRatio?: number): number | null {
  switch (ratio) {
    case 'free': return null;
    case '1:1': return 1;
    case '3:4': return 3 / 4;
    case '4:3': return 4 / 3;
    case '16:9': return 16 / 9;
    case '21:9': return 21 / 9;
    case '9:16': return 9 / 16;
    case 'custom': return customRatio || null;
    default: return null;
  }
}

/**
 * Load image from various sources
 */
export async function loadImage(src: string | File | HTMLImageElement): Promise<HTMLImageElement> {
  if (src instanceof HTMLImageElement) {
    return src;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    // crossOrigin lets us canvas-export a REMOTE image, but setting it on a data:/blob: URL makes some
    // WebKit builds refuse to load the image (onerror) — and the Upload preview IS a data: URL, which is
    // why the cropper rendered empty. Only set it for http(s) sources; same-origin/data/blob don't need it.
    if (typeof src === 'string' && /^https?:/i.test(src)) img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));

    if (typeof src === 'string') {
      img.src = src;
    } else if (src instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(src);
    }
  });
}

/**
 * Calculate initial crop area centered in the image
 */
export function calculateInitialCrop(
  _imageDimensions: ImageDimensions,
  canvasDimensions: ImageDimensions,
  aspectRatio: number | null
): CropArea {
  const { width: canvasWidth, height: canvasHeight } = canvasDimensions;

  let cropWidth: number;
  let cropHeight: number;

  if (aspectRatio) {
    // Start with 70% of the smaller dimension
    const size = Math.min(canvasWidth, canvasHeight) * 0.7;

    if (aspectRatio >= 1) {
      // Landscape or square
      cropWidth = size;
      cropHeight = size / aspectRatio;
    } else {
      // Portrait
      cropHeight = size;
      cropWidth = size * aspectRatio;
    }
  } else {
    // Free aspect ratio - use 70% of canvas
    cropWidth = canvasWidth * 0.7;
    cropHeight = canvasHeight * 0.7;
  }

  // Ensure crop doesn't exceed image bounds
  cropWidth = Math.min(cropWidth, canvasWidth);
  cropHeight = Math.min(cropHeight, canvasHeight);

  // Center the crop
  const x = (canvasWidth - cropWidth) / 2;
  const y = (canvasHeight - cropHeight) / 2;

  return { x, y, width: cropWidth, height: cropHeight };
}

/**
 * Constrain crop area to image bounds while maintaining aspect ratio if provided
 */
export function constrainCropToImage(
  crop: CropArea,
  canvasDimensions: ImageDimensions,
  aspectRatio?: number | null
): CropArea {
  const { width: canvasWidth, height: canvasHeight } = canvasDimensions;

  let { x, y, width, height } = crop;

  // If aspect ratio is set, we need to constrain more carefully
  if (aspectRatio) {
    // First ensure the crop doesn't exceed canvas bounds
    const maxWidth = canvasWidth;
    const maxHeight = canvasHeight;

    // Calculate the maximum size that fits in canvas while maintaining aspect ratio
    let constrainedWidth = width;
    let constrainedHeight = height;

    if (width > maxWidth) {
      constrainedWidth = maxWidth;
      constrainedHeight = constrainedWidth / aspectRatio;
    }
    if (constrainedHeight > maxHeight) {
      constrainedHeight = maxHeight;
      constrainedWidth = constrainedHeight * aspectRatio;
    }

    width = constrainedWidth;
    height = constrainedHeight;

    // Constrain position
    x = Math.max(0, Math.min(x, canvasWidth - width));
    y = Math.max(0, Math.min(y, canvasHeight - height));
  } else {
    // Free aspect ratio - constrain independently
    // Constrain position
    x = Math.max(0, Math.min(x, canvasWidth - width));
    y = Math.max(0, Math.min(y, canvasHeight - height));

    // Constrain size
    width = Math.min(width, canvasWidth - x);
    height = Math.min(height, canvasHeight - y);
  }

  return { x, y, width, height };
}

/**
 * Apply min/max constraints to crop dimensions
 */
export function constrainCropSize(
  crop: CropArea,
  minSize?: ImageDimensions,
  maxSize?: ImageDimensions
): CropArea {
  let { width, height } = crop;

  if (minSize) {
    width = Math.max(width, minSize.width);
    height = Math.max(height, minSize.height);
  }

  if (maxSize) {
    width = Math.min(width, maxSize.width);
    height = Math.min(height, maxSize.height);
  }

  return { ...crop, width, height };
}

/**
 * Get cursor style based on resize handle
 */
export function getCursorForHandle(handle: ResizeHandle): string {
  switch (handle) {
    case 'nw': case 'se': return 'nwse-resize';
    case 'ne': case 'sw': return 'nesw-resize';
    case 'n': case 's': return 'ns-resize';
    case 'w': case 'e': return 'ew-resize';
    default: return 'default';
  }
}

/**
 * Determine which resize handle is at the given point
 */
export function getResizeHandleAtPoint(
  point: Point,
  crop: CropArea,
  handleSize: number
): ResizeHandle {
  const { x, y, width, height } = crop;
  const halfHandle = handleSize / 2;

  // Corner handles
  if (isPointInRect(point, { x: x - halfHandle, y: y - halfHandle, width: handleSize, height: handleSize })) {
    return 'nw';
  }
  if (isPointInRect(point, { x: x + width - halfHandle, y: y - halfHandle, width: handleSize, height: handleSize })) {
    return 'ne';
  }
  if (isPointInRect(point, { x: x - halfHandle, y: y + height - halfHandle, width: handleSize, height: handleSize })) {
    return 'sw';
  }
  if (isPointInRect(point, { x: x + width - halfHandle, y: y + height - halfHandle, width: handleSize, height: handleSize })) {
    return 'se';
  }

  // Edge handles
  if (isPointInRect(point, { x: x + width / 2 - halfHandle, y: y - halfHandle, width: handleSize, height: handleSize })) {
    return 'n';
  }
  if (isPointInRect(point, { x: x + width / 2 - halfHandle, y: y + height - halfHandle, width: handleSize, height: handleSize })) {
    return 's';
  }
  if (isPointInRect(point, { x: x - halfHandle, y: y + height / 2 - halfHandle, width: handleSize, height: handleSize })) {
    return 'w';
  }
  if (isPointInRect(point, { x: x + width - halfHandle, y: y + height / 2 - halfHandle, width: handleSize, height: handleSize })) {
    return 'e';
  }

  return null;
}

/**
 * Check if point is inside rectangle
 */
export function isPointInRect(point: Point, rect: CropArea): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Resize crop area from a handle while maintaining aspect ratio if needed
 */
export function resizeCropArea(
  crop: CropArea,
  handle: ResizeHandle,
  delta: Point,
  aspectRatio: number | null,
  minSize?: ImageDimensions,
  maxSize?: ImageDimensions
): CropArea {
  if (!handle) return crop;

  let { x, y, width, height } = crop;

  // Apply delta based on handle
  switch (handle) {
    case 'nw':
      x += delta.x;
      y += delta.y;
      width -= delta.x;
      height -= delta.y;
      break;
    case 'ne':
      y += delta.y;
      width += delta.x;
      height -= delta.y;
      break;
    case 'sw':
      x += delta.x;
      width -= delta.x;
      height += delta.y;
      break;
    case 'se':
      width += delta.x;
      height += delta.y;
      break;
    case 'n':
      y += delta.y;
      height -= delta.y;
      break;
    case 's':
      height += delta.y;
      break;
    case 'w':
      x += delta.x;
      width -= delta.x;
      break;
    case 'e':
      width += delta.x;
      break;
  }

  // Apply aspect ratio constraint BEFORE min/max constraints
  if (aspectRatio) {
    // Determine which dimension to adjust based on the handle
    const isCorner = ['nw', 'ne', 'sw', 'se'].includes(handle);
    const isHorizontal = ['w', 'e'].includes(handle);

    if (isCorner) {
      // For corners, adjust based on which dimension changed more
      const widthChange = Math.abs(delta.x);
      const heightChange = Math.abs(delta.y);

      if (widthChange > heightChange) {
        height = width / aspectRatio;
      } else {
        width = height * aspectRatio;
      }

      // Adjust position for top/left handles
      if (handle.includes('n')) {
        y = crop.y + crop.height - height;
      }
      if (handle.includes('w')) {
        x = crop.x + crop.width - width;
      }
    } else if (isHorizontal) {
      height = width / aspectRatio;
      if (handle === 'w') {
        x = crop.x + crop.width - width;
      }
    } else {
      width = height * aspectRatio;
      if (handle === 'n') {
        y = crop.y + crop.height - height;
      }
    }
  }

  // Apply min/max constraints
  const minW = minSize?.width || 20;
  const minH = minSize?.height || 20;
  const maxW = maxSize?.width || Infinity;
  const maxH = maxSize?.height || Infinity;

  // If aspect ratio is set, constrain both dimensions proportionally
  if (aspectRatio) {
    // Calculate constrained size while maintaining aspect ratio
    let constrainedWidth = Math.max(minW, Math.min(maxW, width));
    let constrainedHeight = Math.max(minH, Math.min(maxH, height));

    // Determine which constraint is more restrictive
    const widthRatio = constrainedWidth / width;
    const heightRatio = constrainedHeight / height;
    const limitingRatio = Math.min(widthRatio, heightRatio);

    // Apply the most restrictive constraint to both dimensions
    if (limitingRatio < 1) {
      const newWidth = width * limitingRatio;
      const newHeight = height * limitingRatio;

      // Adjust position if resizing from top or left
      if (handle.includes('n')) {
        y = crop.y + crop.height - newHeight;
      }
      if (handle.includes('w')) {
        x = crop.x + crop.width - newWidth;
      }

      width = newWidth;
      height = newHeight;
    }
  } else {
    // Free aspect ratio - constrain independently
    width = Math.max(minW, Math.min(maxW, width));
    height = Math.max(minH, Math.min(maxH, height));
  }

  return { x, y, width, height };
}

/**
 * Calculate fitted image dimensions to canvas while maintaining aspect ratio
 */
export function calculateFittedDimensions(
  imageDimensions: ImageDimensions,
  canvasDimensions: ImageDimensions,
  zoom: number = 1
): { width: number; height: number; offsetX: number; offsetY: number } {
  const { width: imgWidth, height: imgHeight } = imageDimensions;
  const { width: canvasWidth, height: canvasHeight } = canvasDimensions;

  const imageAspect = imgWidth / imgHeight;
  const canvasAspect = canvasWidth / canvasHeight;

  let width: number;
  let height: number;

  if (imageAspect > canvasAspect) {
    // Image is wider than canvas
    width = canvasWidth;
    height = canvasWidth / imageAspect;
  } else {
    // Image is taller than canvas
    height = canvasHeight;
    width = canvasHeight * imageAspect;
  }

  // Apply zoom
  width *= zoom;
  height *= zoom;

  // Center the image
  const offsetX = (canvasWidth - width) / 2;
  const offsetY = (canvasHeight - height) / 2;

  return { width, height, offsetX, offsetY };
}

/**
 * Convert canvas coordinates to image coordinates
 */
export function canvasToImageCoordinates(
  canvasPoint: Point,
  imageDimensions: ImageDimensions,
  displayDimensions: { width: number; height: number; offsetX: number; offsetY: number }
): Point {
  const { width: imgWidth, height: imgHeight } = imageDimensions;
  const { width: dispWidth, height: dispHeight, offsetX, offsetY } = displayDimensions;

  const x = ((canvasPoint.x - offsetX) / dispWidth) * imgWidth;
  const y = ((canvasPoint.y - offsetY) / dispHeight) * imgHeight;

  return { x, y };
}

/**
 * Snap value to grid
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Constrain crop area to visible image boundaries (accounting for zoom and pan) while maintaining aspect ratio
 */
export function constrainCropToVisibleImage(
  crop: CropArea,
  displayDimensions: { width: number; height: number; offsetX: number; offsetY: number },
  panOffset: { x: number; y: number },
  aspectRatio?: number | null
): CropArea {
  const imgLeft = displayDimensions.offsetX + panOffset.x;
  const imgTop = displayDimensions.offsetY + panOffset.y;
  const imgRight = imgLeft + displayDimensions.width;
  const imgBottom = imgTop + displayDimensions.height;

  let { x, y, width, height } = crop;

  if (aspectRatio) {
    // Calculate maximum available space
    const maxWidth = displayDimensions.width;
    const maxHeight = displayDimensions.height;

    // Constrain size to fit within image while maintaining aspect ratio
    let constrainedWidth = width;
    let constrainedHeight = height;

    if (width > maxWidth) {
      constrainedWidth = maxWidth;
      constrainedHeight = constrainedWidth / aspectRatio;
    }
    if (constrainedHeight > maxHeight) {
      constrainedHeight = maxHeight;
      constrainedWidth = constrainedHeight * aspectRatio;
    }

    width = Math.max(20, constrainedWidth);
    height = Math.max(20, constrainedHeight);

    // Constrain position to keep crop within image
    x = Math.max(imgLeft, Math.min(x, imgRight - width));
    y = Math.max(imgTop, Math.min(y, imgBottom - height));
  } else {
    // Free aspect ratio
    // Constrain to not go outside image boundaries
    x = Math.max(imgLeft, Math.min(x, imgRight - width));
    y = Math.max(imgTop, Math.min(y, imgBottom - height));

    // Adjust size if crop would extend beyond image
    if (x + width > imgRight) {
      width = imgRight - x;
    }
    if (y + height > imgBottom) {
      height = imgBottom - y;
    }

    // Ensure minimum size
    width = Math.max(20, width);
    height = Math.max(20, height);
  }

  return { x, y, width, height };
}
