import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PDFState {
  file1: File | null;
  file2: File | null;
  showBothPDFs: boolean;
  scrollPosition1: number;
  scrollPosition2: number;
  scale1: number;
  scale2: number;
  setShowBothPDFs: (show: boolean) => void;
  setFile1: (file: File | null) => void;
  setFile2: (file: File | null) => void;
  setScrollPosition1: (position: number) => void;
  setScrollPosition2: (position: number) => void;
  setScale1: (scale: number) => void;
  setScale2: (scale: number) => void;
  clearFiles: () => void;
}

export const usePDFStore = create<PDFState>()(
  persist(
    (set) => ({
      file1: null,
      file2: null,
      showBothPDFs: false, // Always start with false - user wants single tile view
      scrollPosition1: 0,
      scrollPosition2: 0,
      scale1: 1.0,
      scale2: 1.0,
      setShowBothPDFs: (show) => set({ showBothPDFs: show }),
      setScrollPosition1: (position) => set({ scrollPosition1: position }),
      setScrollPosition2: (position) => set({ scrollPosition2: position }),
      setScale1: (scale) => set({ scale1: scale }),
      setScale2: (scale) => set({ scale2: scale }),
      setFile1: (file) => set({ file1: file }),
      setFile2: (file) => set({ file2: file }),
      clearFiles: () => set({ file1: null, file2: null }),
    }),
    {
      name: 'pdf-storage-v3',
      partialize: (state) => ({
        // We don't persist the actual files since they can't be serialized
        file1: null,
        file2: null,
        showBothPDFs: false, // Always persist as false - user wants single tile view
        scrollPosition1: state.scrollPosition1,
        scrollPosition2: state.scrollPosition2,
        scale1: state.scale1,
        scale2: state.scale2,
      }),
    }
  )
);
