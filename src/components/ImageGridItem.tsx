import React, { useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDraggable } from '@dnd-kit/core';
import { useMetadataStore } from '../store/metadataStore';
import { Maximize2, Check } from 'lucide-react';
import { CompactImageViewer } from './CompactImageViewer';
import { ImageMetadata } from '../types';

interface ImageGridItemProps {
  images: ImageMetadata[];
  gridWidth: number;
}

// Component for draggable image - memoized to prevent unnecessary re-renders
const DraggableImage: React.FC<{
  img: ImageMetadata;
  isSelected: boolean;
  gridWidth: number;
  onToggle: () => void;
  onEnlarge: (imageId: string) => void;
  bulkDefectsCount: number;
}> = React.memo(({ img, isSelected, onToggle, onEnlarge, bulkDefectsCount }) => {
  const { bulkDefects } = useMetadataStore();

  // Automatically enable drag mode when tiles exist
  const isDragModeActive = bulkDefectsCount > 0;

  // Find ALL defects this image is assigned to
  const assignedDefects = isDragModeActive
    ? bulkDefects.filter(defect => defect.selectedFile === img.file.name)
    : [];

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `image-${img.id}`,
    data: {
      type: 'image',
      imageId: img.id,
      fileName: img.file.name,
    },
    disabled: !isDragModeActive, // Only draggable when tiles exist
  });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square cursor-pointer group touch-manipulation ${isDragging ? 'opacity-50 z-50' : ''
        } ${isDragModeActive ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={(e) => {
        // Disable selection when there are no tiles (bulkDefectsCount === 0)
        // Only allow selection when tiles exist
        if (bulkDefectsCount > 0 && !isDragModeActive) {
          const target = e.target as HTMLElement;
          if (!target.closest('button')) {
            onToggle();
          }
        }
      }}
      {...(isDragModeActive ? { ...listeners, ...attributes } : {})}
    >
      <div className={`relative rounded-lg overflow-hidden h-full ${!isDragModeActive && isSelected ? 'ring-2 ring-white' : ''
        } ${isDragModeActive && assignedDefects.length > 0 ? 'ring-2 ring-white' : ''}`}>
        <img
          src={img.preview}
          alt={img.file.name}
          className="w-full h-full object-cover select-none"
          loading="lazy"
          draggable="false"
        />
        {/* Show selected state - photo number with black background and white text */}
        {/* Only show when tiles exist - no selection when there are no tiles */}
        {isSelected && !isDragModeActive && bulkDefectsCount > 0 && (
          <div className="absolute top-2 right-2 bg-black rounded-full w-6 h-6 flex items-center justify-center">
            {img.photoNumber ? (
              <span className="text-white text-sm font-medium">{img.photoNumber}</span>
            ) : (
              <Check size={16} className="text-white" />
            )}
          </div>
        )}
        {/* Show ALL defect numbers when assigned to tiles - black background with white text */}
        {isDragModeActive && assignedDefects.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end max-w-[80%]">
            {assignedDefects.map(defect => (
              <div key={defect.photoNumber} className="bg-black rounded-full min-w-[24px] h-6 flex items-center justify-center px-1.5">
                <span className="text-white text-xs font-medium">{defect.photoNumber}</span>
              </div>
            ))}
          </div>
        )}
        {/* Show selected state when tiles exist but image is also selected */}
        {isSelected && isDragModeActive && assignedDefects.length === 0 && (
          <div className="absolute top-2 right-2 bg-black rounded-full w-6 h-6 flex items-center justify-center">
            {img.photoNumber ? (
              <span className="text-white text-sm font-medium">{img.photoNumber}</span>
            ) : (
              <Check size={16} className="text-white" />
            )}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1.5 text-xs truncate font-medium">
          {img.description || img.file.name}
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnlarge(img.id);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="absolute bottom-2 right-2 bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
            title="Expand and scroll through all images"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});

export const ImageGridItem: React.FC<ImageGridItemProps> = ({ images, gridWidth }) => {
  const { selectedImages, toggleImageSelection, bulkDefects } = useMetadataStore();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Memoize row count to prevent unnecessary recalculations
  const rowCount = React.useMemo(() => Math.ceil(images.length / gridWidth), [images.length, gridWidth]);
  
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 3,
    scrollMargin: 0,
  });

  // Handle opening viewer
  const handleOpenViewer = (imageId: string) => {
    const index = images.findIndex(img => img.id === imageId);
    if (index !== -1) {
      setViewerInitialIndex(index);
      setViewerOpen(true);
    }
  };


  return (
    <>
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
        style={{
          overscrollBehavior: 'contain', // Prevent scroll chaining but allow normal scrolling
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          minHeight: 0,
          // Ensure it fills the flex parent and maintains height
          height: '100%',
          // Prevent layout shifts
          contain: 'layout style',
        }}
        onWheel={(e) => {
          // Allow normal wheel scrolling
          e.stopPropagation();
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * gridWidth;
            const rowImages = images.slice(startIndex, startIndex + gridWidth);

            return (
              <div
                key={virtualRow.index}
                className="absolute top-0 left-0 w-full grid gap-2 p-2"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
                }}
              >
                {rowImages.map((img) => {
                  const isSelected = selectedImages.has(img.id);

                  return (
                    <DraggableImage
                      key={img.id}
                      img={img}
                      isSelected={isSelected}
                      gridWidth={gridWidth}
                      onToggle={() => toggleImageSelection(img.id)}
                      onEnlarge={handleOpenViewer}
                      bulkDefectsCount={bulkDefects.length}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {viewerOpen && images.length > 0 && (
        <CompactImageViewer
          images={images}
          initialIndex={viewerInitialIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
};
