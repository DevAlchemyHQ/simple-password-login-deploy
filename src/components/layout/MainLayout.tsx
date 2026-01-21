import React, { useState, useEffect } from 'react';
import { Header } from '../Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { SelectedImagesPanel } from '../SelectedImagesPanel';
import { GridReferenceFinder } from '../GridReferenceFinder/GridReferenceFinder';
import { PDFViewer } from '../PDFViewer/PDFViewer';
import { PDFViewerLeft } from '../PDFViewer/PDFViewerLeft';
import { CalculatorTabs } from '../calculators/CalculatorTabs';
import { BrowserTabs } from '../browser/BrowserTabs';
import { Loader2, Brain } from 'lucide-react';
import { useMetadataStore } from '../../store/metadataStore';
import { usePDFStore } from '../../store/pdfStore';
import { FeedbackTab } from '../FeedbackTab';
import { useLocation } from 'react-router-dom';

type TabType = 'images' | 'pdf' | 'calculator' | 'bcmi' | 'grid' | 'browser';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const { images, selectedImages, loadUserData } = useMetadataStore();
  const { file1, file2, showBothPDFs, setShowBothPDFs } = usePDFStore();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isPDFExpanded, setIsPDFExpanded] = useState(false);

  // Load user data only on initial mount
  useEffect(() => {
    const initialLoad = async () => {
      try {
        await loadUserData();
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoadingData(false);
        setIsInitialLoad(false);
      }
    };
    initialLoad();
  }, []); // Empty dependency array for initial load only

  // Auto-save changes
  useEffect(() => {
    if (images.length > 0 && !isInitialLoad) {
      const saveTimeout = setTimeout(() => {
        useMetadataStore.getState().saveUserData().catch(error => {
          console.error('Error saving user data:', error);
        });
      }, 1000);

      return () => clearTimeout(saveTimeout);
    }
  }, [images, selectedImages, isInitialLoad]);

  // If we're rendering children (like the profile page), just show the header
  if (children) {
    return (
      <>
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        {children}
        <FeedbackTab />
      </>
    );
  }

  // Show loading screen on initial load
  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">Loading your project...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white dark:bg-neutral-950 flex flex-col overflow-hidden">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 max-w-[1920px] mx-auto w-full px-2 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full">
            {/* Images Tab */}
            <div className={`h-full ${activeTab === 'images' ? '' : 'hidden'}`}>
              <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-2 overflow-hidden">
                  <Sidebar />
                </div>
                <MainContent />
              </div>
            </div>

            {/* Browser Tab */}
            <div className={`h-full ${activeTab === 'browser' ? '' : 'hidden'}`}>
              <div className="h-full overflow-hidden">
                <BrowserTabs />
              </div>
            </div>

            {/* PDF Tab */}
            <div className={`lg:col-span-10 h-full overflow-hidden ${activeTab === 'pdf' ? '' : 'hidden'}`}>
              {/* Single PDF + Image Tiles View */}
              <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden min-h-0 ${!showBothPDFs ? '' : 'hidden'}`}>
                {/* Left PDF Viewer */}
                <div className="h-full overflow-hidden lg:col-span-7 min-h-0">
                  <PDFViewerLeft onToggleBoth={() => setShowBothPDFs(true)} />
                </div>

                {/* Selected Images Panel on right side */}
                <div className="h-full overflow-hidden lg:col-span-5 min-h-0">
                  <SelectedImagesPanel
                    key="pdf-panel"
                    onExpand={() => setIsPDFExpanded(!isPDFExpanded)}
                    isExpanded={isPDFExpanded}
                    activeDragId={null}
                    overDragId={null}
                    activeTab="browser"
                  />
                </div>
              </div>

              {/* Both PDFs View */}
              <div className={`h-full overflow-hidden ${showBothPDFs ? '' : 'hidden'}`}>
                <PDFViewer onToggleBack={() => setShowBothPDFs(false)} />
              </div>
            </div>

            {/* Calculator Tab */}
            <div className={`h-full ${activeTab === 'calculator' ? '' : 'hidden'}`}>
              <CalculatorTabs />
            </div>

            {/* Grid Tab */}
            <div className={`h-full ${activeTab === 'grid' ? '' : 'hidden'}`}>
              <GridReferenceFinder />
            </div>

            {/* BCMI Tab */}
            <div className={`h-full flex items-center justify-center text-slate-400 dark:text-gray-500 ${activeTab === 'bcmi' ? '' : 'hidden'}`}>
              <div className="text-center">
                <Brain size={48} className="mx-auto mb-4 opacity-50" />
                <p>BCMI & AI features coming soon!</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FeedbackTab />
    </div>
  );
};