import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useMetadataStore } from '../store/metadataStore';
import { ImageGridItem } from './ImageGridItem';
import { GridWidthControl } from './GridWidthControl';
import { useGridWidth } from '../hooks/useGridWidth';
import { Calendar, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { format, parse } from 'date-fns';

export const ImageGrid: React.FC = () => {
  const { images, updateImageMetadata } = useMetadataStore();
  const { gridWidth, setGridWidth } = useGridWidth();
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [savedDates, setSavedDates] = useState<string[]>([]);
  const dateInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Load saved dates from localStorage on mount
  useEffect(() => {
    const loadSavedDates = () => {
      try {
        const storedData = localStorage.getItem('userProjectData');
        if (storedData) {
          const projectData = JSON.parse(storedData);
          if (projectData.images && Array.isArray(projectData.images)) {
            const uniqueDates = [...new Set(
              projectData.images
                .map((img: any) => img.date)
                .filter((date: any) => date)
            )] as string[];
            setSavedDates(uniqueDates.sort().reverse());
          }
        }
      } catch (error) {
        console.error('Error loading saved dates:', error);
      }
    };
    
    loadSavedDates();
  }, []);

  // Update saved dates when images change
  useEffect(() => {
    if (images.length > 0) {
      const uniqueDates = [...new Set(
        images.map(img => img.date).filter(date => date)
      )] as string[];
      setSavedDates(uniqueDates.sort().reverse());
    }
  }, [images]);

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
          <div className="h-full flex flex-col items-center justify-center p-6 space-y-4">
            <div className="text-slate-400 dark:text-gray-500 text-center">
              Please upload your Exam photos to the canvas.
            </div>
            
            {/* Data Safety Warning */}
            {savedDates.length > 0 && (
              <div className="w-full max-w-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      Your data is safe!
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      All project details, photo numbers, descriptions, and dates are saved. 
                      Only the images need to be re-uploaded.
                    </p>
                    {savedDates.length > 0 && (
                      <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Saved dates:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {savedDates.map(date => (
                            <span
                              key={date}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium"
                            >
                              <Calendar className="w-3 h-3" />
                              {format(new Date(date), 'dd/MM/yyyy')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-4 h-full flex flex-col">
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
                    isLastExpandedGroup ? 'flex-1 min-h-0' : ''
                  }`}
                >
                  {/* Date Group Header with Editable Date */}
                  <div className="w-full py-3 px-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-700 border-b border-slate-200 dark:border-gray-600 backdrop-blur-sm transition-all duration-200 flex items-center justify-between gap-3">
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
                      
                      {/* Custom Date Input (DD/MM/YYYY) */}
                      <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-200 dark:focus-within:ring-indigo-800 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-sm hover:shadow">
                        <input
                          type="text"
                          value={date.split('-')[2]}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const day = e.target.value.replace(/\D/g, '').slice(0, 2);
                            const [year, month] = date.split('-');
                            if (day === '') {
                              updateDateForGroup(date, `${year}-${month}-01`);
                            } else if (parseInt(day) >= 1 && parseInt(day) <= 31) {
                              updateDateForGroup(date, `${year}-${month}-${day.padStart(2, '0')}`);
                            }
                          }}
                          placeholder="DD"
                          maxLength={2}
                          className="w-8 text-center text-base font-semibold text-slate-700 dark:text-gray-300 bg-transparent focus:outline-none"
                        />
                        <span className="text-slate-400">/</span>
                        <input
                          type="text"
                          value={date.split('-')[1]}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const month = e.target.value.replace(/\D/g, '').slice(0, 2);
                            const [year, , day] = date.split('-');
                            if (month === '') {
                              updateDateForGroup(date, `${year}-01-${day}`);
                            } else if (parseInt(month) >= 1 && parseInt(month) <= 12) {
                              updateDateForGroup(date, `${year}-${month.padStart(2, '0')}-${day}`);
                            }
                          }}
                          placeholder="MM"
                          maxLength={2}
                          className="w-8 text-center text-base font-semibold text-slate-700 dark:text-gray-300 bg-transparent focus:outline-none"
                        />
                        <span className="text-slate-400">/</span>
                        <input
                          type="text"
                          value={date.split('-')[0]}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const year = e.target.value.replace(/\D/g, '').slice(0, 4);
                            const [, month, day] = date.split('-');
                            if (year === '') {
                              updateDateForGroup(date, `2026-${month}-${day}`);
                            } else if (year.length === 4 && parseInt(year) >= 1900 && parseInt(year) <= 2100) {
                              updateDateForGroup(date, `${year}-${month}-${day}`);
                            }
                          }}
                          placeholder="YYYY"
                          maxLength={4}
                          className="w-12 text-center text-base font-semibold text-slate-700 dark:text-gray-300 bg-transparent focus:outline-none"
                        />
                      </div>
                      
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