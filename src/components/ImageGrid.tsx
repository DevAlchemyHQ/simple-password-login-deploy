import React from 'react';
import { useMetadataStore } from '../store/metadataStore';
import { ImageGridItem } from './ImageGridItem';
import { GridWidthControl } from './GridWidthControl';
import { useGridWidth } from '../hooks/useGridWidth';

export const ImageGrid: React.FC = () => {
  const { images } = useMetadataStore();
  const { gridWidth, setGridWidth } = useGridWidth();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-gray-700 h-[72px] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            Uploaded Images
          </h2>
          <GridWidthControl value={gridWidth} onChange={setGridWidth} />
        </div>
        <div className="h-5">
          {images.length > 0 && (
            <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400">
              EXAM PHOTOS ({images.length})
            </h3>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-hidden">
          {images.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-gray-500">
            Please upload your Exam photos to the canvas.
            </div>
          ) : (
          <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 relative overflow-hidden">
                <ImageGridItem images={images} gridWidth={gridWidth} />
                </div>
            </div>
            </div>
          )}
      </div>
    </div>
  );
};