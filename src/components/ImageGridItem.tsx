import React, { useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDraggable } from '@dnd-kit/core';
import { useMetadataStore } from '../store/metadataStore';
import { Maximize2, Check } from 'lucide-react';
import { ImageZoom } from './ImageZoom';
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
  onEnlarge: () => void;
}> = ({ img, isSelected, onToggle, onEnlarge }) => {
  const { viewMode, bulkDefects } = useMetadataStore();
  
  // Find which defect this image is assigned to (in batch drag mode)
  const assignedDefect = viewMode === 'text' 
    ? bulkDefects.find(defect => defect.selectedFile === img.file.name)
    : null;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `image-${img.id}`,
    data: {
      type: 'image',
      imageId: img.id,
      fileName: img.file.name,
    },
    disabled: viewMode !== 'text', // Only draggable in batch drag mode
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
      } ${viewMode === 'text' ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={viewMode === 'text' ? undefined : onToggle}
      {...(viewMode === 'text' ? { ...listeners, ...attributes } : {})}
    >
      <div className={`relative rounded-lg overflow-hidden h-full ${
        viewMode === 'images' && isSelected ? 'ring-2 ring-indigo-500' : ''
      } ${viewMode === 'text' && assignedDefect ? 'ring-2 ring-indigo-500' : ''}`}>
        <img
          src={img.preview}
          alt={img.file.name}
          className="w-full h-full object-cover select-none"
          loading="lazy"
          draggable="false"
        />
        {/* Show selected state in single select mode */}
        {viewMode === 'images' && isSelected && (
          <div className="absolute top-2 right-2 bg-indigo-500 w-6 h-6 rounded-full flex items-center justify-center">
            {img.photoNumber ? (
              <span className="text-white text-sm font-medium">{img.photoNumber}</span>
            ) : (
              <Check size={16} className="text-white" />
            )}
          </div>
        )}
        {/* Show defect number in batch drag mode */}
        {viewMode === 'text' && assignedDefect && (
          <div className="absolute top-2 right-2 bg-indigo-500 w-6 h-6 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{assignedDefect.photoNumber}</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1.5 text-xs truncate">
          {img.file.name}
        </div>
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnlarge();
            }}
            className="absolute bottom-2 right-2 bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ImageGridItem: React.FC<ImageGridItemProps> = ({ images, gridWidth }) => {
  const { selectedImages, toggleImageSelection, viewMode } = useMetadataStore();
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(images.length / gridWidth),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

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
                      onEnlarge={() => setEnlargedImage(img.preview)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {enlargedImage && (
        <div className="fixed inset-0 bg-black/75 z-[9999] flex items-center justify-center">
          <ImageZoom
            src={enlargedImage}
            alt="Enlarged view"
            onClose={() => setEnlargedImage(null)}
          />
        </div>
      )}
    </>
  );
};