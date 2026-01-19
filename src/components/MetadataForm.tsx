import React from 'react';
import { Hash, Building2 } from 'lucide-react';
import { useMetadataStore } from '../store/metadataStore';

export const MetadataForm: React.FC = () => {
  const { formData, setFormData } = useMetadataStore();

  const handleELRChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/15e638a0-fe86-4f03-83fe-b5c93b699a49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MetadataForm.tsx:9',message:'ELR input change event fired',data:{value:e.target.value,eventType:e.type},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    setFormData({ elr: e.target.value.toUpperCase() });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700">
      <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3">Project Details</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-indigo-500" />
              ELR
            </div>
          </label>
          <input
            type="text"
            value={formData.elr}
            onChange={handleELRChange}
            onFocus={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/15e638a0-fe86-4f03-83fe-b5c93b699a49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MetadataForm.tsx:27',message:'ELR input focused',data:{value:formData.elr,pointerEvents:window.getComputedStyle(e.target).pointerEvents,zIndex:window.getComputedStyle(e.target).zIndex},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H5'})}).catch(()=>{});
              // #endregion
            }}
            onKeyDown={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/15e638a0-fe86-4f03-83fe-b5c93b699a49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MetadataForm.tsx:27',message:'ELR input keydown',data:{key:e.key,defaultPrevented:e.defaultPrevented,propagationStopped:e.isPropagationStopped()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
              // #endregion
            }}
            className="w-full p-2 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all uppercase bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
            placeholder="Enter ELR"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
            <div className="flex items-center gap-2">
              <Hash size={16} className="text-indigo-500" />
              Structure No
            </div>
          </label>
          <input
            type="text"
            value={formData.structureNo}
            onChange={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/15e638a0-fe86-4f03-83fe-b5c93b699a49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MetadataForm.tsx:41',message:'Structure No input change event',data:{value:e.target.value},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
              // #endregion
              setFormData({ structureNo: e.target.value });
            }}
            onFocus={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/15e638a0-fe86-4f03-83fe-b5c93b699a49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MetadataForm.tsx:41',message:'Structure No input focused',data:{pointerEvents:window.getComputedStyle(e.target).pointerEvents},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H5'})}).catch(()=>{});
              // #endregion
            }}
            className="w-full p-2 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
            placeholder="Enter Structure No"
          />
        </div>
      </div>
    </div>
  );
};