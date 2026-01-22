import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
  defaultDate?: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultDate
}) => {
  const [selectedDate, setSelectedDate] = useState(
    defaultDate || new Date().toISOString().split('T')[0]
  );

  // Update selectedDate when defaultDate changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedDate(defaultDate || new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, defaultDate]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-xl shadow-large max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <Calendar className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </div>
            Select Examination Date
          </h3>
          <button
            onClick={handleCancel}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
          Choose the date when the examination was undertaken. All images in this batch will be assigned this date.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Examination Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-all bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
            required
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDate}
            className="px-4 py-2.5 text-sm font-medium text-white bg-black dark:bg-neutral-800 rounded-lg hover:bg-neutral-900 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm & Upload
          </button>
        </div>
      </div>
    </div>
  );
};
