import React, { useState } from 'react';
import { Mail, X } from 'lucide-react';

const SUPPORT_EMAIL = 'infor@exametry.xyz';

export const FeedbackTab: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmailClick = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Support Request - Exametry`;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 bg-accent text-white p-3 rounded-xl shadow-large hover:bg-accent-dark transition-all z-40 hover:scale-105 active:scale-95"
        title="Contact Support"
      >
        <Mail size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-large w-full max-w-md border border-neutral-200 dark:border-neutral-800">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Contact Support
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-4">
                Need assistance or have suggestions? We'd love to hear from you.
              </p>
              <button
                type="button"
                onClick={handleEmailClick}
                className="w-full flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg hover:bg-accent-dark transition-colors font-medium text-sm"
              >
                <Mail size={18} /> Email Us
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
