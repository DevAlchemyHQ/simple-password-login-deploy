import { create } from 'zustand';
import { useMetadataStore } from './metadataStore';
import { usePDFStore } from './pdfStore';

interface ProjectState {
  isLoading: boolean;
  error: string | null;
  clearProject: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  isLoading: false,
  error: null,

  clearProject: async () => {
    try {
      set({ isLoading: true, error: null });

      // Reset all stores (local state only)
      useMetadataStore.getState().reset();
      usePDFStore.getState().clearFiles();

      // Note: In the new architecture, project data is ephemeral and not stored in backend
      // Downloads are tracked separately in DynamoDB

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear project';
      console.error('Error clearing project:', errorMessage);
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  }
}));