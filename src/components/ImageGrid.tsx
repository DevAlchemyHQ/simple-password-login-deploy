import React, { useMemo, useState, useRef } from 'react';
import { useMetadataStore } from '../store/metadataStore';
import { ImageGridItem } from './ImageGridItem';
import { GridWidthControl } from './GridWidthControl';
import { useGridWidth } from '../hooks/useGridWidth';
import { Calendar, ChevronDown, CheckCircle2, Upload } from 'lucide-react';
import { DatePickerModal } from './DatePickerModal';
import { validateFileSize } from '../utils/fileValidation';

// Separate component for editable date input to maintain focus
const EditableDateInput: React.FC<{
  date: string;
  onDateChange: (oldDate: string, newDate: string) => void;
}> = ({ date, onDateChange }) => {
  const [localValue, setLocalValue] = useState(date);
  const [isEditing, setIsEditing] = useState(false);

  // Reset local value when prop changes (e.g., when date group is renamed)
  React.useEffect(() => {
    if (!isEditing) {
      setLocalValue(date);
    }
  }, [date, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue && localValue !== date) {
      onDateChange(date, localValue);
    } else if (!localValue) {
      // Reset if empty
      setLocalValue(date);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Trigger blur to save
    } else if (e.key === 'Escape') {
      setLocalValue(date); // Reset to original
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative flex-shrink-0">
      <input
        type="date"
        value={localValue}
        onChange={(e) => {
          setIsEditing(true);
          setLocalValue(e.target.value);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent focus:outline-none transition-all duration-200 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-soft min-w-[200px] cursor-pointer shadow-soft"
        title="Click to edit date (including year). Press Enter to save, Escape to cancel."
      />
    </div>
  );
};

export const ImageGrid: React.FC = () => {
  const { images, updateImageMetadata, bulkDefects, dataRestoredFromStorage, addImages } = useMetadataStore();
  const { gridWidth, setGridWidth } = useGridWidth();
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);

  // Group images by date
  const imagesByDate = useMemo(() => {
    const grouped: { [date: string]: typeof images } = {};
    const noDate: typeof images = [];

    images.forEach(img => {
      if (img.date) {
        if (!grouped[img.date]) {
          grouped[img.date] = [];
        }
        grouped[img.date].push(img);
      } else {
        noDate.push(img);
      }
    });

    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return { grouped, sortedDates, noDate };
  }, [images]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

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

  const updateDateForGroup = (oldDate: string, newDate: string) => {
    if (!newDate || oldDate === newDate) return;

    // Update all images in this group with the new date
    const imagesToUpdate = imagesByDate.grouped[oldDate];
    if (!imagesToUpdate) return; // Safety check for undefined

    imagesToUpdate.forEach(img => {
      updateImageMetadata(img.id, { date: newDate });
    });
  };

  // Sort dates: expanded groups first, collapsed groups at bottom
  const sortedDatesWithCollapsed = useMemo(() => {
    return [...imagesByDate.sortedDates].sort((a, b) => {
      const aCollapsed = collapsedDates.has(a);
      const bCollapsed = collapsedDates.has(b);
      if (aCollapsed === bCollapsed) return b.localeCompare(a); // Keep date order within each group
      return aCollapsed ? 1 : -1; // Collapsed go to bottom
    });
  }, [imagesByDate.sortedDates, collapsedDates]);

  // Check if data was restored from storage
  const hasSavedMetadata = bulkDefects.length > 0 && dataRestoredFromStorage;

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const files = Array.from(e.target.files);
      const sizeValidation = validateFileSize(files, 500);

      if (!sizeValidation.valid) {
        alert('Some files are too large. Maximum size is 500KB per file.');
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setPendingFiles(files);
      setIsDateModalOpen(true);
    }
  };

  const handleDateConfirm = async (date: string) => {
    if (!pendingFiles || pendingFiles.length === 0) return;
    if (!date || !date.trim()) {
      alert('Please select a date before uploading.');
      return;
    }

    setIsDateModalOpen(false);
    try {
      await addImages(pendingFiles, date);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPendingFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDateModalClose = () => {
    setIsDateModalOpen(false);
    setPendingFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-soft border border-neutral-200 dark:border-neutral-800 h-full flex flex-col">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        {images.length > 0 && (
          <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wide">
            Exam Photos ({images.length})
          </h3>
        )}
        {images.length === 0 && <div></div>}
        <GridWidthControl value={gridWidth} onChange={setGridWidth} />
      </div>

      <div 
        className="flex-1 min-h-0 overflow-y-auto scroll-smooth"
        style={{
          transform: 'translateZ(0)',
          WebkitOverflowScrolling: 'touch',
          willChange: 'scroll-position'
        }}
      >
        {images.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6">
            {/* Data Persistence Notification Banner */}
            {hasSavedMetadata ? (
              <div className="p-5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg flex items-start gap-3 w-full max-w-2xl">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                    Your data is safe and has been restored
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                    You have <strong className="font-semibold">{bulkDefects.length} tile{bulkDefects.length !== 1 ? 's' : ''}</strong> with saved descriptions and photo numbers.
                    <br />
                    <span className="mt-1 block">Re-upload your photos and they will <strong>automatically match</strong> to their tiles. All your work is preserved.</span>
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 dark:hover:bg-neutral-700 transition-colors text-sm font-medium"
                  >
                    <Upload size={16} />
                    <span>Upload Photos</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-neutral-400 dark:text-neutral-500 text-sm text-center">
                Please upload your Exam photos to the canvas.
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/*"
            />
          </div>
        ) : (
          <div className="space-y-4 p-4 min-h-full flex flex-col">
            {/* Images grouped by date - expanded first, collapsed at bottom */}
            {sortedDatesWithCollapsed.map((date, index) => {
              const isCollapsed = collapsedDates.has(date);
              const dateGroup = imagesByDate.grouped[date];
              if (!dateGroup) return null; // Safety check for undefined date groups
              const imageCount = dateGroup.length;
              const isLastExpandedGroup = !isCollapsed &&
                sortedDatesWithCollapsed.slice(index + 1).every(d => collapsedDates.has(d));

              return (
                <div
                  key={date}
                  className={`rounded-xl shadow-soft hover:shadow-medium transition-all duration-200 overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col ${isLastExpandedGroup ? 'flex-1' : ''
                    }`}
                >
                  {/* Date Group Header with Editable Date */}
                  <div className="w-full py-2 px-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 transition-all duration-200 flex items-center justify-between gap-3 flex-shrink-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Collapse/Expand Button */}
                      <button
                        onClick={() => toggleDateCollapse(date)}
                        className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-all duration-200 flex-shrink-0"
                        title={isCollapsed ? 'Expand group' : 'Collapse group'}
                      >
                        <div className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}>
                          <ChevronDown size={18} className="text-neutral-500 dark:text-neutral-400" />
                        </div>
                      </button>

                      {/* Editable Date Input */}
                      <EditableDateInput
                        date={date}
                        onDateChange={updateDateForGroup}
                      />

                      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
                        {imageCount} {imageCount === 1 ? 'photo' : 'photos'}
                      </span>
                    </div>
                  </div>

                  {/* Images Grid (collapsible with smooth transition) */}
                  {!isCollapsed && (
                    <div className={`relative p-3 animate-in fade-in-0 slide-in-from-top-2 duration-300 ${isLastExpandedGroup ? 'flex-1 min-h-0' : 'min-h-[400px] max-h-[600px]'
                      }`}>
                      <ImageGridItem images={imagesByDate.grouped[date]} gridWidth={gridWidth} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Images without date */}
            {imagesByDate.noDate.length > 0 && (
              <div className="rounded-xl shadow-soft hover:shadow-medium transition-all duration-200 overflow-hidden border border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-900/10">
                <div className="flex items-center gap-3 py-2 px-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No Date Assigned</span>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                    {imagesByDate.noDate.length} {imagesByDate.noDate.length === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
                <div className="relative p-3 min-h-[400px] max-h-[600px]">
                  <ImageGridItem images={imagesByDate.noDate} gridWidth={gridWidth} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <DatePickerModal
        isOpen={isDateModalOpen}
        onClose={handleDateModalClose}
        onConfirm={handleDateConfirm}
        defaultDate={undefined}
      />
    </div>
  );
};