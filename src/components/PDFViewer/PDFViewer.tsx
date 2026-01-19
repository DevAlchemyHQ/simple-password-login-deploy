import React, { useState, useEffect, useRef } from 'react';
import { FileText, ZoomIn, ZoomOut, Upload, RotateCw, Loader2, ArrowLeft } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { usePDFStore } from '../../store/pdfStore';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerSectionProps {
  title: string;
  file: File | null;
  scale: number;
  onFileChange: (file: File | null) => void;
  onZoom: (action: 'in' | 'out') => void;
}

interface PageRotation {
  [pageNumber: number]: number;
}

const PDFViewerSection: React.FC<PDFViewerSectionProps> = ({
  title,
  file,
  scale,
  onFileChange,
  onZoom,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageRotations, setPageRotations] = useState<PageRotation>({});
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Measure container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth - 32; // subtract padding
        console.log('[PDFViewer] Container width:', width);
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

  // Re-measure when file changes
  useEffect(() => {
    if (file && containerRef.current) {
      const width = containerRef.current.clientWidth - 32;
      if (width > 0) {
        setContainerWidth(width);
      }
    }
  }, [file]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setIsLoading(true);
      try {
        await onFileChange(file);
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


  return (
    <div ref={containerRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-[calc(100vh-96px)] flex flex-col">
      <div className="p-2 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-800 dark:text-white">{title}</h3>
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Zoom] Zoom Out clicked');
                onZoom('out');
              }}
              type="button"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
              title="Zoom Out"
              style={{ pointerEvents: 'auto' }}
            >
              <ZoomOut size={16} className="text-slate-600 dark:text-white" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Zoom] Zoom In clicked, current scale:', scale);
                onZoom('in');
              }}
              type="button"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
              title="Zoom In"
              style={{ pointerEvents: 'auto' }}
            >
              <ZoomIn size={16} className="text-slate-600 dark:text-white" />
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-gray-800 p-4">
        {file ? (
          <Document
            file={file}
            className="flex flex-col items-center"
            onLoadSuccess={async ({ numPages }) => {
              setNumPages(numPages);
              await loadPDF(file);
            }}
            loading={
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            }
          >
            {Array.from(new Array(numPages), (_, index) => {
              return (
                <div
                  key={`page-${index + 1}`}
                  className="mb-4 relative"
                  data-page-number={index + 1}
                >
                  <div className="relative" style={{ pointerEvents: 'none' }}>
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
              );
            })}
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

const loadPDF = async (file: File) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    return pdf;
  } catch (error) {
    console.error('Error loading PDF:', error);
    return null;
  }
};

interface PDFViewerProps {
  onToggleBack?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ onToggleBack }) => {
  const { file1, file2, setFile1, setFile2, loadPDFs } = usePDFStore();
  const [scale1, setScale1] = useState(1.0);
  const [scale2, setScale2] = useState(1.0);
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

  const handleZoom = (viewer: 1 | 2, action: 'in' | 'out') => {
    const setScale = viewer === 1 ? setScale1 : setScale2;
    const currentScale = viewer === 1 ? scale1 : scale2;
    console.log(`[Zoom] Viewer ${viewer}, action: ${action}, current scale: ${currentScale}`);

    setScale(prev => {
      const newScale = action === 'in' ? Math.min(prev + 0.1, 2.0) : Math.max(prev - 0.1, 0.5);
      console.log(`[Zoom] New scale: ${newScale}`);
      return newScale;
    });
  };

  if (isInitialLoad) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">Loading PDFs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Back button */}
      {onToggleBack && (
        <div className="mb-2">
          <button
            onClick={onToggleBack}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Single PDF + Tiles
          </button>
        </div>
      )}
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        {/* PDF Viewer 1 */}
        <PDFViewerSection
          title="Upload Detailed Exam"
          file={file1}
          scale={scale1}
          onFileChange={setFile1}
          onZoom={(action) => handleZoom(1, action)}
        />

        {/* PDF Viewer 2 */}
        <PDFViewerSection
          title="Upload Visual Exam"
          file={file2}
          scale={scale2}
          onFileChange={setFile2}
          onZoom={(action) => handleZoom(2, action)}
        />
      </div>
    </div>
  );
};