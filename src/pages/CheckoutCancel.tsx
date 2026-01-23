import React from 'react';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CheckoutCancel: React.FC = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 p-6">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full">
            <XCircle className="w-16 h-16 text-neutral-600 dark:text-neutral-400" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
              Checkout Cancelled
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg">
              No worries! Your subscription was not created.
            </p>
          </div>

          <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Need help?
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  If you experienced any issues during checkout, please contact our support team. You can still use your free downloads.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-neutral-800 text-white rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors font-medium"
            >
              <ArrowLeft size={18} />
              Return to app
            </button>

            <p className="text-xs text-center text-neutral-500 dark:text-neutral-500">
              You can upgrade to Pro anytime from the download screen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
