import React, { useState, useRef } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { useMetadataStore } from '../store/metadataStore';
import { validateDescription } from '../utils/fileValidation';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DefectTile } from './DefectTile';
import { BatchDefectImageViewer } from './BatchDefectImageViewer';
import { ImageMetadata } from '../types';

interface ParsedEntry {
  photoNumber: string;
  description: string;
}

export const BulkTextInput: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { updateImageMetadata, images, bulkDefects, setBulkDefects, updateBulkDefectFile } = useMetadataStore();
  const [bulkText, setBulkText] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const deleteDefect = (photoNumber: string) => {
    setBulkDefects((items) => {
      const newItems = items.filter((item) => item.photoNumber !== photoNumber);
      // Renumber remaining items
      return newItems.map((item, index) => ({
        ...item,
        photoNumber: String(index + 1),
      }));
    });
  };

  const handleBulkPaste = () => {
    const lines = bulkText.split('\n').filter(line => line.trim());

    // Validate each line for special characters
    const invalidLines = lines.filter(line => !validateDescription(line.trim()).isValid);
    if (invalidLines.length > 0) {
      setError('Some descriptions contain invalid characters (/ or \\). Please remove them before proceeding.');
      return;
    }

    setBulkDefects((prev) => {
      const sortedPrev = [...prev].sort((a, b) => parseInt(a.photoNumber || '0') - parseInt(b.photoNumber || '0'));
      const newDefects = lines.map((line) => ({
        photoNumber: '',
        description: line.trim(),
        selectedFile: ''
      }));

      const allDefects = [...sortedPrev, ...newDefects];
      // Renumber all items
      return allDefects.map((item, index) => ({
        ...item,
        photoNumber: String(index + 1),
      }));
    });

    setBulkText('');
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
  };

  const updateDefectDescription = (photoNumber: string, description: string) => {
    // Validate description for special characters
    const { isValid, invalidChars } = validateDescription(description);
    if (!isValid) {
      setError(`Invalid characters found: ${invalidChars.join(' ')}`);
      return;
    }
    setError(null);

    setBulkDefects((items) =>
      items.map((item) =>
        item.photoNumber === photoNumber ? { ...item, description } : item
      )
    );
  };

  const updateDefectFile = (photoNumber: string, fileName: string) => {
    updateBulkDefectFile(photoNumber, fileName);
  };

  const handlePhotoNumberClick = (photoNumber: string) => {
    // Get all defects with images, sorted by photo number
    const defectsWithImages = bulkDefects
      .filter(defect => defect.selectedFile)
      .sort((a, b) => parseInt(a.photoNumber) - parseInt(b.photoNumber));

    // Find the index of the clicked defect
    const index = defectsWithImages.findIndex(defect => defect.photoNumber === photoNumber);

    if (index !== -1) {
      setViewerInitialIndex(index);
      setViewerOpen(true);
    }
  };

  const handleDeleteImageFromDefect = (defectId: string) => {
    // Clear the selectedFile for this defect
    updateBulkDefectFile(defectId, '');

    // If this was the last image, close viewer
    const remainingDefects = bulkDefects.filter(defect =>
      defect.selectedFile && defect.photoNumber !== defectId
    );

    if (remainingDefects.length === 0) {
      setViewerOpen(false);
    }
  };

  // Prepare defects for viewer
  const defectsForViewer = React.useMemo(() => {
    if (!viewerOpen) return [];

    return bulkDefects
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
  }, [bulkDefects, images, viewerOpen]);

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={bulkText}
              placeholder="Paste multiple defect descriptions here, one per line..."
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full min-h-[96px] p-2 text-sm border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-white resize-y"
              style={{ height: Math.max(96, Math.min(300, 24 * (bulkText.split('\n').length + 2))) + 'px' }}
            />
            <button
              onClick={handleBulkPaste}
              disabled={!bulkText.trim()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${bulkText.trim()
                ? 'bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700'
                : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600 opacity-50 cursor-not-allowed'
                }`}
            >
              <FileText size={16} />
              <span className="text-sm">Process Bulk Text</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SortableContext
          items={bulkDefects.map((d) => d.photoNumber)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {/* Sort defects by photo number to ensure correct order */}
            {[...bulkDefects]
              .sort((a, b) => parseInt(a.photoNumber || '0') - parseInt(b.photoNumber || '0'))
              .map((defect) => (
                <DefectTile
                  key={defect.photoNumber}
                  id={defect.photoNumber}
                  photoNumber={defect.photoNumber}
                  description={defect.description}
                  selectedFile={defect.selectedFile}
                  availableFiles={images.map((img) => img.file.name)}
                  onDelete={() => deleteDefect(defect.photoNumber)}
                  onDescriptionChange={(value) =>
                    updateDefectDescription(defect.photoNumber, value)
                  }
                  onFileChange={(fileName) => updateDefectFile(defect.photoNumber, fileName)}
                  onPhotoNumberClick={handlePhotoNumberClick}
                  onAddBelow={() => addDefectBelow(defect.photoNumber)}
                />
              ))}
          </div>
        </SortableContext>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <AlertCircle size={18} />
          <p className="text-sm">{error}</p>
        </div>
      )}

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
