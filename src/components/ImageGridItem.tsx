import React, { useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDraggable } from '@dnd-kit/core';
import { useMetadataStore } from '../store/metadataStore';
import { Maximize2, Check } from 'lucide-react';
import { BatchDefectImageViewer } from './BatchDefectImageViewer';
import { ImageMetadata } from '../types';

interface ImageGridItemProps {
  images: ImageMetadata[];
  gridWidth: number;
}

// Component for draggable image
const DraggableImage: React.FC<{
  img: ImageMetadata;
  isSelected: boolean;
  gridWidth: number;
  onToggle: () => void;
  onEnlarge: (imageId: string) => void;
  bulkDefectsCount: number;
}> = ({ img, isSelected, onToggle, onEnlarge, bulkDefectsCount }) => {
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
      className={`relative aspect-square cursor-pointer group touch-manipulation ${
        isDragging ? 'opacity-50 z-50' : ''
      } ${isDragModeActive ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={isDragModeActive ? undefined : onToggle}
      {...(isDragModeActive ? { ...listeners, ...attributes } : {})}
    >
      <div className={`relative rounded-lg overflow-hidden h-full ${
        !isDragModeActive && isSelected ? 'ring-2 ring-indigo-500' : ''
      } ${isDragModeActive && assignedDefects.length > 0 ? 'ring-2 ring-indigo-500' : ''}`}>
        <img
          src={img.preview}
          alt={img.file.name}
          className="w-full h-full object-cover select-none"
          loading="lazy"
          draggable="false"
        />
        {/* Show selected state in single select mode (when no tiles exist) */}
        {!isDragModeActive && isSelected && (
          <div className="absolute top-2 right-2 bg-indigo-500 w-6 h-6 rounded-full flex items-center justify-center">
            {img.photoNumber ? (
              <span className="text-white text-sm font-medium">{img.photoNumber}</span>
            ) : (
              <Check size={16} className="text-white" />
            )}
          </div>
        )}
        {/* Show ALL defect numbers when assigned to tiles */}
        {isDragModeActive && assignedDefects.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end max-w-[80%]">
            {assignedDefects.map(defect => (
              <div key={defect.photoNumber} className="bg-indigo-500 min-w-[24px] h-6 rounded-full flex items-center justify-center px-1.5">
                <span className="text-white text-xs font-medium">{defect.photoNumber}</span>
              </div>
            ))}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1.5 text-xs truncate">
          {img.file.name}
        </div>
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnlarge(img.id);
            }}
            className="absolute bottom-2 right-2 bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            title="Expand and scroll through all images"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ImageGridItem: React.FC<ImageGridItemProps> = ({ images, gridWidth }) => {
  const { selectedImages, toggleImageSelection, bulkDefects, updateImageMetadata } = useMetadataStore();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(images.length / gridWidth),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

  // Prepare images for viewer (convert to defect-like structure)
  const imagesForViewer = React.useMemo(() => {
    return images.map((img, index) => ({
      photoNumber: `${index + 1}`,
      description: img.description || '',
      image: img,
      defectId: img.id
    }));
  }, [images]);

  // Handle opening viewer
  const handleOpenViewer = (imageId: string) => {
    const index = images.findIndex(img => img.id === imageId);
    if (index !== -1) {
      setViewerInitialIndex(index);
      setViewerOpen(true);
    }
  };

  // Handle description update from viewer
  const handleDescriptionUpdate = (imageId: string, description: string) => {
    updateImageMetadata(imageId, { description });
  };

  return (
    <>
      <div 
        ref={parentRef} 
        className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-thin"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
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

      {viewerOpen && imagesForViewer.length > 0 && (
        <BatchDefectImageViewer
          defects={imagesForViewer}
          initialIndex={viewerInitialIndex}
          onClose={() => setViewerOpen(false)}
          onDescriptionChange={handleDescriptionUpdate}
        />
      )}
    </>
  );
};