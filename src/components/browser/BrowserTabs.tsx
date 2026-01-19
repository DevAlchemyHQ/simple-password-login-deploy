import React, { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, ExternalLink } from 'lucide-react';

interface Website {
  id: string;
  name: string;
  url: string;
  favicon: string;
}

const websites: Website[] = [
  {
    id: 'bert',
    name: 'BERT',
    url: 'https://structures-exams.bridgeway.consulting/',
    favicon: 'https://structures-exams.bridgeway.consulting/favicon.ico'
  },
  {
    id: 'what3words',
    name: 'What3Words',
    url: 'https://what3words.com/',
    favicon: 'https://what3words.com/favicon.ico'
  },
  {
    id: 'gridfinder',
    name: 'Grid Finder',
    url: 'https://www.gridreferencefinder.com/os.php',
    favicon: 'https://www.gridreferencefinder.com/favicon.ico'
  }
];

export const BrowserTabs: React.FC = () => {
  const [activeWebsite, setActiveWebsite] = useState<string>(websites[0].id);
  const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});

  const activeUrl = websites.find(w => w.id === activeWebsite)?.url || '';

  const handleBack = () => {
    const iframe = iframeRefs.current[activeWebsite];
    if (iframe?.contentWindow) {
      iframe.contentWindow.history.back();
    }
  };

  const handleForward = () => {
    const iframe = iframeRefs.current[activeWebsite];
    if (iframe?.contentWindow) {
      iframe.contentWindow.history.forward();
    }
  };

  const handleRefresh = () => {
    const iframe = iframeRefs.current[activeWebsite];
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const handleOpenInNewTab = () => {
    window.open(activeUrl, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Website Sub-tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-gray-700 px-2">
        {websites.map((website) => (
          <button
            key={website.id}
            onClick={() => setActiveWebsite(website.id)}
            className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
              activeWebsite === website.id
                ? 'border-b-2 border-indigo-500 text-indigo-500 font-medium'
                : 'text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <img 
              src={website.favicon} 
              alt={website.name}
              className="w-4 h-4"
              onError={(e) => {
                // Fallback to a generic globe icon if favicon fails
                e.currentTarget.style.display = 'none';
              }}
            />
            <span>{website.name}</span>
          </button>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1 px-2 py-2 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
        <button
          onClick={handleBack}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Back"
        >
          <ArrowLeft size={16} className="text-slate-600 dark:text-gray-300" />
        </button>
        <button
          onClick={handleForward}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Forward"
        >
          <ArrowRight size={16} className="text-slate-600 dark:text-gray-300" />
        </button>
        <button
          onClick={handleRefresh}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Refresh"
        >
          <RotateCw size={16} className="text-slate-600 dark:text-gray-300" />
        </button>
        <div className="flex-1 px-3 py-1 bg-white dark:bg-gray-800 rounded text-xs text-slate-600 dark:text-gray-400 truncate">
          {activeUrl}
        </div>
        <button
          onClick={handleOpenInNewTab}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Open in new tab"
        >
          <ExternalLink size={16} className="text-slate-600 dark:text-gray-300" />
        </button>
      </div>

      {/* iframes */}
      <div className="flex-1 relative">
        {websites.map((website) => (
          <iframe
            key={website.id}
            ref={(el) => (iframeRefs.current[website.id] = el)}
            src={website.url}
            className={`absolute inset-0 w-full h-full border-0 ${
              activeWebsite === website.id ? 'block' : 'hidden'
            }`}
            title={website.name}
            allow="fullscreen; geolocation; microphone; camera; payment; autoplay; encrypted-media"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ))}
      </div>
    </div>
  );
};
