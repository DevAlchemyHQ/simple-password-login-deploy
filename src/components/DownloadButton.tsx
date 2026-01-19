import React, { useState } from 'react';
import { Download, AlertCircle, Loader2 } from 'lucide-react';
import { useMetadataStore } from '../store/metadataStore';
import { useValidation } from '../hooks/useValidation';
import { useAnalytics } from '../hooks/useAnalytics';
import { validateDescription } from '../utils/fileValidation';
import { handleSingleSelectDownload, handleBatchDragDownload } from '../utils/downloadUtils';

export const DownloadButton: React.FC = () => {
  const { images, selectedImages, formData, bulkDefects } = useMetadataStore();
  const { isValid, getValidationErrors } = useValidation();
  const { trackEvent } = useAnalytics();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically detect mode based on whether tiles exist
  const isBatchMode = bulkDefects.length > 0;

  // ============================================
  // SINGLE SELECT MODE - Special Characters Check
  // ============================================
  const hasSpecialCharactersSingleSelect = React.useMemo(() => {
    if (isBatchMode) return false;
    const selectedImagesList = images.filter(img => selectedImages.has(img.id));
    return selectedImagesList.some(img => !validateDescription(img.description || '').isValid);
  }, [isBatchMode, images, selectedImages]);

  // ============================================
  // BATCH DRAG MODE - Special Characters Check
  // ============================================
  const hasSpecialCharactersBatchDrag = React.useMemo(() => {
    if (!isBatchMode) return false;
    const defectsWithImages = bulkDefects.filter(defect => defect.selectedFile);
    return defectsWithImages.some(defect => 
      !validateDescription(defect.description || '').isValid
    );
  }, [isBatchMode, bulkDefects]);

  // ============================================
  // DOWNLOAD HANDLER - Routes to appropriate mode
  // ============================================
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      
      if (isBatchMode) {
        // BATCH DRAG MODE DOWNLOAD - when tiles exist
        await handleBatchDragDownload(
          images,
          bulkDefects,
          formData,
          trackEvent
        );
      } else {
        // SINGLE SELECT MODE DOWNLOAD - when no tiles exist
        await handleSingleSelectDownload(
          images,
          selectedImages,
          formData,
          trackEvent
        );
      }
    } catch (error) {
      console.error('Error creating download package:', error);
      setError(error instanceof Error ? error.message : 'Failed to create download package');
    } finally {
      setIsDownloading(false);
    }
  };

  // ============================================
  // UI STATE
  // ============================================
  const errors = getValidationErrors();
  const hasSpecialCharacters = isBatchMode
    ? hasSpecialCharactersBatchDrag 
    : hasSpecialCharactersSingleSelect;
  const isDownloadDisabled = !isValid() || isDownloading || hasSpecialCharacters;

  // Button text based on mode
  const buttonText = isBatchMode
    ? (isDownloading ? 'Creating Batch Package...' : 'Download Batch Package')
    : (isDownloading ? 'Creating Package...' : 'Download Package');

  return (
    <div className="space-y-2">
      <button
        onClick={handleDownload}
        disabled={isDownloadDisabled}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all ${
          isDownloadDisabled
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
            : 'bg-green-500 text-white hover:bg-green-600 shadow-sm hover:shadow-md'
        }`}
      >
        {isDownloading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Download size={20} />
        )}
        {buttonText}
      </button>

      {(error || (!isValid() && errors.length > 0) || hasSpecialCharacters) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              {error ? (
                <p>{error}</p>
              ) : hasSpecialCharacters ? (
                <p>Remove special characters from defect descriptions before downloading</p>
              ) : (
                <>
                  <p className="font-medium mb-1">Please complete the following:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};