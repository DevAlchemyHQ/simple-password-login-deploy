import React, { useMemo, useState } from 'react';
import { useMetadataStore } from '../store/metadataStore';
import { ImageGridItem } from './ImageGridItem';
import { GridWidthControl } from './GridWidthControl';
import { useGridWidth } from '../hooks/useGridWidth';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';

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
        className="text-base font-semibold text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400 dark:focus:border-indigo-500 focus:outline-none transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow min-w-[200px] cursor-pointer shadow-sm"
        title="Click to edit date (including year). Press Enter to save, Escape to cancel."
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
};

export const ImageGrid: React.FC = () => {
  const { images, updateImageMetadata } = useMetadataStore();
  const { gridWidth, setGridWidth } = useGridWidth();
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

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
    const imagesToUpdate = imagesByDate.grouped[oldDate] || [];
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-3 border-b border-slate-200 dark:border-gray-700 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">
            Uploaded Images
          </h2>
          <GridWidthControl value={gridWidth} onChange={setGridWidth} />
        </div>
        {images.length > 0 && (
          <h3 className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-1">
            EXAM PHOTOS ({images.length})
          </h3>
        )}
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
        {images.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 dark:text-gray-500">
            Please upload your Exam photos to the canvas.
          </div>
        ) : (
          <div className="space-y-3 p-4 min-h-full flex flex-col">
            {/* Images grouped by date - expanded first, collapsed at bottom */}
            {sortedDatesWithCollapsed.map((date, index) => {
              const isCollapsed = collapsedDates.has(date);
              const imageCount = imagesByDate.grouped[date].length;
              const isLastExpandedGroup = !isCollapsed && 
                sortedDatesWithCollapsed.slice(index + 1).every(d => collapsedDates.has(d));
              
              return (
                <div 
                  key={date} 
                  className={`rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col ${
                    isLastExpandedGroup ? 'flex-1' : ''
                  }`}
                >
                  {/* Date Group Header with Editable Date */}
                  <div className="w-full py-3 px-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-700 border-b border-slate-200 dark:border-gray-600 backdrop-blur-sm transition-all duration-200 flex items-center justify-between gap-3 flex-shrink-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Collapse/Expand Button */}
                      <button
                        onClick={() => toggleDateCollapse(date)}
                        className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0 group"
                        title={isCollapsed ? 'Expand group' : 'Collapse group'}
                      >
                        <div className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}>
                          <ChevronDown size={20} className="text-slate-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </button>
                      
                      {/* Editable Date Input */}
                      <EditableDateInput 
                        date={date} 
                        onDateChange={updateDateForGroup} 
                      />
                      
                      <span className="text-xs font-medium text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {imageCount} {imageCount === 1 ? 'photo' : 'photos'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Images Grid (collapsible with smooth transition) */}
                  {!isCollapsed && (
                    <div className={`relative p-3 animate-in fade-in-0 slide-in-from-top-2 duration-300 ${
                      isLastExpandedGroup ? 'flex-1 min-h-0' : 'min-h-[400px] max-h-[600px]'
                    }`}>
                      <ImageGridItem images={imagesByDate.grouped[date]} gridWidth={gridWidth} />
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Images without date */}
            {imagesByDate.noDate.length > 0 && (
              <div className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10">
                <div className="flex items-center gap-3 py-3 px-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-b border-amber-200 dark:border-amber-800/50">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <span className="text-base font-semibold text-slate-700 dark:text-gray-300">No Date Assigned</span>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
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
    </div>
  );
};