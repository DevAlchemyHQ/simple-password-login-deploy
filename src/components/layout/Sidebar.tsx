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
        <div className="mt-4 sticky bottom-0 bg-slate-50 dark:bg-gray-900 pt-2 space-y-2">
          <DownloadButton />
          
          {/* Clear Canvas Link */}
          <div className="pt-3 border-t border-slate-200 dark:border-gray-700">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full text-center text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors py-2"
              title="Clear all project data"
            >
              🗑️ Clear Canvas
            </button>
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Clear Canvas?
              </h3>
            </div>
            <p className="text-slate-600 dark:text-gray-300 mb-6">
              This will <strong>permanently delete</strong> all current project data including:
            </p>
            <ul className="list-disc list-inside text-slate-600 dark:text-gray-300 mb-6 space-y-1">
              <li>All uploaded images</li>
              <li>All defect tiles and descriptions</li>
              <li>Project details (ELR, Structure No)</li>
              <li>Saved data in local storage</li>
            </ul>
            <p className="text-red-600 dark:text-red-400 text-sm font-semibold mb-6">
              ⚠️ This action cannot be undone!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCanvas}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
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