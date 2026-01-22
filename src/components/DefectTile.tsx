import React, { useState, useEffect, useRef } from 'react';
import { X, GripVertical, ChevronDown, AlertCircle, Search, Plus } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { validateDescription } from '../utils/fileValidation';
import { useMetadataStore } from '../store/metadataStore';

interface DefectTileProps {
  id: string;
  photoNumber: string;
  description: string;
  selectedFile: string;
  availableFiles: string[];
  onDelete: () => void;
  onDescriptionChange: (value: string) => void;
  onFileChange: (value: string) => void;
  onPhotoNumberClick?: (photoNumber: string) => void;
  onAddBelow?: () => void;
}

export const DefectTile: React.FC<DefectTileProps> = ({
  id,
  photoNumber,
  description,
  selectedFile,
  availableFiles,
  onDelete,
  onDescriptionChange,
  onFileChange,
  onPhotoNumberClick,
  onAddBelow,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localDescription, setLocalDescription] = useState(description);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalDescription(description);
  }, [description]);

  // Reset search and focused index when dropdown closes
  useEffect(() => {
    if (!isDropdownOpen) {
      setSearchQuery('');
      setFocusedIndex(-1);
    }
  }, [isDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: false, // Always allow defect reordering
  });

  const {
    setNodeRef: setDroppableRef,
    isOver,
  } = useDroppable({
    id: `drop-${id}`,
    data: {
      type: 'drop-zone',
      photoNumber: id,
    }
  });

  // Debug logging
  useEffect(() => {
    if (isOver) {
      console.log('🎯 Defect tile isOver:', {
        defectId: id,
        dropZoneId: `drop-${id}`,
        photoNumber
      });
    }
  }, [isOver, id, photoNumber]);

  // Use sortable ref for the outer container (for reordering)
  // Use droppable ref for the inner content (for image drops)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
  };

  const handleDescriptionChange = (value: string) => {
    setLocalDescription(value);
    const { isValid, invalidChars } = validateDescription(value);
    if (!isValid) {
      setError(`Invalid characters found: ${invalidChars.join(' ')}`);
      return;
    }
    setError(null);
    onDescriptionChange(value);
  };

  const handleDescriptionBlur = () => {
    setIsEditing(false);
    if (!error) {
      onDescriptionChange(localDescription);
    }
  };
  
  const handleFileSelect = (fileName: string) => {
    onFileChange(fileName);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleSelectNone = () => {
    onFileChange('');
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  // Filter files based on search query (by title/filename or last 4 digits)
  const getLastFourDigits = (filename: string): string => {
    // Remove file extension first
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    
    // Strategy: Find the last sequence of 4+ consecutive digits in the filename
    // This correctly handles cases like "PB080001" -> "0001", "PB080001 copy" -> "0001"
    // We look for the last occurrence of 4+ consecutive digits and take the last 4
    
    // Find all sequences of consecutive digits
    const digitSequences = nameWithoutExt.match(/\d+/g);
    if (!digitSequences || digitSequences.length === 0) {
      return ''; // No digits found
    }
    
    // Get the last sequence of digits (this is the photo number)
    const lastSequence = digitSequences[digitSequences.length - 1];
    
    // If the sequence has 4 or more digits, take the last 4
    if (lastSequence.length >= 4) {
      return lastSequence.slice(-4);
    }
    
    // If less than 4 digits, pad with leading zeros
    return lastSequence.padStart(4, '0');
  };

  const filteredFiles = React.useMemo(() => {
    // Early return if no search query
    if (!searchQuery) {
      return availableFiles;
    }

    const query = String(searchQuery).trim();
    if (!query || query.length === 0) {
      return availableFiles;
    }

    // Check if query is purely numeric (only digits, no letters, spaces, or special chars)
    // This must be checked BEFORE any other processing
    const isNumericQuery = /^\d+$/.test(query);
    
    // If numeric, we MUST only search by last 4 digits, never by title
    if (isNumericQuery) {
      const filtered = availableFiles.filter(file => {
        const lastFour = getLastFourDigits(file);
        
        // Must have exactly 4 digits
        if (!lastFour || lastFour.length !== 4) {
          return false;
        }
        
        if (query.length === 1) {
          // Single digit: must be the last digit, and all preceding digits must be zeros
          // Example: Query "1" matches "0001" (ends with "1" and preceding are "000")
          //          Query "1" does NOT match "0011" (ends with "1" but preceding are "001", not all zeros)
          //          Query "4" matches "0004" but NOT "0001"
          const lastDigit = lastFour.slice(-1);
          const precedingDigits = lastFour.slice(0, -1);
          
          // Strict check: last digit must match AND all preceding must be zeros
          const digitMatches = lastDigit === query;
          const precedingAreZeros = /^0+$/.test(precedingDigits);
          
          return digitMatches && precedingAreZeros;
        } else {
          // Multi-digit: must end with query
          // Example: Query "01" matches "0001", "001" matches "0001"
          return lastFour.endsWith(query);
        }
      });
      
      return filtered;
    }
    
    // Non-numeric query: search by title/filename
    const queryLower = query.toLowerCase();
    return availableFiles.filter(file => {
      const fileName = file.toLowerCase();
      return fileName.includes(queryLower);
    });
  }, [availableFiles, searchQuery]);

  // Auto-focus first result when search changes
  useEffect(() => {
    if (searchQuery && filteredFiles.length > 0) {
      setFocusedIndex(0);
    } else if (!searchQuery) {
      setFocusedIndex(-1);
    }
  }, [searchQuery, filteredFiles.length]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && isDropdownOpen) {
      const buttons = dropdownRef.current?.querySelectorAll('button');
      // +1 to account for "None" button
      buttons?.[focusedIndex + 1]?.scrollIntoView({ 
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [focusedIndex, isDropdownOpen]);

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`bg-white dark:bg-neutral-900 rounded-lg border-2 transition-all ${
        isDragging ? 'shadow-large opacity-50' : ''
      } ${
        isOver 
          ? 'ring-2 ring-neutral-900 dark:ring-neutral-100 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 shadow-medium scale-[1.02]' 
          : 'border-neutral-300 dark:border-neutral-700 hover:shadow-medium'
      }`}
    >
      <div 
        ref={setDroppableRef}
        className="p-3 flex items-center gap-3"
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          <GripVertical size={20} />
        </div>

        {/* Make photo number clickable if image is assigned */}
        {selectedFile && onPhotoNumberClick ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPhotoNumberClick(photoNumber);
            }}
            className="w-12 text-center font-semibold text-neutral-900 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
            title="Click to view image"
          >
            {photoNumber}
          </button>
        ) : (
          <div className="w-12 text-center font-semibold text-neutral-900 dark:text-neutral-300">
            {photoNumber}
          </div>
        )}

        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={localDescription}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              onBlur={handleDescriptionBlur}
              autoFocus
              className="w-full px-3 py-2 text-sm border-0 rounded-lg bg-white dark:bg-neutral-800 text-slate-900 dark:text-white transition-all outline-none hover:shadow-medium focus:shadow-none"
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className={`px-3 py-2 text-sm rounded-lg cursor-text transition-all hover:shadow-medium ${
                localDescription 
                  ? 'text-slate-900 dark:text-white' 
                  : 'text-neutral-500 dark:text-neutral-500'
              }`}
            >
              {localDescription || 'Click to edit'}
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors font-medium ${
              selectedFile
                ? 'text-slate-900 dark:text-white'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <div className="max-w-[150px] truncate">
              {selectedFile || 'Select image'}
            </div>
            <ChevronDown size={16} className={isDropdownOpen ? 'rotate-180' : ''} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-64 max-h-64 overflow-hidden bg-white dark:bg-neutral-900 rounded-lg shadow-large border border-neutral-200 dark:border-neutral-800 z-10 flex flex-col">
              {/* Search Input */}
              <div className="p-2 border-b border-neutral-200 dark:border-neutral-800">
                <div className="relative">
                  <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSearchQuery(newValue);
                    }}
                    placeholder="Search by title or last 4 digits..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 transition-all"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsDropdownOpen(false);
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        // Select the focused item or first item if none focused
                        const indexToSelect = focusedIndex >= 0 ? focusedIndex : 0;
                        if (filteredFiles[indexToSelect]) {
                          handleFileSelect(filteredFiles[indexToSelect]);
                        }
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setFocusedIndex(prev => 
                          prev < filteredFiles.length - 1 ? prev + 1 : prev
                        );
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
                      }
                    }}
                  />
                </div>
              </div>

              {/* File List */}
              <div className="overflow-y-auto max-h-48">
                {/* None option at the top - always grey */}
                <button
                  onClick={handleSelectNone}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
                >
                  <div className="truncate">None</div>
                </button>

                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file, index) => (
                    <button
                      key={`${searchQuery}-${file}-${index}`}
                      onClick={() => handleFileSelect(file)}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                        file === selectedFile
                          ? 'text-neutral-900 dark:text-neutral-100 font-semibold bg-neutral-100 dark:bg-neutral-800'
                          : focusedIndex === index
                            ? 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100'
                            : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="truncate">{file}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 text-center">
                    No photos found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
          {error && (
            <div className="absolute right-0 mt-1 w-64 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>

        {onAddBelow && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddBelow();
            }}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Add defect below"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      {error && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-900/50">
            <AlertCircle size={14} />
            {error}
          </div>
        </div>
      )}
    </div>
  );
};
