import React, { useMemo } from 'react';
import { useMetadataStore } from '../store/metadataStore';
import { ImageGridItem } from './ImageGridItem';
import { GridWidthControl } from './GridWidthControl';
import { useGridWidth } from '../hooks/useGridWidth';
import { Calendar } from 'lucide-react';

export const ImageGrid: React.FC = () => {
  const { images } = useMetadataStore();
  const { gridWidth, setGridWidth } = useGridWidth();

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
      
      <div className="flex-1 min-h-0 overflow-y-auto">
        {images.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 dark:text-gray-500">
            Please upload your Exam photos to the canvas.
          </div>
        ) : (
          <div className="space-y-6 p-4">
            {/* Images grouped by date */}
            {imagesByDate.sortedDates.map((date) => (
              <div key={date} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>{formatDate(date)}</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-gray-400">
                    ({imagesByDate.grouped[date].length} {imagesByDate.grouped[date].length === 1 ? 'photo' : 'photos'})
                  </span>
                </div>
                <div className="h-[400px] min-h-[400px] relative">
                  <ImageGridItem images={imagesByDate.grouped[date]} gridWidth={gridWidth} />
                </div>
              </div>
            ))}
            
            {/* Images without date */}
            {imagesByDate.noDate.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>No Date Assigned</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-gray-400">
                    ({imagesByDate.noDate.length} {imagesByDate.noDate.length === 1 ? 'photo' : 'photos'})
                  </span>
                </div>
                <div className="h-[400px] min-h-[400px] relative">
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