import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, ZoomIn, ZoomOut, Crop, RotateCcw, Settings2, Undo2, Redo2 } from 'lucide-react';
import { ImageMetadata } from '../types';
import { useMetadataStore } from '../store/metadataStore';

interface BatchDefectImage {
  photoNumber: string;
  description: string;
  image: ImageMetadata;
  defectId: string;
}

interface BatchDefectImageViewerProps {
  defects: BatchDefectImage[];
  initialIndex: number;
  onClose: (currentIndex?: number) => void;
  onDeleteImage?: (defectId: string) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageAdjustments {
  brightness: number;      // -100 to 100
  contrast: number;        // -100 to 100
  saturation: number;      // -100 to 100
  exposure: number;        // -100 to 100
  highlights: number;      // -100 to 100
  shadows: number;         // -100 to 100
  temperature: number;     // -100 (cool/blue) to 100 (warm/yellow)
  tint: number;            // -100 (green) to 100 (magenta)
}

interface HistoryState {
  imageSrc: string;
  adjustments: ImageAdjustments;
  cropArea: CropArea | null;
}

export const BatchDefectImageViewer: React.FC<BatchDefectImageViewerProps> = ({
  defects,
  initialIndex,
  onClose,
  onDeleteImage
}) => {
  const { images } = useMetadataStore();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showAdjustments, setShowAdjustments] = useState(false);
  
  // Crop resizing state
  const [cropResizing, setCropResizing] = useState<'none' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'move'>('none');
  const [cropResizeStart, setCropResizeStart] = useState<{ x: number; y: number; crop: CropArea } | null>(null);
  
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
    tint: 0,
  });
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [originalImageSrc, setOriginalImageSrc] = useState<string>('');
  const [originalImageBlob, setOriginalImageBlob] = useState<Blob | null>(null); // Store original blob
  
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const adjustmentCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);

  // Initialize original image and history
  useEffect(() => {
    if (defects[currentIndex]) {
      const image = defects[currentIndex].image;
      // Get the original image from store
      const originalImage = images.find(img => img.id === image.id);
      const src = originalImage?.preview || image.preview;
      
      // Load original image as blob to preserve it
      fetch(src)
        .then(res => res.blob())
        .then(blob => {
          setOriginalImageBlob(blob);
          const blobUrl = URL.createObjectURL(blob);
          setOriginalImageSrc(blobUrl);
          
          const resetAdjustments = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            exposure: 0,
            highlights: 0,
            shadows: 0,
            temperature: 0,
            tint: 0,
          };
          setHistory([{ imageSrc: blobUrl, adjustments: resetAdjustments, cropArea: null }]);
          setHistoryIndex(0);
          
          // Set image source
          if (imageRef.current) {
            imageRef.current.src = blobUrl;
          }
        })
        .catch(console.error);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      if (e.key === 'Escape') {
        if (isCropping) {
          setIsCropping(false);
          setCropArea(null);
        } else {
          onClose(currentIndex);
        }
      } else if (e.key === 'ArrowLeft' && !isCropping) {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : defects.length - 1));
      } else if (e.key === 'ArrowRight' && !isCropping) {
        setCurrentIndex((prev) => (prev < defects.length - 1 ? prev + 1 : 0));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [defects.length, onClose, isCropping, historyIndex, history.length]);

  // Reset transformations when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCropArea(null);
    setIsCropping(false);
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      temperature: 0,
      tint: 0,
    });
    // Clear any pending adjustment timeout
    if (adjustmentTimeoutRef.current) {
      clearTimeout(adjustmentTimeoutRef.current);
      adjustmentTimeoutRef.current = null;
    }
    lastHistoryStateRef.current = null;
  }, [currentIndex]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (adjustmentTimeoutRef.current) {
        clearTimeout(adjustmentTimeoutRef.current);
      }
    };
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : defects.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < defects.length - 1 ? prev + 1 : 0));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  // Track if we're currently adjusting (to debounce history updates)
  const adjustmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHistoryStateRef = useRef<{ adjustments: ImageAdjustments; cropArea: CropArea | null } | null>(null);

  const handleAdjustmentChange = (key: keyof ImageAdjustments, value: number) => {
    setAdjustments((prev) => {
      const newAdjustments = { ...prev, [key]: value };
      
      // Apply edits immediately for preview
      applyAllEdits(newAdjustments, cropArea);
      
      // Debounce history updates - only add to history when user stops adjusting
      if (adjustmentTimeoutRef.current) {
        clearTimeout(adjustmentTimeoutRef.current);
      }
      
      adjustmentTimeoutRef.current = setTimeout(() => {
        // Only add to history if this is a meaningful change
        const currentState = { adjustments: newAdjustments, cropArea };
        const lastState = lastHistoryStateRef.current;
        
        if (!lastState || 
            JSON.stringify(currentState.adjustments) !== JSON.stringify(lastState.adjustments) ||
            JSON.stringify(currentState.cropArea) !== JSON.stringify(lastState.cropArea)) {
          if (imageRef.current) {
            addToHistory(imageRef.current.src, newAdjustments, cropArea);
            lastHistoryStateRef.current = currentState;
          }
        }
      }, 500); // Wait 500ms after last change
      
      return newAdjustments;
    });
  };

  const handleReset = async () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCropArea(null);
    setIsCropping(false);
    const resetAdjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      temperature: 0,
      tint: 0,
    };
    setAdjustments(resetAdjustments);
    
    // Restore original image
    if (originalImageBlob) {
      const blobUrl = URL.createObjectURL(originalImageBlob);
      if (imageRef.current) {
        imageRef.current.src = blobUrl;
      }
      setOriginalImageSrc(blobUrl);
      addToHistory(blobUrl, resetAdjustments, null);
    } else if (originalImageSrc) {
      if (imageRef.current) {
        imageRef.current.src = originalImageSrc;
      }
      addToHistory(originalImageSrc, resetAdjustments, null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isCropping && imageContainerRef.current && imageRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const imgRect = imageRef.current.getBoundingClientRect();
      if (!imgRect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate scale factors
      const scaleX = imageRef.current.naturalWidth / imgRect.width;
      const scaleY = imageRef.current.naturalHeight / imgRect.height;

      if (cropArea) {
        // Check if clicking on resize handle or crop area
        const handleSize = 8;
        const cropLeft = (imgRect.left - rect.left) + (cropArea.x * imgRect.width / imageRef.current.naturalWidth);
        const cropTop = (imgRect.top - rect.top) + (cropArea.y * imgRect.height / imageRef.current.naturalHeight);
        const cropWidth = cropArea.width * imgRect.width / imageRef.current.naturalWidth;
        const cropHeight = cropArea.height * imgRect.height / imageRef.current.naturalHeight;

        // Determine which handle or area
        if (x >= cropLeft - handleSize && x <= cropLeft + handleSize && 
            y >= cropTop - handleSize && y <= cropTop + handleSize) {
          setCropResizing('nw');
        } else if (x >= cropLeft + cropWidth - handleSize && x <= cropLeft + cropWidth + handleSize && 
                   y >= cropTop - handleSize && y <= cropTop + handleSize) {
          setCropResizing('ne');
        } else if (x >= cropLeft - handleSize && x <= cropLeft + handleSize && 
                   y >= cropTop + cropHeight - handleSize && y <= cropTop + cropHeight + handleSize) {
          setCropResizing('sw');
        } else if (x >= cropLeft + cropWidth - handleSize && x <= cropLeft + cropWidth + handleSize && 
                   y >= cropTop + cropHeight - handleSize && y <= cropTop + cropHeight + handleSize) {
          setCropResizing('se');
        } else if (x >= cropLeft && x <= cropLeft + cropWidth && 
                   y >= cropTop - handleSize && y <= cropTop + handleSize) {
          setCropResizing('n');
        } else if (x >= cropLeft && x <= cropLeft + cropWidth && 
                   y >= cropTop + cropHeight - handleSize && y <= cropTop + cropHeight + handleSize) {
          setCropResizing('s');
        } else if (x >= cropLeft - handleSize && x <= cropLeft + handleSize && 
                   y >= cropTop && y <= cropTop + cropHeight) {
          setCropResizing('w');
        } else if (x >= cropLeft + cropWidth - handleSize && x <= cropLeft + cropWidth + handleSize && 
                   y >= cropTop && y <= cropTop + cropHeight) {
          setCropResizing('e');
        } else if (x >= cropLeft && x <= cropLeft + cropWidth && 
                   y >= cropTop && y <= cropTop + cropHeight) {
          setCropResizing('move');
        } else {
          // Create new crop at click position, constrained to image bounds
          const newX = (x - (imgRect.left - rect.left)) * scaleX;
          const newY = (y - (imgRect.top - rect.top)) * scaleY;
          const maxSize = Math.min(imageRef.current.naturalWidth, imageRef.current.naturalHeight);
          const size = maxSize * 0.3;
          
          // Constrain to image bounds
          const constrainedX = Math.max(0, Math.min(imageRef.current.naturalWidth - size, newX));
          const constrainedY = Math.max(0, Math.min(imageRef.current.naturalHeight - size, newY));
          const constrainedSize = Math.min(
            size, 
            imageRef.current.naturalWidth - constrainedX, 
            imageRef.current.naturalHeight - constrainedY
          );
          
          setCropArea({ 
            x: constrainedX, 
            y: constrainedY, 
            width: Math.max(10, constrainedSize), 
            height: Math.max(10, constrainedSize) 
          });
          setCropResizing('se');
        }

        if (cropArea) {
          setCropResizeStart({ x: e.clientX, y: e.clientY, crop: { ...cropArea } });
        }
      } else {
        // Create new crop at click position, constrained to image bounds
        const newX = (x - (imgRect.left - rect.left)) * scaleX;
        const newY = (y - (imgRect.top - rect.top)) * scaleY;
        const maxSize = Math.min(imageRef.current.naturalWidth, imageRef.current.naturalHeight);
        const size = maxSize * 0.3;
        
        // Constrain to image bounds
        const constrainedX = Math.max(0, Math.min(imageRef.current.naturalWidth - size, newX));
        const constrainedY = Math.max(0, Math.min(imageRef.current.naturalHeight - size, newY));
        const constrainedSize = Math.min(
          size, 
          imageRef.current.naturalWidth - constrainedX, 
          imageRef.current.naturalHeight - constrainedY
        );
        
        const newCrop = { 
          x: constrainedX, 
          y: constrainedY, 
          width: Math.max(10, constrainedSize), 
          height: Math.max(10, constrainedSize) 
        };
        
        setCropArea(newCrop);
        setCropResizing('se');
        setCropResizeStart({ x: e.clientX, y: e.clientY, crop: newCrop });
      }
    } else if (!isCropping && scale > 1) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isCropping && cropResizing !== 'none' && cropResizeStart && cropArea && imageRef.current && imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const imgRect = imageRef.current.getBoundingClientRect();
      const scaleX = imageRef.current.naturalWidth / imgRect.width;
      const scaleY = imageRef.current.naturalHeight / imgRect.height;

      const deltaX = (e.clientX - cropResizeStart.x) * scaleX;
      const deltaY = (e.clientY - cropResizeStart.y) * scaleY;

      let newCrop = { ...cropResizeStart.crop };

      if (cropResizing === 'move') {
        // Constrain to image bounds
        newCrop.x = Math.max(0, Math.min(imageRef.current.naturalWidth - newCrop.width, newCrop.x + deltaX));
        newCrop.y = Math.max(0, Math.min(imageRef.current.naturalHeight - newCrop.height, newCrop.y + deltaY));
      } else {
        // Resize based on handle, always keeping within image bounds
        if (cropResizing.includes('n')) {
          const newY = Math.max(0, newCrop.y + deltaY);
          const newHeight = newCrop.height - (newY - newCrop.y);
          if (newHeight >= 10 && newY >= 0) {
            newCrop.y = newY;
            newCrop.height = newHeight;
          }
        }
        if (cropResizing.includes('s')) {
          const maxHeight = imageRef.current.naturalHeight - newCrop.y;
          newCrop.height = Math.max(10, Math.min(maxHeight, newCrop.height + deltaY));
        }
        if (cropResizing.includes('w')) {
          const newX = Math.max(0, newCrop.x + deltaX);
          const newWidth = newCrop.width - (newX - newCrop.x);
          if (newWidth >= 10 && newX >= 0) {
            newCrop.x = newX;
            newCrop.width = newWidth;
          }
        }
        if (cropResizing.includes('e')) {
          const maxWidth = imageRef.current.naturalWidth - newCrop.x;
          newCrop.width = Math.max(10, Math.min(maxWidth, newCrop.width + deltaX));
        }
      }

      // Final bounds check - ensure crop never goes outside image
      newCrop.x = Math.max(0, Math.min(imageRef.current.naturalWidth - newCrop.width, newCrop.x));
      newCrop.y = Math.max(0, Math.min(imageRef.current.naturalHeight - newCrop.height, newCrop.y));
      newCrop.width = Math.max(10, Math.min(imageRef.current.naturalWidth - newCrop.x, newCrop.width));
      newCrop.height = Math.max(10, Math.min(imageRef.current.naturalHeight - newCrop.y, newCrop.height));

      setCropArea(newCrop);
    } else if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // If we were resizing crop, add to history
    if (cropResizing !== 'none' && cropArea) {
      if (imageRef.current) {
        addToHistory(imageRef.current.src, adjustments, cropArea);
        lastHistoryStateRef.current = { adjustments, cropArea };
      }
    }
    
    setCropResizing('none');
    setCropResizeStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom when over the image container, prevent page zoom
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => Math.max(0.5, Math.min(5, prev + delta)));
    }
  };

  // Improved and accurate adjustment algorithms
  const applyAdjustments = (imageData: ImageData, adj: ImageAdjustments): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;
      const a = data[i + 3];

      // Brightness (linear, applied first)
      const brightnessFactor = 1 + (adj.brightness / 100);
      r = Math.max(0, Math.min(1, r * brightnessFactor));
      g = Math.max(0, Math.min(1, g * brightnessFactor));
      b = Math.max(0, Math.min(1, b * brightnessFactor));

      // Exposure (gamma-like, applied after brightness)
      const exposureFactor = Math.pow(2, adj.exposure / 100);
      r = Math.max(0, Math.min(1, r * exposureFactor));
      g = Math.max(0, Math.min(1, g * exposureFactor));
      b = Math.max(0, Math.min(1, b * exposureFactor));

      // Contrast (centered around 0.5)
      const contrastFactor = (100 + adj.contrast) / 100;
      r = Math.max(0, Math.min(1, ((r - 0.5) * contrastFactor) + 0.5));
      g = Math.max(0, Math.min(1, ((g - 0.5) * contrastFactor) + 0.5));
      b = Math.max(0, Math.min(1, ((b - 0.5) * contrastFactor) + 0.5));

      // Convert to HSL for saturation adjustment
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      const lightness = (max + min) / 2;
      let saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
      
      // Apply saturation adjustment
      const saturationFactor = 1 + (adj.saturation / 100);
      saturation = Math.max(0, Math.min(1, saturation * saturationFactor));

      // Convert back to RGB
      if (delta !== 0) {
        const c = saturation * (1 - Math.abs(2 * lightness - 1));
        let hue = 0;
        if (max === r) {
          hue = ((g - b) / delta) % 6;
        } else if (max === g) {
          hue = (b - r) / delta + 2;
        } else {
          hue = (r - g) / delta + 4;
        }
        hue = hue / 6;
        
        const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
        const m = lightness - c / 2;

        let newR = 0, newG = 0, newB = 0;
        if (hue < 1/6) {
          newR = c; newG = x; newB = 0;
        } else if (hue < 2/6) {
          newR = x; newG = c; newB = 0;
        } else if (hue < 3/6) {
          newR = 0; newG = c; newB = x;
        } else if (hue < 4/6) {
          newR = 0; newG = x; newB = c;
        } else if (hue < 5/6) {
          newR = x; newG = 0; newB = c;
        } else {
          newR = c; newG = 0; newB = x;
        }

        r = newR + m;
        g = newG + m;
        b = newB + m;
      }

      // Highlights and Shadows (tone curve based on luminance)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance > 0.5) {
        // Highlights
        const highlightAmount = adj.highlights / 100;
        const factor = 1 + (highlightAmount * (luminance - 0.5) * 2);
        r = Math.max(0, Math.min(1, r * factor));
        g = Math.max(0, Math.min(1, g * factor));
        b = Math.max(0, Math.min(1, b * factor));
      } else {
        // Shadows
        const shadowAmount = adj.shadows / 100;
        const factor = 1 + (shadowAmount * (0.5 - luminance) * 2);
        r = Math.max(0, Math.min(1, r * factor));
        g = Math.max(0, Math.min(1, g * factor));
        b = Math.max(0, Math.min(1, b * factor));
      }

      // Temperature (warm/cool color balance)
      const tempFactor = adj.temperature / 100;
      // Warm (tempFactor > 0): increases red, decreases blue
      // Cool (tempFactor < 0): decreases red, increases blue
      r = Math.max(0, Math.min(1, r + tempFactor * 0.15));
      b = Math.max(0, Math.min(1, b - tempFactor * 0.15));

      // Tint (green/magenta)
      const tintFactor = adj.tint / 100;
      if (tintFactor > 0) {
        // Magenta (increase red and blue)
        r = Math.max(0, Math.min(1, r + tintFactor * 0.1));
        b = Math.max(0, Math.min(1, b + tintFactor * 0.1));
      } else {
        // Green (increase green)
        g = Math.max(0, Math.min(1, g - tintFactor * 0.1));
      }

      // Convert back to 0-255 range
      data[i] = Math.round(r * 255);
      data[i + 1] = Math.round(g * 255);
      data[i + 2] = Math.round(b * 255);
      data[i + 3] = a;
    }

    return new ImageData(data, width, height);
  };

  const updateImageInStore = async (blob: Blob, imageId: string) => {
    // Convert blob to File
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    const fileName = image.file.name;
    const fileType = image.file.type || 'image/png';
    const editedFile = new File([blob], fileName, { type: fileType });

    // Convert blob to base64 for persistence
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Create new preview URL
    const newPreview = URL.createObjectURL(blob);
    
    // Revoke old preview URL if it's a blob
    if (image.preview.startsWith('blob:')) {
      URL.revokeObjectURL(image.preview);
    }

    // Update image in store directly using getState and setState
    const store = useMetadataStore.getState();
    const updatedImages = store.images.map((img) => {
      if (img.id === imageId) {
        const updated = {
          ...img,
          file: editedFile,
          preview: newPreview,
          publicUrl: newPreview
        } as any;
        // Store base64Data for persistence
        (updated as any).base64Data = base64;
        return updated;
      }
      return img;
    });
    
    // Update store state
    useMetadataStore.setState({ images: updatedImages });

    // Save to localStorage
    await store.saveUserData();
  };

  const applyAllEdits = async (adj: ImageAdjustments, crop: CropArea | null): Promise<void> => {
    if (!imageRef.current || !adjustmentCanvasRef.current) return Promise.resolve();

    const img = imageRef.current;
    const canvas = adjustmentCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve();

    const hasAdjustments = Object.values(adj).some(val => val !== 0) || crop !== null;

    if (!hasAdjustments) {
      // No adjustments, restore original
      if (originalImageBlob) {
        const blobUrl = URL.createObjectURL(originalImageBlob);
        img.src = blobUrl;
        return Promise.resolve();
      } else if (originalImageSrc) {
        img.src = originalImageSrc;
        return Promise.resolve();
      }
      return Promise.resolve();
    }

    // Load original image
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      tempImg.onload = () => resolve();
      tempImg.onerror = reject;
      if (originalImageBlob) {
        tempImg.src = URL.createObjectURL(originalImageBlob);
      } else {
        tempImg.src = originalImageSrc;
      }
    });

    // Apply crop first if exists
    let sourceX = 0, sourceY = 0, sourceWidth = tempImg.width, sourceHeight = tempImg.height;
    if (crop) {
      sourceX = Math.max(0, Math.min(tempImg.width, crop.x));
      sourceY = Math.max(0, Math.min(tempImg.height, crop.y));
      sourceWidth = Math.max(1, Math.min(tempImg.width - sourceX, crop.width));
      sourceHeight = Math.max(1, Math.min(tempImg.height - sourceY, crop.height));
    }

    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    ctx.drawImage(tempImg, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

    // Apply adjustments
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const adjustedData = applyAdjustments(imageData, adj);
    ctx.putImageData(adjustedData, 0, 0);

    // Update image source and save
    return new Promise<void>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (blob && imageRef.current) {
          const url = URL.createObjectURL(blob);
          imageRef.current.src = url;
          
          // Update the image in the store
          const currentDefect = defects[currentIndex];
          await updateImageInStore(blob, currentDefect.image.id);
        }
        resolve();
      }, 'image/png');
    });
  };

  const applyCrop = async () => {
    if (!cropArea || !imageRef.current) return;
    
    // Ensure crop is within bounds before applying
    const constrainedCrop = {
      x: Math.max(0, Math.min(imageRef.current.naturalWidth - cropArea.width, cropArea.x)),
      y: Math.max(0, Math.min(imageRef.current.naturalHeight - cropArea.height, cropArea.y)),
      width: Math.max(10, Math.min(imageRef.current.naturalWidth - cropArea.x, cropArea.width)),
      height: Math.max(10, Math.min(imageRef.current.naturalHeight - cropArea.y, cropArea.height)),
    };
    
    setCropArea(constrainedCrop);
    await applyAllEdits(adjustments, constrainedCrop);
    setIsCropping(false);
    if (imageRef.current) {
      addToHistory(imageRef.current.src, adjustments, constrainedCrop);
      lastHistoryStateRef.current = { adjustments, cropArea: constrainedCrop };
    }
  };

  const addToHistory = (src: string, adj: ImageAdjustments, crop: CropArea | null) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ imageSrc: src, adjustments: { ...adj }, cropArea: crop ? { ...crop } : null });
      const newIndex = newHistory.length - 1;
      setHistoryIndex(newIndex);
      return newHistory.slice(-50); // Keep last 50 states
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setHistoryIndex(newIndex);
      setAdjustments(state.adjustments);
      setCropArea(state.cropArea);
      if (imageRef.current) {
        imageRef.current.src = state.imageSrc;
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setHistoryIndex(newIndex);
      setAdjustments(state.adjustments);
      setCropArea(state.cropArea);
      if (imageRef.current) {
        imageRef.current.src = state.imageSrc;
      }
    }
  };

  const handleDelete = () => {
    if (!onDeleteImage) return;
    const currentDefect = defects[currentIndex];
    onDeleteImage(currentDefect.defectId);
    
    if (defects.length > 1 && currentIndex >= defects.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  useEffect(() => {
    if (defects.length === 0) {
      onClose(currentIndex);
    } else if (currentIndex >= defects.length) {
      setCurrentIndex(Math.max(0, defects.length - 1));
    }
  }, [defects.length, currentIndex, onClose]);

  if (defects.length === 0) {
    return null;
  }

  const currentDefect = defects[currentIndex];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Calculate crop overlay position - fixed to account for image transform
  const getCropOverlayStyle = () => {
    if (!cropArea || !imageRef.current || !imageRef.current.complete) return null;
    
    // Get the image's displayed dimensions
    const imgRect = imageRef.current.getBoundingClientRect();
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    
    if (naturalWidth === 0 || naturalHeight === 0) return null;
    
    // Calculate scale factors from natural to displayed size
    const scaleX = imgRect.width / naturalWidth;
    const scaleY = imgRect.height / naturalHeight;

    // Constrain crop to image bounds (safety check for display)
    const constrainedCrop = {
      x: Math.max(0, Math.min(naturalWidth - cropArea.width, cropArea.x)),
      y: Math.max(0, Math.min(naturalHeight - cropArea.height, cropArea.y)),
      width: Math.max(10, Math.min(naturalWidth - cropArea.x, cropArea.width)),
      height: Math.max(10, Math.min(naturalHeight - cropArea.y, cropArea.height)),
    };

    // Position relative to the image itself (which is inside the transform div)
    // The overlay will be positioned absolutely within the same transform container as the image
    return {
      left: `${constrainedCrop.x * scaleX}px`,
      top: `${constrainedCrop.y * scaleY}px`,
      width: `${constrainedCrop.width * scaleX}px`,
      height: `${constrainedCrop.height * scaleY}px`,
    };
  };

  const cropOverlayStyle = getCropOverlayStyle();

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-full max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm text-slate-500 dark:text-gray-400">
                Image {currentIndex + 1} of {defects.length}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 border-r border-slate-200 dark:border-gray-700 pr-2 mr-2">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={20} className="text-slate-600 dark:text-gray-300" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={20} className="text-slate-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 border-r border-slate-200 dark:border-gray-700 pr-2 mr-2">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={20} className="text-slate-600 dark:text-gray-300" />
              </button>
              <span className="text-sm text-slate-600 dark:text-gray-400 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={20} className="text-slate-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Adjustments Toggle */}
            <button
              onClick={() => setShowAdjustments(!showAdjustments)}
              className={`p-2 rounded-lg transition-colors ${
                showAdjustments
                  ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300'
              }`}
              title="Image Adjustments"
            >
              <Settings2 size={20} />
            </button>

            {/* Crop */}
            <button
              onClick={() => {
                setIsCropping(!isCropping);
                if (!isCropping && !cropArea && imageRef.current) {
                  // Initialize crop to center square, constrained to image bounds
                  const maxSize = Math.min(imageRef.current.naturalWidth, imageRef.current.naturalHeight);
                  const size = maxSize * 0.6;
                  const x = Math.max(0, Math.min(imageRef.current.naturalWidth - size, (imageRef.current.naturalWidth - size) / 2));
                  const y = Math.max(0, Math.min(imageRef.current.naturalHeight - size, (imageRef.current.naturalHeight - size) / 2));
                  const constrainedSize = Math.min(size, imageRef.current.naturalWidth - x, imageRef.current.naturalHeight - y);
                  setCropArea({ 
                    x, 
                    y, 
                    width: Math.max(10, constrainedSize), 
                    height: Math.max(10, constrainedSize) 
                  });
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                isCropping
                  ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300'
              }`}
              title="Crop Image"
            >
              <Crop size={20} />
            </button>

            {isCropping && cropArea && (
              <button
                onClick={applyCrop}
                className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Apply Crop
              </button>
            )}

            <button
              onClick={handleReset}
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Reset All"
            >
              <RotateCcw size={20} className="text-slate-600 dark:text-gray-300" />
            </button>

            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
              title="Remove image from defect"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={() => onClose(currentIndex)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={24} className="text-slate-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Image Adjustments Panel */}
        {showAdjustments && (
          <div className="border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 p-4 overflow-x-auto">
            <div className="flex gap-6 flex-wrap">
              {(['brightness', 'contrast', 'saturation', 'exposure', 'highlights', 'shadows', 'temperature', 'tint'] as const).map((key) => (
                <div key={key} className="flex flex-col gap-2 min-w-[140px]">
                  <label className="text-xs font-medium text-slate-600 dark:text-gray-400 capitalize">
                    {key}
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={adjustments[key]}
                      onChange={(e) => handleAdjustmentChange(key, Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-with-zero"
                      style={{
                        background: `linear-gradient(to right, 
                          rgb(203 213 225) 0%, 
                          rgb(203 213 225) calc(50% - 1px), 
                          rgb(59 130 246) calc(50% - 1px), 
                          rgb(59 130 246) calc(50% + 1px), 
                          rgb(203 213 225) calc(50% + 1px), 
                          rgb(203 213 225) 100%)`
                      }}
                    />
                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-slate-400 dark:bg-gray-500 -translate-x-1/2 pointer-events-none z-10" />
                    <span className="text-xs text-slate-600 dark:text-gray-400 w-10 text-right mt-1 block ml-auto">
                      {adjustments[key]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image and Description Container */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Image Section with Navigation Arrows */}
          <div 
            ref={imageContainerRef}
            className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-gray-800 p-4 overflow-hidden relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isCropping ? 'crosshair' : scale > 1 ? 'grab' : 'default' }}
          >
            {/* Left Navigation Arrow */}
            {defects.length > 1 && (
              <button
                onClick={handlePrevious}
                className="absolute left-4 z-10 p-3 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={defects.length <= 1}
              >
                <ChevronLeft size={28} className="text-slate-600 dark:text-gray-300" />
              </button>
            )}

            {/* Image Container */}
            <div
              className="relative w-full h-full flex items-center justify-center overflow-auto"
              onWheel={handleWheel}
            >
              <div
                className="relative"
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  transition: isDragging ? 'none' : 'transform 0.1s',
                  willChange: 'transform',
                }}
              >
                <img
                  ref={imageRef}
                  src={currentDefect.image.preview}
                  alt={`Photo ${currentDefect.photoNumber}`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg select-none"
                  draggable="false"
                  style={{ maxHeight: 'calc(90vh - 200px)' }}
                />
                
                {/* Resizable Crop Overlay - positioned absolutely relative to image (same container as img) */}
                {isCropping && cropOverlayStyle && (
                  <div
                    ref={cropOverlayRef}
                    className="absolute border-2 border-indigo-500 bg-indigo-500/10"
                    style={{ 
                      ...cropOverlayStyle, 
                      pointerEvents: 'auto'
                    }}
                  >
                    {/* Resize Handles */}
                    <div 
                      className="absolute -top-1 -left-1 w-3 h-3 bg-indigo-500 border border-white rounded-full cursor-nw-resize z-20" 
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setCropResizing('nw');
                        if (cropArea) {
                          setCropResizeStart({ x: e.clientX, y: e.clientY, crop: { ...cropArea } });
                        }
                      }}
                    />
                    <div 
                      className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 border border-white rounded-full cursor-ne-resize z-20"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setCropResizing('ne');
                        if (cropArea) {
                          setCropResizeStart({ x: e.clientX, y: e.clientY, crop: { ...cropArea } });
                        }
                      }}
                    />
                    <div 
                      className="absolute -bottom-1 -left-1 w-3 h-3 bg-indigo-500 border border-white rounded-full cursor-sw-resize z-20"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setCropResizing('sw');
                        if (cropArea) {
                          setCropResizeStart({ x: e.clientX, y: e.clientY, crop: { ...cropArea } });
                        }
                      }}
                    />
                    <div 
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-500 border border-white rounded-full cursor-se-resize z-20"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setCropResizing('se');
                        if (cropArea) {
                          setCropResizeStart({ x: e.clientX, y: e.clientY, crop: { ...cropArea } });
                        }
                      }}
                    />
                    <div 
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500 border border-white rounded-full cursor-n-resize z-20"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setCropResizing('n');
                        if (cropArea) {
                          setCropResizeStart({ x: e.clientX, y: e.clientY, crop: { ...cropArea } });
                        }
                      }}
                    />
                    <div 
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500 border border-white rounded-full cursor-s-resize z-20"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setCropResizing('s');
                        if (cropArea) {
                          setCropResizeStart({ x: e.clientX, y: e.clientY, crop: { ...cropArea } });
                        }
                      }}
                    />
                    <div 
                      className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-500 border border-white rounded-full cursor-w-resize z-20"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setCropResizing('w');
                        if (cropArea) {
                          setCropResizeStart({ x: e.clientX, y: e.clientY, crop: { ...cropArea } });
                        }
                      }}
                    />
                    <div 
                      className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-500 border border-white rounded-full cursor-e-resize z-20"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setCropResizing('e');
                        if (cropArea) {
                          setCropResizeStart({ x: e.clientX, y: e.clientY, crop: { ...cropArea } });
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Navigation Arrow */}
            {defects.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-4 z-10 p-3 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={defects.length <= 1}
              >
                <ChevronRight size={28} className="text-slate-600 dark:text-gray-300" />
              </button>
            )}

            {/* Hidden Canvases */}
            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={adjustmentCanvasRef} className="hidden" />
          </div>

          {/* Description Section */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">
                  Photo Number
                </h3>
                <p className="text-xl font-semibold text-slate-800 dark:text-white">
                  {currentDefect.photoNumber}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">
                  Description
                </h3>
                <p className="text-base text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
                  {currentDefect.description || 'No description'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">
                  File Name
                </h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 break-all">
                  {currentDefect.image.file.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {defects.length > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
            <div className="flex gap-2 justify-center">
              {defects.map((defect, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
                      : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
                  }`}
                >
                  <img
                    src={defect.image.preview}
                    alt={`Thumbnail ${defect.photoNumber}`}
                    className="w-full h-full object-cover"
                    draggable="false"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
