import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMetadataStore } from '../store/metadataStore';
import { X, Trash2, ArrowUpDown, AlertTriangle, Grid, List, Images, FileText, Plus, ChevronDown, ChevronUp, Search, GripVertical, PlusCircle, Trash, Info, CheckCircle2, Calendar, Maximize2 } from 'lucide-react';
import { BatchDefectImageViewer } from './BatchDefectImageViewer';
import { validateDescription } from '../utils/fileValidation';
import { BulkTextInput } from './BulkTextInput';
import type { ImageMetadata, SortDirection } from '../types';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useClickOutside, useClickOutsideSelector } from '../hooks/useClickOutside';
import { BulkDefectTile } from './BulkDefectTile';

const SortButton: React.FC<{
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}> = ({ direction, onChange }) => (
  <button
    onClick={() => onChange(
      direction === null ? 'asc' :
        direction === 'asc' ? 'desc' :
          null
    )}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${direction
      ? 'bg-black dark:bg-neutral-800 text-white'
      : 'text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    title={direction === null ? 'Enable sorting' : 'Change sort order'}
  >
    <ArrowUpDown
      size={16}
      className={`transition-transform ${direction === 'desc' ? 'rotate-180' : ''
        }`}
    />
    {direction && (
      <span className="text-sm">
        {direction === 'asc' ? 'Lowest to Highest' : 'Highest to Lowest'}
      </span>
    )}
  </button>
);

interface SelectedImagesPanelProps {
  onExpand: () => void;
  isExpanded: boolean;
  activeDragId?: string | null;
  overDragId?: string | null;
  activeTab?: 'images' | 'browser';
}

export const SelectedImagesPanel: React.FC<SelectedImagesPanelProps> = ({ onExpand, isExpanded, activeDragId, overDragId, activeTab = 'images' }) => {
  const {
    images,
    updateImageMetadata,
    dataRestoredFromStorage,
    defectSortDirection,
    setDefectSortDirection,
    bulkDefects,
    setBulkDefects,
    updateBulkDefectFile
  } = useMetadataStore();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [imageSelectorOpen, setImageSelectorOpen] = useState<string | null>(null);
  const [imageSearchQuery, setImageSearchQuery] = useState<Record<string, string>>({});
  const [focusedImageIndex, setFocusedImageIndex] = useState<Record<string, number>>({});
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [isDefectListPanelOpen, setIsDefectListPanelOpen] = useState(false);
  // Ref to preserve scroll positions across re-renders
  const scrollPositionRefs = React.useRef<Record<string, { element: HTMLElement; position: number }>>({});
  // Track if user is actively scrolling to prevent state updates
  const isScrollingRef = React.useRef<Record<string, boolean>>({});
  // Store scroll timeout IDs
  const scrollTimeoutRefs = React.useRef<Record<string, NodeJS.Timeout>>({});
  // Ref for defect list panel to detect clicks outside
  const defectListPanelRef = React.useRef<HTMLDivElement>(null);

  // Load defect list panel state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('defectListPanelOpen');
    if (savedState !== null) {
      setIsDefectListPanelOpen(JSON.parse(savedState));
    }
  }, []);

  // Save defect list panel state to localStorage
  useEffect(() => {
    localStorage.setItem('defectListPanelOpen', JSON.stringify(isDefectListPanelOpen));
  }, [isDefectListPanelOpen]);

  // Close selectors when clicking outside
  const closeImageSelector = useCallback(() => setImageSelectorOpen(null), []);
  useClickOutsideSelector('.image-selector-dropdown', closeImageSelector, !!imageSelectorOpen);

  // Close defect list panel when clicking outside
  const closeDefectListPanel = useCallback(() => setIsDefectListPanelOpen(false), []);
  useClickOutside(defectListPanelRef, closeDefectListPanel, isDefectListPanelOpen, {
    ignoreSelector: 'button[title*="defect list"]'
  });


  // Group bulk defects by date for batch drag mode
  const bulkDefectsByDate = useMemo(() => {
    const grouped: { [date: string]: typeof bulkDefects } = {};
    const noDate: typeof bulkDefects = [];

    bulkDefects.forEach(defect => {
      const img = images.find(i => i.file.name === defect.selectedFile);
      const date = img?.date;

      if (date) {
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(defect);
      } else {
        noDate.push(defect);
      }
    });

    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return { grouped, sortedDates, noDate };
  }, [bulkDefects, images]);

  const toggleDateCollapse = (date: string) => {
    setCollapsedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  // Helper function to get image for a defect
  const getImageForDefect = useCallback((selectedFile: string) => {
    return images.find(img => img.file.name === selectedFile);
  }, [images]);

  // Handle clicking on an image to open the viewer
  const handleImageClick = (photoNumber: string) => {
    const defectsWithImages = bulkDefects
      .filter(defect => defect.selectedFile)
      .sort((a, b) => parseInt(a.photoNumber) - parseInt(b.photoNumber));

    const index = defectsWithImages.findIndex(defect => defect.photoNumber === photoNumber);

    if (index !== -1) {
      setViewerInitialIndex(index);
      setViewerOpen(true);
    }
  };

  // Handle deleting image from viewer
  const handleDeleteImageFromDefect = (defectId: string) => {
    // Clear the selectedFile for this defect
    updateBulkDefectFile(defectId, '');

    // Get the updated state from the store (after the sync update above)
    const currentDefects = useMetadataStore.getState().bulkDefects;
    const remainingDefects = currentDefects.filter(defect => defect.selectedFile);

    // If this was the last image, close viewer
    if (remainingDefects.length === 0) {
      setViewerOpen(false);
    }
  };

  // Toggle defect list panel
  const toggleDefectListPanel = () => {
    setIsDefectListPanelOpen(!isDefectListPanelOpen);
  };

  // Handle copying defect list to clipboard
  const handleCopyDefectList = async () => {
    if (bulkDefects.length === 0) {
      alert('No defects to copy');
      return;
    }

    // Generate defect list: description - P1 format (NO zero padding)
    const defectList = bulkDefects
      .sort((a, b) => parseInt(a.photoNumber || '0') - parseInt(b.photoNumber || '0'))
      .map(defect => `${defect.description} - P${defect.photoNumber}`) // NO padding
      .join('\n');

    try {
      await navigator.clipboard.writeText(defectList);
      // Show success feedback
      alert(`Copied ${bulkDefects.length} defect${bulkDefects.length !== 1 ? 's' : ''} to clipboard!`);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  // Prepare defects for viewer
  const defectsForViewer = React.useMemo(() => {
    if (!viewerOpen) return [];

    const result = bulkDefects
      .filter(defect => defect.selectedFile)
      .sort((a, b) => parseInt(a.photoNumber) - parseInt(b.photoNumber))
      .map(defect => {
        const image = images.find(img => img.file.name === defect.selectedFile);
        if (!image) return null;
        return {
          photoNumber: defect.photoNumber,
          description: defect.description,
          image: image,
          defectId: defect.photoNumber
        };
      })
      .filter((item): item is { photoNumber: string; description: string; image: ImageMetadata; defectId: string } => item !== null);
    return result;
  }, [bulkDefects, images, viewerOpen]);

  const renderDescriptionField = (img: ImageMetadata) => {
    const { isValid, invalidChars } = validateDescription(img.description || '');

    return (
      <div>
        <textarea
          value={img.description}
          onChange={(e) => updateImageMetadata(img.id, { description: e.target.value })}
          maxLength={100}
          className={`w-full p-1.5 text-sm border rounded bg-white dark:bg-neutral-800 text-slate-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-y min-h-[60px] ${!isValid ? 'border-amber-300' : 'border-slate-200 dark:border-gray-600'
            }`}
          placeholder="Description"
        />
        <div className="flex items-center justify-between mt-1 text-xs">
          <div className="text-slate-400 dark:text-gray-500">
            {img.description?.length || 0}/100
          </div>
          {!isValid && invalidChars.length > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle size={12} />
              <span>
                Slashes not allowed: {invalidChars.join(' ')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Convert to a proper React component to preserve focus during re-renders
  const BulkDefectDescriptionField: React.FC<{ defect: typeof bulkDefects[0] }> = React.memo(({ defect }) => {
    const { isValid, invalidChars } = validateDescription(defect.description || '');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    // Use local state to avoid re-renders that cause focus loss
    const [localValue, setLocalValue] = React.useState(defect.description || '');
    const pendingUpdateRef = React.useRef<string | null>(null);

    // Sync local state with prop when it changes externally (but not from our own updates)
    React.useEffect(() => {
      if (defect.description !== localValue && pendingUpdateRef.current === null) {
        setLocalValue(defect.description || '');
      }
    }, [defect.description]);

    const updateDescription = (description: string) => {
      // Update local state immediately (no re-render of parent)
      setLocalValue(description);
      // Store pending update - will be applied on blur
      pendingUpdateRef.current = description;
    };

    // Apply pending update on blur (when user leaves the field)
    const applyPendingUpdate = () => {
      if (pendingUpdateRef.current !== null) {
        const valueToUpdate = pendingUpdateRef.current;
        pendingUpdateRef.current = null;
        setBulkDefects((items) =>
          items.map((item) =>
            item.photoNumber === defect.photoNumber ? { ...item, description: valueToUpdate } : item
          )
        );
      }
    };

    // Auto-resize textarea on mount and when local value changes
    React.useEffect(() => {
      if (textareaRef.current) {
        const height = Math.min(textareaRef.current.scrollHeight, 120);
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${height}px`;
      }
    }, [localValue]);

    return (
      <div className="space-y-0">
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => {
            const textarea = e.target as HTMLTextAreaElement;
            updateDescription(e.target.value);
            // Auto-resize textarea immediately (don't wait for useEffect)
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
          }}
          onBlur={(e) => {
            // Apply pending update on blur
            applyPendingUpdate();
          }}
          onFocus={(e) => {
            // Focus handler - no action needed
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          onKeyUp={(e) => {
            e.stopPropagation();
          }}
          onKeyPress={(e) => {
            e.stopPropagation();
          }}
          onInput={(e) => {
            const textarea = e.target as HTMLTextAreaElement;
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
          }}
          maxLength={100}
          className={`w-full p-1.5 text-sm border rounded bg-white dark:bg-neutral-800 text-slate-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none overflow-hidden ${!isValid ? 'border-amber-300' : 'border-slate-200 dark:border-gray-600'
            }`}
          placeholder="Description"
          rows={1}
          style={{ minHeight: '2.5rem', maxHeight: '120px', height: 'auto' }}
        />
        <div className="flex items-center justify-between mt-0.5 text-xs leading-none h-3.5 min-h-[14px] mb-0 pb-0">
          <div className="text-slate-400 dark:text-gray-500">
            {localValue.length}/100
          </div>
          {!isValid && invalidChars.length > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle size={12} />
              <span>
                Slashes not allowed: {invalidChars.join(' ')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if photoNumber changed (description is managed locally)
    return prevProps.defect.photoNumber === nextProps.defect.photoNumber;
  });

  const renderBulkDefectDescriptionField = (defect: typeof bulkDefects[0]) => {
    return <BulkDefectDescriptionField defect={defect} />;
  };

  const updateBulkDefectPhotoNumber = (photoNumber: string, newPhotoNumber: string) => {
    // Validate that the new photo number doesn't duplicate existing ones
    const trimmedNewNumber = newPhotoNumber.trim();

    if (trimmedNewNumber === '') {
      // Allow empty, will be handled by renumbering
      setBulkDefects((items) =>
        items.map((item) =>
          item.photoNumber === photoNumber ? { ...item, photoNumber: trimmedNewNumber } : item
        )
      );
      return;
    }

    // Check for duplicates (excluding the current item)
    const hasDuplicate = bulkDefects.some(
      (item) => item.photoNumber === trimmedNewNumber && item.photoNumber !== photoNumber
    );

    if (hasDuplicate) {
      // Find the next available number
      const maxNumber = Math.max(
        ...bulkDefects.map((item) => parseInt(item.photoNumber || '0')),
        bulkDefects.length
      );
      const nextAvailable = String(maxNumber + 1);

      setBulkDefects((items) =>
        items.map((item) =>
          item.photoNumber === photoNumber ? { ...item, photoNumber: nextAvailable } : item
        )
      );
    } else {
      setBulkDefects((items) =>
        items.map((item) =>
          item.photoNumber === photoNumber ? { ...item, photoNumber: trimmedNewNumber } : item
        )
      );
    }
  };

  const getAvailablePhotoNumbers = (currentPhotoNumber: string) => {
    const usedNumbers = new Set(bulkDefects.map(d => d.photoNumber).filter(n => n && n !== currentPhotoNumber));
    const maxDefects = Math.max(bulkDefects.length, 20); // Generate up to 20 options
    const available: string[] = [];

    for (let i = 1; i <= maxDefects; i++) {
      const numStr = String(i);
      if (!usedNumbers.has(numStr)) {
        available.push(numStr);
      }
    }

    return available;
  };

  const deleteBulkDefect = (photoNumber: string) => {
    setBulkDefects((items) => {
      const newItems = items.filter((item) => item.photoNumber !== photoNumber);
      // Renumber remaining items
      return newItems.map((item, index) => ({
        ...item,
        photoNumber: String(index + 1),
      }));
    });
  };

  const addDefectBelow = (afterPhotoNumber: string) => {
    setBulkDefects((items) => {
      const sortedItems = [...items].sort((a, b) => parseInt(a.photoNumber || '0') - parseInt(b.photoNumber || '0'));
      const insertIndex = sortedItems.findIndex(item => item.photoNumber === afterPhotoNumber);

      if (insertIndex === -1) {
        // If not found, add at the end
        const newPhotoNumber = String(items.length + 1);
        return [
          ...items,
          {
            photoNumber: newPhotoNumber,
            description: '',
            selectedFile: ''
          },
        ];
      }

      // Insert after the found item and renumber all subsequent items
      const newItems = [...sortedItems];
      newItems.splice(insertIndex + 1, 0, {
        photoNumber: '',
        description: '',
        selectedFile: ''
      });

      // Renumber all items to ensure sequential numbering
      return newItems.map((item, index) => ({
        ...item,
        photoNumber: String(index + 1),
      }));
    });
  };

  // Check if there's saved metadata (bulkDefects or form data) even without images
  // Only show notification if data was actually restored from storage on page load
  const hasSavedMetadata = bulkDefects.length > 0 && dataRestoredFromStorage;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-soft border border-neutral-200 dark:border-neutral-800 h-full flex flex-col">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wide">
          Tiles ({bulkDefects.length})
        </h3>

        <div className="flex items-center gap-1">
          {/* Toggle Defect List Panel Button */}
          <button
            onClick={toggleDefectListPanel}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title={isDefectListPanelOpen ? "Close defect list" : "View defect list"}
          >
            <FileText
              size={16}
              className={isDefectListPanelOpen
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 dark:text-neutral-400'
              }
            />
          </button>

          {/* Grid/List view toggle button */}
          <button
            onClick={onExpand}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title={isExpanded ? "Collapse to list view" : "Expand to grid view"}
          >
            {isExpanded ? (
              <List size={16} className="text-neutral-500 dark:text-neutral-400" />
            ) : (
              <Grid size={16} className="text-neutral-500 dark:text-neutral-400" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Defect List Panel */}
      {isDefectListPanelOpen && (
        <div ref={defectListPanelRef} className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
              Defect List ({bulkDefects.length})
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyDefectList}
                disabled={bulkDefects.length === 0}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${bulkDefects.length === 0
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                    : 'bg-black dark:bg-neutral-800 text-white hover:bg-neutral-900 dark:hover:bg-neutral-700'
                  }`}
              >
                Copy List
              </button>
              <button
                onClick={() => setIsDefectListPanelOpen(false)}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                title="Close defect list"
              >
                <X size={16} className="text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            {bulkDefects.length > 0 ? (
              bulkDefects
                .sort((a, b) => parseInt(a.photoNumber || '0') - parseInt(b.photoNumber || '0'))
                .map(defect => (
                  <div
                    key={defect.photoNumber}
                    className="text-sm text-slate-700 dark:text-gray-300 py-1"
                  >
                    {defect.description || '(no description)'} - P{defect.photoNumber}
                  </div>
                ))
            ) : (
              <div className="text-sm text-slate-400 dark:text-gray-500 text-center py-4">
                No defects yet
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {isExpanded ? (
          // Expanded Batch drag view - show tiles sorted by tile number (no date grouping)
          <div
            className="h-full overflow-y-auto scrollbar-thin"
            style={{
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              transform: 'translateZ(0)',
              willChange: 'scroll-position'
            }}
            onWheel={(e) => {
              // Don't scroll parent if event originated from dropdown
              const target = e.target as HTMLElement;
              if (target.closest('.image-selector-dropdown') || 
                  target.closest('[data-defect-id]') ||
                  target.closest('.overflow-y-auto.max-h-48')) {
                e.stopPropagation();
                e.preventDefault();
                const event = e.nativeEvent;
                if (event.stopImmediatePropagation) {
                  event.stopImmediatePropagation();
                }
                return false;
              }
            }}
            onScroll={(e) => {
              // Prevent scroll events from dropdown affecting parent
              const target = e.target as HTMLElement;
              if (target.closest('.image-selector-dropdown') || 
                  target.closest('[data-defect-id]')) {
                e.stopPropagation();
                const event = e.nativeEvent;
                if (event.stopImmediatePropagation) {
                  event.stopImmediatePropagation();
                }
              }
            }}
          >
            <div className="p-2">
              <SortableContext
                items={bulkDefects.map((d) => d.photoNumber)}
                strategy={verticalListSortingStrategy}
              >
                <div className={`grid gap-2 ${activeTab === 'browser'
                  ? 'grid-cols-5'
                  : 'grid-cols-6'
                  }`}>
                  {bulkDefects
                    .sort((a, b) => parseInt(a.photoNumber || '0') - parseInt(b.photoNumber || '0'))
                    .map((defect) => (
                      <BulkDefectTile
                        key={defect.photoNumber}
                        defect={defect}
                        images={images}
                        activeDragId={activeDragId}
                        overDragId={overDragId}
                        isSelectorOpen={imageSelectorOpen === defect.photoNumber}
                        searchQuery={imageSearchQuery[defect.photoNumber] || ''}
                        focusedIndex={focusedImageIndex[defect.photoNumber] ?? -1}
                        onSelectorOpen={setImageSelectorOpen}
                        onSearchQueryChange={(photoNumber, query) => {
                          setImageSearchQuery(prev => ({
                            ...prev,
                            [photoNumber]: query
                          }));
                        }}
                        onFocusedIndexChange={(photoNumber, index) => {
                          if (index === null) {
                            setFocusedImageIndex(prev => {
                              const next = { ...prev };
                              delete next[photoNumber];
                              return next;
                            });
                          } else {
                            setFocusedImageIndex(prev => ({
                              ...prev,
                              [photoNumber]: index
                            }));
                          }
                        }}
                        onDelete={deleteBulkDefect}
                        onAddBelow={addDefectBelow}
                        onImageClick={handleImageClick}
                        onFileSelect={updateBulkDefectFile}
                        scrollPositionRefs={scrollPositionRefs}
                        isScrollingRef={isScrollingRef}
                        scrollTimeoutRefs={scrollTimeoutRefs}
                        renderDescriptionField={renderBulkDefectDescriptionField}
                        getImageForDefect={getImageForDefect}
                      />
                    ))}
                </div>
              </SortableContext>
            </div>
          </div>
        ) : (
          <BulkTextInput />
        )}
      </div>

      {/* Batch Defect Image Viewer */}
      {viewerOpen && defectsForViewer.length > 0 && (
        <BatchDefectImageViewer
          defects={defectsForViewer}
          initialIndex={viewerInitialIndex}
          onClose={() => setViewerOpen(false)}
          onDeleteImage={handleDeleteImageFromDefect}
        />
      )}
    </div>
  );
};
