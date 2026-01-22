import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ImageMetadata } from '../types';

interface CompactImageViewerProps {
  images: ImageMetadata[];
  initialIndex: number;
  onClose: () => void;
}

export const CompactImageViewer: React.FC<CompactImageViewerProps> = ({
  images,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const currentImage = images[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        resetView();
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        resetView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose]);

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Scroll up - zoom in
      setScale((prev) => Math.min(prev + 0.1, 3));
    } else {
      // Scroll down - zoom out
      setScale((prev) => Math.max(prev - 0.1, 0.5));
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetView();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetView();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-neutral-900"
      onClick={onClose}
    >
      {/* Compact viewer container - 80% of screen */}
      <div
        className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-5xl w-[90%] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {currentIndex + 1} / {images.length}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {currentImage.file.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-30 text-neutral-900 dark:text-neutral-100"
              title="Zoom out"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-sm text-neutral-700 dark:text-neutral-300 min-w-[4rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-30 text-neutral-900 dark:text-neutral-100"
              title="Zoom in"
            >
              <ZoomIn size={20} />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors ml-2 text-neutral-900 dark:text-neutral-100"
              title="Close (Esc)"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Image container */}
        <div
          className="flex-1 relative overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <img
            ref={imageRef}
            src={currentImage.preview}
            alt={currentImage.file.name}
            className="max-w-full max-h-full select-none transition-transform"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
            }}
            draggable="false"
          />

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-800 rounded-full shadow-lg transition-all hover:scale-110 text-neutral-900 dark:text-neutral-100"
                title="Previous (←)"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-800 rounded-full shadow-lg transition-all hover:scale-110 text-neutral-900 dark:text-neutral-100"
                title="Next (→)"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
