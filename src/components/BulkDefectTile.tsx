import React, { useCallback } from 'react';
import { X, ChevronDown, Search, PlusCircle, Maximize2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { filterImagesByQuery } from '../utils/imageFiltering';
import type { ImageMetadata, BulkDefect } from '../types';

interface BulkDefectTileProps {
  defect: BulkDefect;
  images: ImageMetadata[];
  activeDragId?: string | null;
  overDragId?: string | null;

  // Selector state
  isSelectorOpen: boolean;
  searchQuery: string;
  focusedIndex: number;

  // Callbacks
  onSelectorOpen: (photoNumber: string | null) => void;
  onSearchQueryChange: (photoNumber: string, query: string) => void;
  onFocusedIndexChange: (photoNumber: string, index: number | null) => void;
  onDelete: (photoNumber: string) => void;
  onAddBelow: (photoNumber: string) => void;
  onImageClick: (photoNumber: string) => void;
  onFileSelect: (photoNumber: string, fileName: string) => void;

  // Scroll refs
  scrollPositionRefs: React.MutableRefObject<Record<string, { element: HTMLElement; position: number }>>;
  isScrollingRef: React.MutableRefObject<Record<string, boolean>>;
  scrollTimeoutRefs: React.MutableRefObject<Record<string, NodeJS.Timeout>>;

  // Render function for description field
  renderDescriptionField: (defect: BulkDefect) => React.ReactNode;

  // Function to get image for defect
  getImageForDefect: (fileName: string) => ImageMetadata | undefined;
}

export const BulkDefectTile: React.FC<BulkDefectTileProps> = React.memo(({
  defect,
  images,
  activeDragId,
  overDragId,
  isSelectorOpen,
  searchQuery,
  focusedIndex,
  onSelectorOpen,
  onSearchQueryChange,
  onFocusedIndexChange,
  onDelete,
  onAddBelow,
  onImageClick,
  onFileSelect,
  scrollPositionRefs,
  isScrollingRef,
  scrollTimeoutRefs,
  renderDescriptionField,
  getImageForDefect,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: defect.photoNumber,
    disabled: false,
  });

  const {
    setNodeRef: setDroppableRef,
    isOver,
  } = useDroppable({
    id: defect.photoNumber,
  });

  const image = getImageForDefect(defect.selectedFile || '');

  // Filter images based on search query
  const filteredImages = React.useMemo(() => {
    return filterImagesByQuery(images, searchQuery);
  }, [images, searchQuery]);

  // Create custom listeners that exclude interactive elements
  const customListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('.image-selector-dropdown') ||
        target.closest('[data-defect-id]')) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      const tileElement = e.currentTarget as HTMLElement;
      const bottomSection = tileElement.querySelector('.p-2.space-y-1');
      if (bottomSection && bottomSection.contains(target)) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      if (isSelectorOpen) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      if (listeners?.onPointerDown) {
        listeners.onPointerDown(e);
      }
    },
    onMouseDown: (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.image-selector-dropdown') ||
        target.closest('[data-defect-id]') ||
        target.closest('.p-2.space-y-1') ||
        isSelectorOpen) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      if (listeners?.onMouseDown) {
        (listeners.onMouseDown as any)(e);
      }
    },
  };

  // Combine refs for both sortable and droppable
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    setDroppableRef(node);
  }, [setNodeRef, setDroppableRef]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(defect.photoNumber);
  }, [defect.photoNumber, onDelete]);

  const handleAddBelowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onAddBelow(defect.photoNumber);
  }, [defect.photoNumber, onAddBelow]);

  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onImageClick(defect.photoNumber);
  }, [defect.photoNumber, onImageClick]);

  const handleSelectorToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelectorOpen) {
      onSelectorOpen(null);
    } else {
      onSelectorOpen(defect.photoNumber);
    }
  }, [isSelectorOpen, defect.photoNumber, onSelectorOpen]);

  const handleSelectNone = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(defect.photoNumber, '');
    onSelectorOpen(null);
    onSearchQueryChange(defect.photoNumber, '');
  }, [defect.photoNumber, onFileSelect, onSelectorOpen, onSearchQueryChange]);

  const handleFileSelect = useCallback((fileName: string) => {
    React.startTransition(() => {
      onFileSelect(defect.photoNumber, fileName);
      onSelectorOpen(null);
      onSearchQueryChange(defect.photoNumber, '');
      onFocusedIndexChange(defect.photoNumber, null);
    });
  }, [defect.photoNumber, onFileSelect, onSelectorOpen, onSearchQueryChange, onFocusedIndexChange]);

  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const stopPropagationAndPrevent = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  return (
    <div
      ref={combinedRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : (transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)'),
        opacity: isDragging ? 0.4 : 1,
        contain: isSelectorOpen ? 'layout style' : 'layout style paint',
        isolation: 'isolate',
        willChange: isSelectorOpen ? 'auto' : 'transform',
      }}
      className={`group flex flex-col bg-neutral-50 dark:bg-neutral-800 rounded-lg overflow-visible transition-opacity duration-200 relative border border-neutral-200 dark:border-neutral-700 ${isDragging
        ? 'shadow-large ring-2 ring-neutral-900 dark:ring-neutral-100 ring-opacity-50 z-50 cursor-grabbing'
        : (overDragId === defect.photoNumber && activeDragId && activeDragId !== defect.photoNumber)
          ? 'ring-2 ring-neutral-900 dark:ring-neutral-100 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 shadow-medium scale-[1.02] border-2'
          : isSelectorOpen
            ? 'cursor-default z-[1000]'
            : 'cursor-grab'
        }`}
      {...attributes}
      {...customListeners}
    >
      {/* Delete button */}
      <div className="absolute top-2 left-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity" style={{ pointerEvents: 'auto' }}>
        <button
          onClick={handleDeleteClick}
          onMouseDown={stopPropagationAndPrevent}
          className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-lg"
          title="Delete tile"
        >
          <X size={16} />
        </button>
      </div>

      {/* Add button */}
      <div className="absolute bottom-2 right-2 z-40" style={{ pointerEvents: 'auto' }}>
        <button
          onClick={handleAddBelowClick}
          onMouseDown={stopPropagationAndPrevent}
          className="p-2 bg-black dark:bg-neutral-800 hover:bg-neutral-900 dark:hover:bg-neutral-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-110"
          title="Add tile below"
        >
          <PlusCircle size={16} />
        </button>
      </div>

      {/* Image section */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg">
        {image ? (
          <>
            <img
              src={image.preview}
              alt={image.file.name}
              className="w-full h-full object-cover cursor-grab hover:opacity-95 transition-opacity select-none"
              draggable="false"
            />
            <button
              onClick={handleExpandClick}
              onMouseDown={stopPropagationAndPrevent}
              className="absolute bottom-2 right-2 bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-30"
              title="Expand image"
              style={{ pointerEvents: 'auto' }}
            >
              <Maximize2 size={16} />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 text-xs">
            No image
          </div>
        )}
        {defect.photoNumber && (
          <div className="absolute top-2 right-2 bg-[#28323C] w-6 h-6 rounded-full flex items-center justify-center z-30">
            <span className="text-white text-sm font-semibold">{defect.photoNumber}</span>
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div
        className="p-2 space-y-1 flex-shrink-0 relative z-10 pb-2"
        onClick={stopPropagation}
        onMouseDown={stopPropagationAndPrevent}
        onPointerDown={stopPropagationAndPrevent}
        style={{ pointerEvents: 'auto', overflow: 'visible' }}
      >
        {/* Image selector dropdown */}
        <div className="relative z-[100]">
          <button
            onClick={handleSelectorToggle}
            onMouseDown={stopPropagationAndPrevent}
            onPointerDown={stopPropagationAndPrevent}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-colors font-medium ${defect.selectedFile
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
              }`}
          >
            <div className="flex-1 text-left truncate">
              {defect.selectedFile || 'Select image'}
            </div>
            <ChevronDown size={14} className={isSelectorOpen ? 'rotate-180' : ''} />
          </button>

          {isSelectorOpen && (
            <div
              className="image-selector-dropdown absolute left-0 right-0 mt-1 w-full max-h-[500px] overflow-visible bg-white dark:bg-neutral-900 rounded-lg shadow-large border border-neutral-200 dark:border-neutral-800 flex flex-col"
              data-defect-id={defect.photoNumber}
              onClick={stopPropagationAndPrevent}
              onMouseDown={stopPropagationAndPrevent}
              onPointerDown={stopPropagationAndPrevent}
              onWheel={(e) => {
                e.stopPropagation();
                (e.nativeEvent as any).stopImmediatePropagation?.();
              }}
              onScroll={(e) => {
                e.stopPropagation();
                (e.nativeEvent as any).stopImmediatePropagation?.();
              }}
              style={{
                pointerEvents: 'auto',
                contain: 'layout style',
                position: 'absolute',
                zIndex: 1001,
              }}
            >
              {/* Search Input */}
              <div className="p-2 border-b border-neutral-200 dark:border-neutral-800">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      onSearchQueryChange(defect.photoNumber, e.target.value);
                      if (!e.target.value) {
                        onFocusedIndexChange(defect.photoNumber, null);
                      }
                    }}
                    placeholder="Search by title or last 4 digits..."
                    className="w-full pl-9 pr-3 py-2 text-xs border-0 bg-transparent dark:bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-0"
                    autoFocus
                    onClick={stopPropagation}
                    onMouseDown={stopPropagation}
                    onPointerDown={stopPropagation}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        onSelectorOpen(null);
                        onFocusedIndexChange(defect.photoNumber, null);
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const indexToSelect = focusedIndex >= 0 ? focusedIndex : 0;
                        if (filteredImages[indexToSelect]) {
                          handleFileSelect(filteredImages[indexToSelect].file.name);
                        }
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        onFocusedIndexChange(defect.photoNumber, focusedIndex < filteredImages.length - 1 ? focusedIndex + 1 : focusedIndex);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        onFocusedIndexChange(defect.photoNumber, focusedIndex > 0 ? focusedIndex - 1 : -1);
                      }
                    }}
                  />
                </div>
              </div>

              {/* File List */}
              <div
                ref={(node) => {
                  if (node) {
                    const defectId = defect.photoNumber;
                    if (!scrollPositionRefs.current[defectId]) {
                      scrollPositionRefs.current[defectId] = { element: node, position: 0 };
                    } else {
                      scrollPositionRefs.current[defectId].element = node;
                      if (scrollPositionRefs.current[defectId].position > 0) {
                        requestAnimationFrame(() => {
                          node.scrollTop = scrollPositionRefs.current[defectId].position;
                        });
                      }
                    }
                  }
                }}
                className="overflow-y-auto max-h-[180px] scrollbar-thin"
                style={{
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  isolation: 'isolate',
                  contain: 'layout style',
                  willChange: 'scroll-position'
                }}
                onWheel={(e) => {
                  const defectId = defect.photoNumber;
                  isScrollingRef.current[defectId] = true;
                  e.stopPropagation();
                  if (scrollTimeoutRefs.current[defectId]) {
                    clearTimeout(scrollTimeoutRefs.current[defectId]);
                  }
                  scrollTimeoutRefs.current[defectId] = setTimeout(() => {
                    isScrollingRef.current[defectId] = false;
                  }, 150);
                }}
                onScroll={(e) => {
                  const defectId = defect.photoNumber;
                  isScrollingRef.current[defectId] = true;
                  const scrollTop = e.currentTarget.scrollTop;
                  if (scrollPositionRefs.current[defectId]) {
                    scrollPositionRefs.current[defectId].position = scrollTop;
                    scrollPositionRefs.current[defectId].element = e.currentTarget;
                  } else {
                    scrollPositionRefs.current[defectId] = { element: e.currentTarget, position: scrollTop };
                  }
                  e.stopPropagation();
                  (e.nativeEvent as any).stopImmediatePropagation?.();
                  if (scrollTimeoutRefs.current[defectId]) {
                    clearTimeout(scrollTimeoutRefs.current[defectId]);
                  }
                  scrollTimeoutRefs.current[defectId] = setTimeout(() => {
                    isScrollingRef.current[defectId] = false;
                  }, 150);
                }}
                onMouseDown={stopPropagationAndPrevent}
                onPointerDown={stopPropagationAndPrevent}
                onTouchStart={stopPropagation}
                onTouchMove={stopPropagation}
              >
                {/* None option */}
                <button
                  onClick={handleSelectNone}
                  onMouseDown={stopPropagationAndPrevent}
                  onPointerDown={stopPropagationAndPrevent}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
                >
                  <div className="truncate">None</div>
                </button>

                {filteredImages.length > 0 ? (
                  filteredImages.map((img, index) => {
                    const isFocused = focusedIndex === index;
                    return (
                      <button
                        key={img.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleFileSelect(img.file.name);
                        }}
                        onMouseDown={stopPropagationAndPrevent}
                        onPointerDown={stopPropagationAndPrevent}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${img.file.name === defect.selectedFile
                          ? 'text-neutral-900 dark:text-neutral-100 font-semibold bg-neutral-100 dark:bg-neutral-800'
                          : isFocused
                            ? 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100'
                            : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                      >
                        <div className="truncate">{img.file.name}</div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-3 text-xs text-neutral-500 dark:text-neutral-400 text-center">
                    No photos found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Description field */}
        <div
          onMouseDown={stopPropagation}
          onClick={stopPropagation}
          onPointerDown={stopPropagation}
          className="pb-0 mb-0"
          style={{ pointerEvents: 'auto' }}
        >
          {renderDescriptionField(defect)}
        </div>
      </div>
    </div>
  );
});
