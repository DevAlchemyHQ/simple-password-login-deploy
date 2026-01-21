import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { MetadataForm } from '../MetadataForm';
import { ImageUpload } from '../ImageUpload';
import { DownloadButton } from '../DownloadButton';
import { useMetadataStore } from '../../store/metadataStore';

export const Sidebar: React.FC = () => {
  const { reset } = useMetadataStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearCanvas = () => {
    // Clear localStorage first
    localStorage.removeItem('userProjectData');

    // Clear Zustand store
    reset();

    // Close confirmation dialog
    setShowClearConfirm(false);

    // Reload page to reset everything
    window.location.reload();
  };

  return (
    <div className="lg:col-span-2 space-y-4 overflow-container">
      <div className="space-y-4 h-full overflow-y-auto p-0.5">
        <MetadataForm />
        <ImageUpload />
        <div className="mt-4 sticky bottom-0 bg-white dark:bg-neutral-950 pt-2 space-y-2">
          <DownloadButton />

          {/* Clear Canvas Link */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full text-center text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/10"
              title="Clear all project data"
            >
              Clear Canvas
            </button>
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-large max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Clear Canvas?
              </h3>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-sm leading-relaxed">
              This will <strong>permanently delete</strong> all current project data including:
            </p>
            <ul className="list-disc list-inside text-neutral-600 dark:text-neutral-400 mb-6 space-y-1 text-sm">
              <li>All uploaded images</li>
              <li>All defect tiles and descriptions</li>
              <li>Project details (ELR, Structure No)</li>
              <li>Saved data in local storage</li>
            </ul>
            <p className="text-red-600 dark:text-red-400 text-sm font-semibold mb-6">
              This action cannot be undone!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCanvas}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Yes, Clear Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};