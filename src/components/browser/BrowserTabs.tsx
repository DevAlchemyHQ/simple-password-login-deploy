import React, { useState, useRef } from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface Website {
  id: string;
  name: string;
  url: string;
  favicon: string;
}

const websites: Website[] = [
  {
    id: 'gridfinder',
    name: 'Grid Finder',
    url: 'https://www.gridreferencefinder.com/os.php',
    favicon: 'https://www.gridreferencefinder.com/favicon.ico'
  },
  {
    id: 'what3words',
    name: 'What3Words',
    url: 'https://what3words.com/',
    favicon: 'https://what3words.com/favicon.ico'
  }
];

export const BrowserTabs: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState(50); // Percentage
  const [isSwapped, setIsSwapped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const leftSite = isSwapped ? websites[1] : websites[0];
  const rightSite = isSwapped ? websites[0] : websites[1];

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Constrain between 20% and 80%
    setLeftWidth(Math.min(Math.max(newWidth, 20), 80));
  }, []);

  const handleMouseUp = React.useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  React.useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleSwap = () => {
    setIsSwapped(!isSwapped);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Header with Swap Button */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
            {leftSite.name}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
            {rightSite.name}
          </span>
        </div>
        <button
          onClick={handleSwap}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Swap positions"
        >
          <ArrowLeftRight size={16} className="text-slate-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Split View */}
      <div ref={containerRef} className="flex-1 flex relative">
        {/* Left Panel */}
        <div style={{ width: `${leftWidth}%` }} className="relative">
          {isDragging && (
            <div className="absolute inset-0 z-10 cursor-col-resize" />
          )}
          <iframe
            src={leftSite.url}
            className="w-full h-full border-0"
            title={leftSite.name}
            allow="fullscreen; geolocation; microphone; camera; payment; autoplay; encrypted-media"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
          />
        </div>

        {/* Resizable Divider */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-1 bg-slate-300 dark:bg-gray-600 hover:bg-indigo-500 dark:hover:bg-indigo-600 cursor-col-resize transition-colors flex-shrink-0 ${
            isDragging ? 'bg-indigo-500 dark:bg-indigo-600' : ''
          }`}
          style={{ cursor: 'col-resize' }}
        />

        {/* Right Panel */}
        <div style={{ width: `${100 - leftWidth}%` }} className="relative">
          {isDragging && (
            <div className="absolute inset-0 z-10 cursor-col-resize" />
          )}
          <iframe
            src={rightSite.url}
            className="w-full h-full border-0"
            title={rightSite.name}
            allow="fullscreen; geolocation; microphone; camera; payment; autoplay; encrypted-media"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
          />
        </div>
      </div>
    </div>
  );
};
