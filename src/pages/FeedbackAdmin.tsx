import React from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';

export const FeedbackAdmin: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <MessageSquare className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Feedback System
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              The feedback management system is currently being migrated to the new AWS infrastructure.
            </p>
          </div>

          <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Coming Soon
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  We're building a new feedback collection and management system as part of our AWS migration.
                  This feature will be available in the next update.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
