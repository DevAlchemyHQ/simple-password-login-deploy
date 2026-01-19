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
  const { file1, setFile1, loadPDFs } = usePDFStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageRotations, setPageRotations] = useState<PageRotation>({});
  const [isLoading, setIsLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
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
        const width = containerRef.current.clientWidth - 32;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    };
    
    setTimeout(updateWidth, 100);
    updateWidth();
    
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Re-measure when file changes
  useEffect(() => {
    if (file1 && containerRef.current) {
      const width = containerRef.current.clientWidth - 32;
      if (width > 0) {
        setContainerWidth(width);
      }
    }
  }, [file1]);

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
    setScale(prev => {
      const newScale = action === 'in' ? Math.min(prev + 0.1, 2.0) : Math.max(prev - 0.1, 0.5);
      return newScale;
    });
  };

  if (isInitialLoad) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-2 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-800 dark:text-white">Upload Detailed Exam</h3>
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

      <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-gray-800 p-4">
        {file1 ? (
          <Document
            file={file1}
            className="flex flex-col items-center"
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
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
                    width={containerWidth > 100 ? containerWidth * scale : 600}
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
                    className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg transition-all cursor-pointer"
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
          <div className="h-full flex items-center justify-center text-slate-400 dark:text-gray-500">
            <div className="flex flex-col items-center gap-2 text-center">
              <FileText size={40} />
              <p className="font-medium">Upload Detailed or Visual Exam</p>
              <p className="text-sm">Click the upload button above to select a PDF file</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
