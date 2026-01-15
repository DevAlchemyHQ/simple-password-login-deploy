import React, { useState } from 'react';
import { ImageGrid } from '../ImageGrid';
import { SelectedImagesPanel } from '../SelectedImagesPanel';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useMetadataStore } from '../../store/metadataStore';

export const MainContent: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const { bulkDefects, setBulkDefects, updateBulkDefectFile, images, viewMode } = useMetadataStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    console.log('🚀 Drag Start:', {
      id: event.active.id,
      data: event.active.data.current,
      viewMode
    });
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    // Track which tile is being dragged over for visual feedback
    if (event.over) {
      setOverId(event.over.id);
      console.log('📍 Drag Over:', {
        activeId: event.active.id,
        overId: event.over.id,
        activeData: event.active.data.current,
        overData: event.over.data.current
      });
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    console.log('🏁 Drag End:', {
      activeId: active.id,
      activeData: active.data.current,
      overId: over?.id,
      overData: over?.data.current,
      viewMode
    });

    if (!over) {
      console.log('❌ No over target');
      setActiveId(null);
      return;
    }

    // Only process drops in batch drag mode
    if (viewMode !== 'text') {
      console.log('❌ Not in batch drag mode, viewMode:', viewMode);
      setActiveId(null);
      return;
    }

    // Handle image drop on defect
    if (active.data.current?.type === 'image') {
      const overId = over.id.toString();
      console.log('🖼️ Image drop detected, overId:', overId);
      
      if (overId.startsWith('drop-')) {
        const photoNumber = overId.replace('drop-', '');
        const fileName = active.data.current.fileName;
        const imageId = active.data.current.imageId;
        
        console.log('✅ Dropping image on defect:', {
          photoNumber,
          fileName,
          imageId
        });
        
        // Update the defect with the image
        updateBulkDefectFile(photoNumber, fileName);
        
        // Clear from selectedImages if it was selected
        const { selectedImages, toggleImageSelection } = useMetadataStore.getState();
        if (selectedImages.has(imageId)) {
          toggleImageSelection(imageId);
        }
        setActiveId(null);
        return;
      } else {
        console.log('❌ Over ID does not start with "drop-":', overId);
      }
    }
    
    // Handle defect reordering (only if dragging a defect, not an image)
    // Defects don't have active.data.current.type, images do
    if (!active.data.current?.type && active.id !== over.id && over) {
      const overId = over.id.toString();
      // Make sure we're not dropping on a drop zone (drop- prefix)
      // and that the over target is a defect photo number (not a drop zone)
      if (!overId.startsWith('drop-')) {
        console.log('🔄 Reordering defects:', {
          activeId: active.id,
          overId: over.id,
          activeData: active.data.current,
          currentDefects: bulkDefects.map(d => d.photoNumber)
        });
        
        // Use the current state directly to ensure we have the latest
        const currentDefects = bulkDefects;
        
        // Sort items by photo number first to ensure correct order
        const sortedItems = [...currentDefects].sort((a, b) => 
          parseInt(a.photoNumber || '0') - parseInt(b.photoNumber || '0')
        );
        
        // Find indices using the sorted array
        const oldIndex = sortedItems.findIndex((item) => item.photoNumber === active.id);
        const newIndex = sortedItems.findIndex((item) => item.photoNumber === over.id);

        console.log('🔍 Found indices:', {
          oldIndex,
          newIndex,
          activeId: active.id,
          overId: over.id,
          sortedPhotoNumbers: sortedItems.map(d => d.photoNumber),
          totalItems: sortedItems.length
        });

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          console.log('✅ Moving defect from index', oldIndex, 'to', newIndex);
          const newItems = arrayMove(sortedItems, oldIndex, newIndex);
          // Update photo numbers based on new order (1, 2, 3, etc.)
          const renumbered = newItems.map((item, index) => ({
            ...item,
            photoNumber: String(index + 1),
          }));
          console.log('📝 Renumbered defects:', renumbered.map((d, idx) => ({ 
            position: idx + 1,
            photoNumber: d.photoNumber,
            description: d.description.substring(0, 30) 
          })));
          
          // Update state immediately with the renumbered array
          setBulkDefects(renumbered);
          
          console.log('💾 State updated with renumbered defects:', renumbered.map(d => d.photoNumber));
        } else {
          console.log('❌ Invalid indices or same position:', {
            oldIndex,
            newIndex,
            areEqual: oldIndex === newIndex,
            oldIndexValid: oldIndex !== -1,
            newIndexValid: newIndex !== -1
          });
        }
      } else {
        console.log('❌ Over ID starts with "drop-", ignoring reorder');
      }
    }

    setActiveId(null);
    setOverId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
        // First try pointerWithin for better drop zone detection
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
          return pointerCollisions;
        }
        // Fallback to closestCenter for defect reordering
        return closestCenter(args);
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="lg:col-span-10 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden">
        {/* Image Grid - Hide when expanded */}
        {!isExpanded && (
          <div className="h-full overflow-hidden lg:col-span-6">
            <ImageGrid />
          </div>
        )}

        {/* Selected Images Panel - Expand to full width when expanded */}
        <div className={`h-full overflow-hidden transition-all duration-300 ${
          isExpanded ? 'lg:col-span-12' : 'lg:col-span-6'
        }`}>
          <SelectedImagesPanel 
            onExpand={() => setIsExpanded(!isExpanded)} 
            isExpanded={isExpanded}
            activeDragId={activeId}
            overDragId={overId}
          />
        </div>
      </div>
      <DragOverlay>
        {activeId && activeId.toString().startsWith('image-') ? (
          <div className="w-32 h-32 bg-white rounded-lg shadow-lg p-2">
            <img
              src={images.find(img => `image-${img.id}` === activeId)?.preview}
              alt="Dragging"
              className="w-full h-full object-cover rounded"
            />
          </div>
        ) : activeId && viewMode === 'text' && isExpanded && !activeId.toString().startsWith('image-') && !activeId.toString().startsWith('drop-') ? (
          // Show drag overlay for bulk defect tiles
          (() => {
            const draggedDefect = bulkDefects.find(d => d.photoNumber === activeId);
            const draggedImage = draggedDefect ? images.find(img => img.file.name === draggedDefect.selectedFile) : null;
            return (
              <div className="w-48 bg-slate-50 dark:bg-gray-700 rounded-lg shadow-2xl ring-4 ring-indigo-500 ring-opacity-75 overflow-hidden border-2 border-indigo-400">
                <div className="relative aspect-square">
                  {draggedImage ? (
                    <img
                      src={draggedImage.preview}
                      alt={draggedImage.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-gray-600 text-slate-400 dark:text-gray-500 text-xs">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <div className="text-xs text-slate-500 dark:text-gray-400 truncate mb-1">
                    {draggedImage?.file.name || 'No file selected'}
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-gray-300">
                    #{draggedDefect?.photoNumber || ''}
                  </div>
                  {draggedDefect?.description && (
                    <div className="text-xs text-slate-600 dark:text-gray-400 truncate mt-1">
                      {draggedDefect.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};