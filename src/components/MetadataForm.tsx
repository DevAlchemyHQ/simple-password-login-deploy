import React from 'react';
import { useMetadataStore } from '../store/metadataStore';

export const MetadataForm: React.FC = () => {
  const { formData, setFormData } = useMetadataStore();

  const handleELRChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ elr: e.target.value.toUpperCase() });
  };

  return (
    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-soft border border-neutral-200 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Structure Details</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            type="text"
            value={formData.elr}
            onChange={handleELRChange}
            className="w-full px-3 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg transition-all uppercase bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none hover:shadow-medium focus:shadow-none"
            placeholder="Enter ELR"
          />
        </div>
        <div>
          <input
            type="text"
            value={formData.structureNo}
            onChange={(e) => setFormData({ structureNo: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg transition-all bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none hover:shadow-medium focus:shadow-none"
            placeholder="Struct Ref"
          />
        </div>
      </div>
    </div>
  );
};