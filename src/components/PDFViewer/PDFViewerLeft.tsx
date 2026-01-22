import React, { useState, useEffect, useRef } from 'react';
import { FileText, ZoomIn, ZoomOut, Upload, RotateCw, Loader2, Columns } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { usePDFStore } from '../../store/pdfStore';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PageRotation {
  [pageNumber: number]: number;
}

interface PDFViewerLeftProps {
  onToggleBoth: () => void;
}

export const PDFViewerLeft: React.FC<PDFViewerLeftProps> = ({ onToggleBoth }) => {
  const { file1, setFile1, loadPDFs, scrollPosition1, setScrollPosition1, scale1, setScale1 } = usePDFStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageRotations, setPageRotations] = useState<PageRotation>({});
  const [isLoading, setIsLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load PDFs on initial mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        await loadPDFs();
      } finally {
        setIsInitialLoad(false);
      }
    };
    loadFiles();
  }, []);

  // Measure container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Subtract padding (p-4 = 16px on each side = 32px total)
        const width = containerRef.current.clientWidth - 32;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    };

    // Initial measurement with delay to ensure DOM is ready
    setTimeout(updateWidth, 100);
    updateWidth();

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Re-measure when scale changes to ensure proper fit
  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth - 32;
      if (width > 0) {
        setContainerWidth(width);
      }
    }
  }, [scale1]);

  // Re-measure when file or scale changes
  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth - 32;
      if (width > 0) {
        setContainerWidth(width);
      }
    }
  }, [file1, scale1]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setIsLoading(true);
      try {
        await setFile1(file);
      } finally {
        setIsLoading(false);
      }
      setPageRotations({});
    }
  };

  const handleRotatePage = (pageNumber: number) => {
    setPageRotations(prev => ({
      ...prev,
      [pageNumber]: ((prev[pageNumber] || 0) + 90) % 360
    }));
  };

  const handleZoom = (action: 'in' | 'out') => {
    setScale1(prev => {
      const newScale = action === 'in' ? Math.min(prev + 0.1, 2.0) : Math.max(prev - 0.1, 0.5);
      return newScale;
    });
  };

  // Restore scroll position when component mounts or becomes visible
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Restore scroll position after PDF is rendered
    const restoreScroll = () => {
      if (scrollContainer && scrollPosition1 > 0) {
        scrollContainer.scrollTop = scrollPosition1;
      }
    };

    // Try immediately, then after delays to ensure PDF is rendered
    restoreScroll();
    const timeoutId = setTimeout(restoreScroll, 200);
    const timeoutId2 = setTimeout(restoreScroll, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [file1, numPages, scrollPosition1]);

  // Save scroll position on scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setScrollPosition1(scrollContainer.scrollTop);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [setScrollPosition1]);

  if (isInitialLoad) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-neutral-900 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-700 dark:text-neutral-300 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm h-full flex flex-col overflow-hidden">
      <div className="p-2 border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-800 dark:text-white">Upload detailed report/Site notes</h3>
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
              title="Upload PDF"
            >
              {isLoading ? (
                <Loader2 size={16} className="text-slate-600 dark:text-white animate-spin" />
              ) : (
                <Upload size={16} className="text-slate-600 dark:text-white" />
              )}
            </button>
            <button
              onClick={() => handleZoom('out')}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} className="text-slate-600 dark:text-white" />
            </button>
            <button
              onClick={() => handleZoom('in')}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} className="text-slate-600 dark:text-white" />
            </button>
            <button
              onClick={onToggleBoth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Show both PDFs (Detailed + Visual)"
            >
              <Columns size={16} className="text-slate-600 dark:text-white" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white dark:bg-neutral-900 p-4"
      >
        {file1 ? (
          <Document
            file={file1}
            className="flex flex-col items-center"
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-700 dark:text-neutral-300" />
              </div>
            }
          >
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page-${index + 1}`}
                className="mb-4 relative"
                data-page-number={index + 1}
              >
                <div className="relative">
                  <Page
                    pageNumber={index + 1}
                    width={containerWidth > 100 ? containerWidth * scale1 : containerWidth > 0 ? containerWidth : 600}
                    rotate={pageRotations[index + 1] || 0}
                    className="shadow-lg bg-white"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
                <div className="absolute top-2 right-2 flex gap-2 z-50" style={{ pointerEvents: 'auto' }}>
                  <div className="text-xs bg-black/70 text-white px-2 py-1 rounded" style={{ pointerEvents: 'none' }}>
                    Page {index + 1}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRotatePage(index + 1);
                    }}
                    className="p-2 bg-black dark:bg-neutral-800 hover:bg-neutral-900 dark:hover:bg-neutral-700 text-white rounded-full shadow-lg transition-all cursor-pointer"
                    title="Rotate Page"
                    type="button"
                  >
                    <RotateCw size={16} />
                  </button>
                </div>
              </div>
            ))}
          </Document>
        ) : (
          <div
            className="h-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-800">
                <Upload size={48} className="text-neutral-700 dark:text-neutral-300" />
              </div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">Upload detailed report/Site notes</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Click here or the upload button above to select a PDF file</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
