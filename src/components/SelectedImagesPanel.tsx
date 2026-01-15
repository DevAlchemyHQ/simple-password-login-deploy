import React, { useState, useEffect } from 'react';
import { useMetadataStore } from '../store/metadataStore';
import { X, Trash2, ArrowUpDown, AlertTriangle, Maximize2, Minimize2, Images, FileText, Plus, ChevronDown, Search } from 'lucide-react';
import { ImageZoom } from './ImageZoom';
import { validateDescription } from '../utils/fileValidation';
import { BulkTextInput } from './BulkTextInput';
import type { ImageMetadata } from '../types';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
      direction 
        ? 'bg-indigo-500 text-white' 
        : 'text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700'
    }`}
    title={direction === null ? 'Enable sorting' : 'Change sort order'}
  >
    <ArrowUpDown 
      size={16} 
      className={`transition-transform ${
        direction === 'desc' ? 'rotate-180' : ''
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
}

export const SelectedImagesPanel: React.FC<SelectedImagesPanelProps> = ({ onExpand, isExpanded }) => {
  const {
    images,
    selectedImages,
    toggleImageSelection,
    updateImageMetadata,
    clearSelectedImages,
    defectSortDirection,
    setDefectSortDirection,
    getSelectedCounts,
    viewMode,
    setViewMode,
    bulkDefects,
    setBulkDefects,
    updateBulkDefectFile
  } = useMetadataStore();
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [imageSelectorOpen, setImageSelectorOpen] = useState<string | null>(null);
  const [photoNumberSelectorOpen, setPhotoNumberSelectorOpen] = useState<string | null>(null);
  const [imageSearchQuery, setImageSearchQuery] = useState<string>('');

  // Close selectors when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any selector
      if (!target.closest('.image-selector-dropdown') && !target.closest('.photo-number-selector-dropdown')) {
        setImageSelectorOpen(null);
        setPhotoNumberSelectorOpen(null);
        setImageSearchQuery('');
      }
    };

    if (imageSelectorOpen || photoNumberSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [imageSelectorOpen, photoNumberSelectorOpen]);

  // Reset search when selector closes
  useEffect(() => {
    if (!imageSelectorOpen) {
      setImageSearchQuery('');
    }
  }, [imageSelectorOpen]);

  // Filter images based on search query
  const getLastFourDigits = (filename: string): string => {
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    const digitSequences = nameWithoutExt.match(/\d+/g);
    if (!digitSequences || digitSequences.length === 0) {
      return '';
    }
    const lastSequence = digitSequences[digitSequences.length - 1];
    if (lastSequence.length >= 4) {
      return lastSequence.slice(-4);
    }
    return lastSequence.padStart(4, '0');
  };

  const getFilteredImages = React.useMemo(() => {
    if (!imageSearchQuery.trim()) {
      return images;
    }

    const query = imageSearchQuery.trim();
    const isNumericQuery = /^\d+$/.test(query);
    
    if (isNumericQuery) {
      return images.filter(img => {
        const lastFour = getLastFourDigits(img.file.name);
        if (!lastFour || lastFour.length !== 4) {
          return false;
        }
        if (query.length === 1) {
          const lastDigit = lastFour.slice(-1);
          const precedingDigits = lastFour.slice(0, -1);
          return lastDigit === query && /^0+$/.test(precedingDigits);
        } else {
          return lastFour.endsWith(query);
        }
      });
    }
    
    const queryLower = query.toLowerCase();
    return images.filter(img => 
      img.file.name.toLowerCase().includes(queryLower)
    );
  }, [images, imageSearchQuery]);
  
  const selectedImagesList = React.useMemo(() => {
    return images.filter(img => selectedImages.has(img.id));
  }, [images, selectedImages]);

  const { defects } = getSelectedCounts();

  const sortImages = (images: ImageMetadata[], direction: 'asc' | 'desc' | null) => {
    if (!direction) return images;

    return [...images].sort((a, b) => {
      // Put images without numbers at the bottom
      const aNum = a.photoNumber ? parseInt(a.photoNumber) : Infinity;
      const bNum = b.photoNumber ? parseInt(b.photoNumber) : Infinity;

      if (aNum === Infinity && bNum === Infinity) {
        return 0;
      }
      if (aNum === Infinity) return 1;
      if (bNum === Infinity) return -1;

      return direction === 'asc' ? aNum - bNum : bNum - aNum;
    });
  };

  const defectImages = sortImages(
    selectedImagesList,
    defectSortDirection
  );

  const renderDescriptionField = (img: ImageMetadata) => {

    const { isValid, invalidChars } = validateDescription(img.description || '');

    return (
      <div>
        <textarea
          value={img.description}
          onChange={(e) => updateImageMetadata(img.id, { description: e.target.value })}
          maxLength={100}
          className={`w-full p-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-white resize-y min-h-[60px] ${
            !isValid ? 'border-amber-300' : 'border-slate-200 dark:border-gray-600'
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

  const renderBulkDefectDescriptionField = (defect: typeof bulkDefects[0]) => {
    const { isValid, invalidChars } = validateDescription(defect.description || '');

    const updateDescription = (description: string) => {
      setBulkDefects((items) =>
        items.map((item) =>
          item.photoNumber === defect.photoNumber ? { ...item, description } : item
        )
      );
    };

    return (
      <div className="flex flex-col min-h-0">
        <textarea
          value={defect.description}
          onChange={(e) => updateDescription(e.target.value)}
          maxLength={100}
          className={`w-full p-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-white resize-none h-[60px] ${
            !isValid ? 'border-amber-300' : 'border-slate-200 dark:border-gray-600'
          }`}
          placeholder="Description"
        />
        <div className="flex items-center justify-between mt-1 text-xs">
          <div className="text-slate-400 dark:text-gray-500">
            {defect.description?.length || 0}/100
          </div>
          {!isValid && invalidChars.length > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle size={12} />
              <span className="text-[10px]">
                Slashes not allowed: {invalidChars.join(' ')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
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

  const getImageForDefect = (selectedFile: string) => {
    return images.find(img => img.file.name === selectedFile);
  };

  if (images.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-[calc(100vh-96px)] flex items-center justify-center p-8 text-slate-400 dark:text-gray-500">
        No images uploaded
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-[calc(100vh-96px)] flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-gray-700 h-[102px] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex-1">
          </div>
          
          <div className="flex items-center gap-4 mx-4">
            <div className="flex p-1 bg-slate-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => setViewMode('images')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'images'
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Images size={18} />
                <span className="text-sm font-medium">Single Select</span>
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'text'
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText size={18} />
                <span className="text-sm font-medium">Batch drag</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onExpand}
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isExpanded ? "Collapse view" : "Expand view"}
            >
              {isExpanded ? (
                <Minimize2 size={20} className="text-slate-600 dark:text-gray-300" />
              ) : (
                <Maximize2 size={20} className="text-slate-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
        <div className="h-5">
          {viewMode === 'text' && (
            <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400">
              TILES ({bulkDefects.length})
            </h3>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {viewMode === 'images' ? (
          <div 
            className="h-full overflow-y-auto scrollbar-thin"
            style={{ 
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className={`grid gap-2 p-2 ${
              isExpanded 
                ? 'grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8' 
                : 'grid-cols-2 lg:grid-cols-4'
            }`}>
              {/* Defects Section */}
              {defectImages.length > 0 && (
                <>
                  <div className="col-span-full flex items-center justify-between py-2">
                    <h4 className="text-sm font-medium text-slate-500 dark:text-gray-400">
                      EXAM PHOTOS ({defectImages.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      <SortButton
                        direction={defectSortDirection}
                        onChange={setDefectSortDirection}
                      />
                      <button
                        onClick={clearSelectedImages}
                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Clear all selected images"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  {defectImages.map((img) => (
                    <div key={img.id} className="flex flex-col bg-slate-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div className="relative aspect-square">
                        <img
                          src={img.preview}
                          alt={img.file.name}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity select-none"
                          onClick={() => setEnlargedImage(img.preview)}
                          draggable="false"
                        />
                        <button
                          onClick={() => toggleImageSelection(img.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      
                      <div className="p-2 space-y-1">
                        <div className="text-xs text-slate-500 dark:text-gray-400 truncate">
                          {img.file.name}
                        </div>
                        <input
                          type="number"
                          value={img.photoNumber}
                          onChange={(e) => updateImageMetadata(img.id, { photoNumber: e.target.value })}
                          className="w-full p-1 text-sm border border-slate-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                          placeholder="#"
                        />
                        {renderDescriptionField(img)}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        ) : isExpanded ? (
          // Expanded Batch drag view - show tiles like Single Select
          <div 
            className="h-full overflow-y-auto scrollbar-thin"
            style={{ 
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <SortableContext
              items={bulkDefects.map((d) => d.photoNumber)}
              strategy={verticalListSortingStrategy}
            >
              <div className={`grid gap-2 p-2 ${
                isExpanded 
                  ? 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7' 
                  : 'grid-cols-2 lg:grid-cols-4'
              }`}>
                {bulkDefects.length > 0 && (
                  <>
                    <div className="col-span-full flex items-center justify-between py-2">
                      <h4 className="text-sm font-medium text-slate-500 dark:text-gray-400">
                        TILES ({bulkDefects.length})
                      </h4>
                    </div>
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

                        const style = {
                          transform: CSS.Transform.toString(transform),
                          transition: transition || 'transform 200ms ease',
                          opacity: isDragging ? 0.7 : 1,
                          zIndex: isDragging ? 50 : 1,
                          scale: isDragging ? 1.05 : 1,
                        };

                        const image = getImageForDefect(defect.selectedFile || '');
                        const isSelectorOpen = imageSelectorOpen === defect.photoNumber;
                        const isPhotoNumberSelectorOpen = photoNumberSelectorOpen === defect.photoNumber;
                        const availablePhotoNumbers = getAvailablePhotoNumbers(defect.photoNumber);
                        
                        return (
                          <div 
                            ref={setNodeRef}
                            style={style}
                            className={`flex flex-col bg-slate-50 dark:bg-gray-700 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200 ${
                              isDragging ? 'shadow-xl scale-105 rotate-1' : 'shadow-sm hover:shadow-md'
                            }`}
                            {...attributes}
                            {...listeners}
                          >
                            <div className="relative aspect-square">
                              {image ? (
                                <>
                                  <img
                                    src={image.preview}
                                    alt={image.file.name}
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity select-none"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEnlargedImage(image.preview);
                                    }}
                                    draggable="false"
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateBulkDefectFile(defect.photoNumber, '');
                                    }}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm z-10"
                                    title="Remove image"
                                  >
                                    <X size={12} />
                                  </button>
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-gray-600 text-slate-400 dark:text-gray-500 text-xs relative group">
                                  <span>No image</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setImageSelectorOpen(isSelectorOpen ? null : defect.photoNumber);
                                    }}
                                    className="absolute top-1 right-1 p-1.5 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors shadow-sm z-10"
                                    title="Select image"
                                  >
                                    <Plus size={14} />
                                  </button>
                                  {isSelectorOpen && (
                                    <div 
                                      className="image-selector-dropdown absolute inset-0 bg-white dark:bg-gray-800 border-2 border-indigo-500 rounded-lg z-20 overflow-hidden flex flex-col"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="p-2 border-b border-slate-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-medium text-slate-700 dark:text-gray-300">Select image</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setImageSelectorOpen(null);
                                              setImageSearchQuery('');
                                            }}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded"
                                          >
                                            <X size={14} />
                                          </button>
                                        </div>
                                        <div className="relative">
                                          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                                          <input
                                            type="text"
                                            value={imageSearchQuery}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              setImageSearchQuery(e.target.value);
                                            }}
                                            placeholder="Search by name or last 4 digits..."
                                            className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Escape') {
                                                setImageSelectorOpen(null);
                                                setImageSearchQuery('');
                                              }
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div className="flex-1 overflow-y-auto">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateBulkDefectFile(defect.photoNumber, '');
                                            setImageSelectorOpen(null);
                                            setImageSearchQuery('');
                                          }}
                                          className="w-full px-2 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-gray-700 border-b border-slate-200 dark:border-gray-600"
                                        >
                                          None
                                        </button>
                                        {getFilteredImages.length > 0 ? (
                                          getFilteredImages.map((img) => (
                                            <button
                                              key={img.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateBulkDefectFile(defect.photoNumber, img.file.name);
                                                setImageSelectorOpen(null);
                                                setImageSearchQuery('');
                                              }}
                                              className="w-full px-2 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-gray-700 truncate"
                                            >
                                              {img.file.name}
                                            </button>
                                          ))
                                        ) : (
                                          <div className="px-2 py-3 text-xs text-slate-500 dark:text-gray-400 text-center">
                                            No images found matching "{imageSearchQuery}"
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div 
                              className="p-2 space-y-1 flex-1 flex flex-col" 
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <div className="text-xs text-slate-500 dark:text-gray-400 truncate mb-1">
                                {image?.file.name || 'No file selected'}
                              </div>
                              <div className="relative">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={defect.photoNumber}
                                    onChange={(e) => updateBulkDefectPhotoNumber(defect.photoNumber, e.target.value)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    className="flex-1 p-1 text-sm border border-slate-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                                    placeholder="#"
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPhotoNumberSelectorOpen(isPhotoNumberSelectorOpen ? null : defect.photoNumber);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="p-1.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
                                    title="Select photo number"
                                  >
                                    <ChevronDown size={14} className={isPhotoNumberSelectorOpen ? 'rotate-180' : ''} />
                                  </button>
                                </div>
                                {isPhotoNumberSelectorOpen && (
                                  <div 
                                    className="photo-number-selector-dropdown absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    {availablePhotoNumbers.slice(0, 20).map((num) => (
                                      <button
                                        key={num}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateBulkDefectPhotoNumber(defect.photoNumber, num);
                                          setPhotoNumberSelectorOpen(null);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-gray-700 ${
                                          defect.photoNumber === num
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                                            : 'text-slate-700 dark:text-gray-300'
                                        }`}
                                      >
                                        {num}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 flex flex-col min-h-0" onMouseDown={(e) => e.stopPropagation()}>
                                {renderBulkDefectDescriptionField(defect)}
                              </div>
                            </div>
                          </div>
                        );
                      };
                      return <BulkDefectTile key={defect.photoNumber} />;
                    })}
                  </>
                )}
              </div>
            </SortableContext>
          </div>
        ) : (
          <BulkTextInput />
        )}
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
    </div>
  );
};