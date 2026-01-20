import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface OversizedFile {
  name: string;
  sizeKB: number;
}

interface ImageSizeCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  oversizedFiles: OversizedFile[];
  totalFiles: number;
  averageSizeKB: number;
  maxSizeKB: number;
}

export const ImageSizeCheckModal: React.FC<ImageSizeCheckModalProps> = ({
  isOpen,
  onClose,
  oversizedFiles,
  totalFiles,
  averageSizeKB,
  maxSizeKB
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Image Size Warning
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Warning Summary */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-1">
              {oversizedFiles.length} of {totalFiles} images exceed {maxSizeKB}KB
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Average size: <strong>{averageSizeKB.toFixed(0)}KB</strong>
            </p>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              💡 Recommendations:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Resize images to under {maxSizeKB}KB</li>
              <li>• Use image compression tools</li>
              <li>• Reduce image dimensions (e.g., 1920x1080)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
          >
            Select Different Files
          </button>
        </div>
      </div>
    </div>
  );
};
