import React from 'react';
import { useMetadataStore } from '../store/metadataStore';

export const MetadataForm: React.FC = () => {
  const { formData, setFormData } = useMetadataStore();

  const handleELRChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ elr: e.target.value.toUpperCase() });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Structure Details</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            type="text"
            value={formData.elr}
            onChange={handleELRChange}
            className="w-full p-2 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all uppercase bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
            placeholder="Enter ELR"
          />
        </div>
        <div>
          <input
            type="text"
            value={formData.structureNo}
            onChange={(e) => setFormData({ structureNo: e.target.value })}
            className="w-full p-2 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
            placeholder="Struct Ref"
          />
        </div>
      </div>
    </div>
  );
};