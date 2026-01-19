import React, { useState } from 'react';
import { MapPin, ArrowRightLeft, Loader2 } from 'lucide-react';
import { convertToCoordinates, convertToWhat3Words } from '../../utils/what3words';
import { convertToOSGrid, convertFromOSGrid } from '../../utils/osGrid';

type ConversionMode = 'w3w-to-grid' | 'grid-to-w3w';

export const LocationReferenceConverter: React.FC = () => {
  const [mode, setMode] = useState<ConversionMode>('w3w-to-grid');
  const [w3wInput, setW3wInput] = useState('');
  const [gridInput, setGridInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results
  const [w3wToGridResult, setW3wToGridResult] = useState<{
    gridRef: string;
    lat: number;
    lng: number;
  } | null>(null);
  
  const [gridToW3wResult, setGridToW3wResult] = useState<{
    w3w: string;
    lat: number;
    lng: number;
  } | null>(null);

  const handleW3wToGrid = async () => {
    if (!w3wInput.trim()) {
      setError('Please enter a What3Words address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setW3wToGridResult(null);

    try {
      // Convert W3W to coordinates
      const coords = await convertToCoordinates(w3wInput);
      
      // Convert coordinates to OS Grid
      const gridRef = convertToOSGrid(coords.lat, coords.lng);
      
      setW3wToGridResult({
        gridRef,
        lat: coords.lat,
        lng: coords.lng
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGridToW3w = async () => {
    if (!gridInput.trim()) {
      setError('Please enter a Grid Reference');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGridToW3wResult(null);

    try {
      // Convert Grid Reference to coordinates
      const coords = convertFromOSGrid(gridInput);
      
      // Convert coordinates to W3W
      const w3w = await convertToWhat3Words(coords.lat, coords.lng);
      
      setGridToW3wResult({
        w3w,
        lat: coords.lat,
        lng: coords.lng
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setMode(mode === 'w3w-to-grid' ? 'grid-to-w3w' : 'w3w-to-grid');
    setError(null);
    setW3wToGridResult(null);
    setGridToW3wResult(null);
  };

  const handleClear = () => {
    setW3wInput('');
    setGridInput('');
    setError(null);
    setW3wToGridResult(null);
    setGridToW3wResult(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="text-indigo-500" size={24} />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Location Converter
          </h2>
        </div>
        <button
          onClick={handleModeSwitch}
          className="p-2 rounded-lg bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
          title="Switch conversion mode"
        >
          <ArrowRightLeft size={20} className="text-slate-700 dark:text-gray-300" />
        </button>
      </div>

      {mode === 'w3w-to-grid' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
              What3Words Address
            </label>
            <input
              type="text"
              value={w3wInput}
              onChange={(e) => setW3wInput(e.target.value)}
              placeholder="e.g., filled.count.soap"
              className="w-full p-2.5 text-base bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleW3wToGrid()}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleW3wToGrid}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert to Grid'
              )}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors font-semibold"
            >
              Clear
            </button>
          </div>

          {w3wToGridResult && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                  Grid Reference:
                </span>
                <span className="text-base font-bold text-green-700 dark:text-green-400">
                  {w3wToGridResult.gridRef}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                  Latitude:
                </span>
                <span className="text-sm text-slate-600 dark:text-gray-400">
                  {w3wToGridResult.lat.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                  Longitude:
                </span>
                <span className="text-sm text-slate-600 dark:text-gray-400">
                  {w3wToGridResult.lng.toFixed(6)}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
              Grid Reference
            </label>
            <input
              type="text"
              value={gridInput}
              onChange={(e) => setGridInput(e.target.value)}
              placeholder="e.g., TQ 123 456"
              className="w-full p-2.5 text-base bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleGridToW3w()}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGridToW3w}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert to W3W'
              )}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors font-semibold"
            >
              Clear
            </button>
          </div>

          {gridToW3wResult && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                  What3Words:
                </span>
                <span className="text-base font-bold text-green-700 dark:text-green-400">
                  {gridToW3wResult.w3w}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                  Latitude:
                </span>
                <span className="text-sm text-slate-600 dark:text-gray-400">
                  {gridToW3wResult.lat.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                  Longitude:
                </span>
                <span className="text-sm text-slate-600 dark:text-gray-400">
                  {gridToW3wResult.lng.toFixed(6)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
        <p className="text-xs text-slate-500 dark:text-gray-400">
          {mode === 'w3w-to-grid' 
            ? 'Enter a What3Words address (e.g., filled.count.soap) to get Grid Reference and coordinates'
            : 'Enter a Grid Reference (e.g., TQ 123 456) to get What3Words address and coordinates'
          }
        </p>
      </div>
    </div>
  );
};
