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
  const [bertWindow, setBertWindow] = useState<Window | null>(null);

  const activeUrl = websites.find(w => w.id === activeWebsite)?.url || '';
  const activeWebsiteData = websites.find(w => w.id === activeWebsite);

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

  const handleOpenBERT = () => {
    // Close existing window if open
    if (bertWindow && !bertWindow.closed) {
      bertWindow.focus();
      return;
    }

    // Open BERT in a new window with specific dimensions
    const width = 1200;
    const height = 800;
    const left = window.screen.width - width - 100;
    const top = 100;

    const newWindow = window.open(
      'https://structures-exams.bridgeway.consulting/',
      'BERTWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,location=yes`
    );

    if (newWindow) {
      setBertWindow(newWindow);
      newWindow.focus();
    }
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
        {activeWebsite === 'bert' ? (
          // BERT requires popup window due to iframe restrictions
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-gray-900">
            <div className="text-center max-w-md p-8">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  BERT Structures Exam System
                </h3>
                <p className="text-slate-600 dark:text-gray-400 mb-6">
                  BERT requires full browser access for login and functionality. Click below to open BERT in a dedicated window.
                </p>
              </div>
              <button
                onClick={handleOpenBERT}
                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                Open BERT Window
              </button>
              <p className="text-xs text-slate-500 dark:text-gray-500 mt-4">
                The window will open to the right of your screen and stay on top while you work.
              </p>
            </div>
          </div>
        ) : (
          websites
            .filter(w => w.id !== 'bert')
            .map((website) => (
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
            ))
        )}
      </div>
    </div>
  );
};
