import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMetadataStore } from '../store/metadataStore';
import { X, Trash2, ArrowUpDown, AlertTriangle, Grid, List, Images, FileText, Plus, ChevronDown, ChevronUp, Search, GripVertical, PlusCircle, Trash, Info, CheckCircle2, Calendar, Maximize2 } from 'lucide-react';
import { BatchDefectImageViewer } from './BatchDefectImageViewer';
import { validateDescription } from '../utils/fileValidation';
import { BulkTextInput } from './BulkTextInput';
import type { ImageMetadata } from '../types';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

type ViewMode = 'images' | 'text';

const SortButton: React.FC<{
  direction: 'asc' | 'desc' | null;
  onChange: (direction: 'asc' | 'desc' | null) => void;
}> = ({ direction, onChange }) => (
  <button
    onClick={() => onChange(
      direction === null ? 'asc' :
        direction === 'asc' ? 'desc' :
          null
    )}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${direction
      ? 'bg-indigo-500 text-white'
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
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any selector
      if (!target.closest('.image-selector-dropdown')) {
        setImageSelectorOpen(null);
      }
    };

    if (imageSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [imageSelectorOpen]);


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
          className={`w-full p-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-white resize-y min-h-[60px] ${!isValid ? 'border-amber-300' : 'border-slate-200 dark:border-gray-600'
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
          className={`w-full p-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-white resize-none overflow-hidden ${!isValid ? 'border-amber-300' : 'border-slate-200 dark:border-gray-600'
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full flex flex-col">
      {/* Data Persistence Notification Banner */}
      {images.length === 0 && hasSavedMetadata && (
        <div className="mx-3 mt-3 mb-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-300 dark:border-indigo-700 rounded-lg flex items-start gap-3 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1.5">
              ✓ Your data is safe and has been restored
            </p>
            <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
              You have <strong className="font-semibold">{bulkDefects.length} tile{bulkDefects.length !== 1 ? 's' : ''}</strong> with saved descriptions and photo numbers.
              <br />
              <span className="mt-1 block">Re-upload your photos and they will <strong>automatically match</strong> to their tiles. All your work is preserved.</span>
            </p>
          </div>
        </div>
      )}

      <div className="p-3 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-xs font-medium text-slate-500 dark:text-gray-400">
          TILES ({bulkDefects.length})
        </h3>

        <div className="flex items-center gap-1">
          {/* Toggle Defect List Panel Button */}
          <button
            onClick={toggleDefectListPanel}
            className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isDefectListPanelOpen ? "Close defect list" : "View defect list"}
          >
            <FileText 
              size={16} 
              className={isDefectListPanelOpen 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-600 dark:text-gray-300'
              } 
            />
          </button>
          
          {/* Grid/List view toggle button */}
          <button
            onClick={onExpand}
            className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isExpanded ? "Collapse to list view" : "Expand to grid view"}
          >
            {isExpanded ? (
              <List size={16} className="text-slate-600 dark:text-gray-300" />
            ) : (
              <Grid size={16} className="text-slate-600 dark:text-gray-300" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Defect List Panel */}
      {isDefectListPanelOpen && (
        <div className="p-3 border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-600 dark:text-gray-400">
              Defect List ({bulkDefects.length})
            </label>
            <button
              onClick={handleCopyDefectList}
              disabled={bulkDefects.length === 0}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                bulkDefects.length === 0
                  ? 'bg-slate-200 dark:bg-gray-700 text-slate-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700'
              }`}
            >
              Copy List
            </button>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-1 p-2 bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-gray-700">
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
          >
            <div className="p-2">
              <SortableContext
                items={bulkDefects.map((d) => d.photoNumber)}
                strategy={verticalListSortingStrategy}
              >
                <div className={`grid gap-2 ${activeTab === 'browser'
                  ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5'
                  : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7'
                  }`}>
                  {bulkDefects
                    .sort((a, b) => parseInt(a.photoNumber || '0') - parseInt(b.photoNumber || '0'))
                    .map((defect) => {
                      const BulkDefectTile = () => {
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

                        // Add droppable to show drop zone feedback
                        const {
                          setNodeRef: setDroppableRef,
                          isOver,
                        } = useDroppable({
                          id: defect.photoNumber,
                        });


                        const image = getImageForDefect(defect.selectedFile || '');
                        const isSelectorOpen = imageSelectorOpen === defect.photoNumber;
                        const searchQuery = imageSearchQuery[defect.photoNumber] || '';

                        // Filter images based on search query
                        const getLastFourDigits = (filename: string): string => {
                          const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
                          const digitSequences = nameWithoutExt.match(/\d+/g);
                          if (!digitSequences || digitSequences.length === 0) return '';
                          const lastSequence = digitSequences[digitSequences.length - 1];
                          if (lastSequence.length >= 4) {
                            return lastSequence.slice(-4);
                          }
                          return lastSequence.padStart(4, '0');
                        };

                        const filteredImages = React.useMemo(() => {
                          // Early return if no search query
                          if (!searchQuery) {
                            return images;
                          }

                          const query = String(searchQuery).trim();
                          if (!query || query.length === 0) {
                            return images;
                          }

                          // Check if query is purely numeric (only digits, no letters, spaces, or special chars)
                          // This must be checked BEFORE any other processing
                          const isNumericQuery = /^\d+$/.test(query);

                          // If numeric, we MUST only search by last 4 digits, never by title
                          if (isNumericQuery) {
                            const filtered = images.filter(img => {
                              const lastFour = getLastFourDigits(img.file.name);

                              // Must have exactly 4 digits
                              if (!lastFour || lastFour.length !== 4) {
                                return false;
                              }

                              if (query.length === 1) {
                                // Single digit: must be the last digit, and all preceding digits must be zeros
                                const lastDigit = lastFour.slice(-1);
                                const precedingDigits = lastFour.slice(0, -1);

                                // Strict check: last digit must match AND all preceding must be zeros
                                const digitMatches = lastDigit === query;
                                const precedingAreZeros = /^0+$/.test(precedingDigits);

                                return digitMatches && precedingAreZeros;
                              } else {
                                // Multi-digit: must end with query
                                return lastFour.endsWith(query);
                              }
                            });

                            return filtered;
                          }

                          // Non-numeric query: search by title/filename
                          const queryLower = query.toLowerCase();
                          return images.filter(img => {
                            const fileName = img.file.name.toLowerCase();
                            return fileName.includes(queryLower);
                          });
                        }, [images, searchQuery]);

                        // Scroll focused item into view
                        React.useEffect(() => {
                          const currentFocus = focusedImageIndex[defect.photoNumber];
                          if (currentFocus !== undefined && currentFocus >= 0 && isSelectorOpen) {
                            // Find all buttons in the dropdown for this defect's selector
                            const dropdowns = document.querySelectorAll('.image-selector-dropdown');
                            dropdowns.forEach(dropdown => {
                              const buttons = dropdown.querySelectorAll('button');
                              // +1 to account for "None" button
                              const targetButton = buttons[currentFocus + 1];
                              if (targetButton) {
                                targetButton.scrollIntoView({
                                  block: 'nearest',
                                  behavior: 'smooth'
                                });
                              }
                            });
                          }
                        }, [focusedImageIndex, defect.photoNumber, isSelectorOpen]);

                        // Create custom listeners that exclude interactive elements
                        const customListeners = {
                          ...listeners,
                          onPointerDown: (e: React.PointerEvent) => {
                            const target = e.target as HTMLElement;
                            // Don't start drag if clicking on interactive elements (buttons, inputs, etc.)
                            // Images are now draggable since we have a separate expand button
                            if (target.closest('button') ||
                              target.closest('input') ||
                              target.closest('textarea') ||
                              target.closest('.image-selector-dropdown')) {
                              return;
                            }
                            // Call original listener to enable drag
                            if (listeners?.onPointerDown) {
                              listeners.onPointerDown(e);
                            }
                          },
                        };

                        // Combine refs for both sortable and droppable
                        const combinedRef = (node: HTMLDivElement | null) => {
                          setNodeRef(node);
                          setDroppableRef(node);
                        };

                        return (
                          <div
                            ref={combinedRef}
                            style={{
                              transform: CSS.Transform.toString(transform),
                              transition: isDragging ? 'none' : (transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)'),
                              opacity: isDragging ? 0.4 : 1,
                            }}
                            className={`group flex flex-col bg-slate-50 dark:bg-gray-700 rounded-lg overflow-visible transition-all duration-200 relative ${isDragging
                              ? 'shadow-2xl ring-4 ring-indigo-500 ring-opacity-75 z-50 cursor-grabbing'
                              : (overDragId === defect.photoNumber && activeDragId && activeDragId !== defect.photoNumber)
                                ? 'ring-4 ring-indigo-400 border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-xl scale-[1.02] border-2 border-indigo-400'
                                : 'cursor-grab hover:shadow-lg hover:ring-1 hover:ring-indigo-300 dark:hover:ring-indigo-600'
                              }`}
                            {...attributes}
                            {...customListeners}
                          >
                            {/* Delete button - X icon, positioned at top left, visible on hover */}
                            <div className="absolute top-2 left-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity" style={{ pointerEvents: 'auto' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  deleteBulkDefect(defect.photoNumber);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-lg"
                                title="Delete tile"
                              >
                                <X size={16} />
                              </button>
                            </div>

                            {/* Add button - Plus icon, positioned at bottom right, always visible */}
                            <div className="absolute bottom-2 right-2 z-40" style={{ pointerEvents: 'auto' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  addDefectBelow(defect.photoNumber);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-110"
                                title="Add tile below"
                              >
                                <PlusCircle size={16} />
                              </button>
                            </div>
                            <div className="relative aspect-square overflow-hidden rounded-t-lg">
                              {image ? (
                                <>
                                  <img
                                    src={image.preview}
                                    alt={image.file.name}
                                    className="w-full h-full object-cover cursor-grab hover:opacity-95 transition-opacity select-none"
                                    draggable="false"
                                  />
                                  {/* Expand button - bottom right corner, always visible */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleImageClick(defect.photoNumber);
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                    }}
                                    className="absolute bottom-2 right-2 p-1.5 bg-indigo-500/90 hover:bg-indigo-600 text-white rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-110 z-30"
                                    title="Expand image"
                                    style={{ pointerEvents: 'auto' }}
                                  >
                                    <Maximize2 size={16} />
                                  </button>
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-gray-600 text-slate-400 dark:text-gray-500 text-xs">
                                  No image
                                </div>
                              )}
                              {/* Photo number badge - top right corner like images assigned tile, always visible */}
                              {defect.photoNumber && (
                                <div className="absolute top-2 right-2 bg-indigo-500 w-6 h-6 rounded-full flex items-center justify-center z-30">
                                  <span className="text-white text-sm font-medium">{defect.photoNumber}</span>
                                </div>
                              )}
                            </div>

                            <div
                              className="p-2 space-y-1 flex-shrink-0 relative z-10 pb-2"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              style={{ pointerEvents: 'auto' }}
                            >
                              {/* Image selector dropdown - like DefectTile */}
                              <div className="relative z-[100]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setImageSelectorOpen(isSelectorOpen ? null : defect.photoNumber);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-colors ${defect.selectedFile
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-600'
                                    }`}
                                >
                                  <div className="flex-1 text-left truncate">
                                    {defect.selectedFile || 'Select image'}
                                  </div>
                                  <ChevronDown size={14} className={isSelectorOpen ? 'rotate-180' : ''} />
                                </button>

                                {isSelectorOpen && (
                                  <div
                                    className="image-selector-dropdown absolute left-0 right-0 mt-1 w-full max-h-64 overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 z-[100] flex flex-col"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-slate-200 dark:border-gray-700">
                                      <div className="relative">
                                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                                        <input
                                          type="text"
                                          value={searchQuery}
                                          onChange={(e) => {
                                            setImageSearchQuery(prev => ({
                                              ...prev,
                                              [defect.photoNumber]: e.target.value
                                            }));
                                            // Auto-focus first result when search changes
                                            if (e.target.value && filteredImages.length > 0) {
                                              setFocusedImageIndex(prev => ({
                                                ...prev,
                                                [defect.photoNumber]: 0
                                              }));
                                            } else {
                                              setFocusedImageIndex(prev => {
                                                const next = { ...prev };
                                                delete next[defect.photoNumber];
                                                return next;
                                              });
                                            }
                                          }}
                                          placeholder="Search by title or last 4 digits..."
                                          className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                                          autoFocus
                                          onClick={(e) => e.stopPropagation()}
                                          onKeyDown={(e) => {
                                            const currentFocus = focusedImageIndex[defect.photoNumber] ?? -1;

                                            if (e.key === 'Escape') {
                                              setImageSelectorOpen(null);
                                              setFocusedImageIndex(prev => {
                                                const next = { ...prev };
                                                delete next[defect.photoNumber];
                                                return next;
                                              });
                                            } else if (e.key === 'Enter') {
                                              e.preventDefault();
                                              const indexToSelect = currentFocus >= 0 ? currentFocus : 0;
                                              if (filteredImages[indexToSelect]) {
                                                updateBulkDefectFile(defect.photoNumber, filteredImages[indexToSelect].file.name);
                                                setImageSelectorOpen(null);
                                                setImageSearchQuery(prev => {
                                                  const next = { ...prev };
                                                  delete next[defect.photoNumber];
                                                  return next;
                                                });
                                                setFocusedImageIndex(prev => {
                                                  const next = { ...prev };
                                                  delete next[defect.photoNumber];
                                                  return next;
                                                });
                                              }
                                            } else if (e.key === 'ArrowDown') {
                                              e.preventDefault();
                                              setFocusedImageIndex(prev => ({
                                                ...prev,
                                                [defect.photoNumber]: currentFocus < filteredImages.length - 1 ? currentFocus + 1 : currentFocus
                                              }));
                                            } else if (e.key === 'ArrowUp') {
                                              e.preventDefault();
                                              setFocusedImageIndex(prev => ({
                                                ...prev,
                                                [defect.photoNumber]: currentFocus > 0 ? currentFocus - 1 : -1
                                              }));
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {/* File List */}
                                    <div className="overflow-y-auto max-h-48">
                                      {/* None option at the top - always grey */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateBulkDefectFile(defect.photoNumber, '');
                                          setImageSelectorOpen(null);
                                          setImageSearchQuery(prev => {
                                            const next = { ...prev };
                                            delete next[defect.photoNumber];
                                            return next;
                                          });
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-gray-700 border-b border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400"
                                      >
                                        <div className="truncate">None</div>
                                      </button>

                                      {filteredImages.length > 0 ? (
                                        filteredImages.map((img, index) => {
                                          const currentFocus = focusedImageIndex[defect.photoNumber] ?? -1;
                                          const isFocused = currentFocus === index;

                                          return (
                                            <button
                                              key={`${searchQuery}-${img.id}-${index}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateBulkDefectFile(defect.photoNumber, img.file.name);
                                                setImageSelectorOpen(null);
                                                setImageSearchQuery(prev => {
                                                  const next = { ...prev };
                                                  delete next[defect.photoNumber];
                                                  return next;
                                                });
                                                setFocusedImageIndex(prev => {
                                                  const next = { ...prev };
                                                  delete next[defect.photoNumber];
                                                  return next;
                                                });
                                              }}
                                              onMouseEnter={() => {
                                                setFocusedImageIndex(prev => ({
                                                  ...prev,
                                                  [defect.photoNumber]: index
                                                }));
                                              }}
                                              className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-gray-700 ${img.file.name === defect.selectedFile
                                                  ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/20'
                                                  : isFocused
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                    : 'text-indigo-600 dark:text-indigo-400'
                                                }`}
                                            >
                                              <div className="truncate">{img.file.name}</div>
                                            </button>
                                          );
                                        })
                                      ) : (
                                        <div className="px-3 py-3 text-xs text-slate-500 dark:text-gray-400 text-center">
                                          No photos found matching "{searchQuery}"
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                }}
                                className="pb-0 mb-0"
                                style={{ pointerEvents: 'auto' }}
                              >
                                {renderBulkDefectDescriptionField(defect)}
                              </div>
                            </div>
                          </div>
                        );
                      };
                      return <BulkDefectTile key={defect.photoNumber} />;
                    })}
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