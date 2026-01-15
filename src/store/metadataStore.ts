import { create } from 'zustand';
import { ImageMetadata, FormData } from '../types';
import { supabase } from '../lib/supabase';

interface BulkDefect {
  photoNumber: string;
  description: string;
  selectedFile?: string;
}

const initialFormData: FormData = {
  elr: '',
  structureNo: '',
  date: '',
};

interface MetadataState {
  images: ImageMetadata[];
  selectedImages: Set<string>;
  formData: FormData;
  defectSortDirection: 'asc' | 'desc' | null;
  bulkDefects: BulkDefect[];
  viewMode: 'images' | 'text';
  setFormData: (data: Partial<FormData>) => void;
  addImages: (files: File[]) => Promise<void>;
  updateImageMetadata: (id: string, data: Partial<Omit<ImageMetadata, 'id' | 'file' | 'preview'>>) => void;
  removeImage: (id: string) => Promise<void>;
  toggleImageSelection: (id: string) => void;
  clearSelectedImages: () => void;
  setDefectSortDirection: (direction: 'asc' | 'desc' | null) => void;
  setBulkDefects: (defects: BulkDefect[] | ((prev: BulkDefect[]) => BulkDefect[])) => void;
  setViewMode: (mode: 'images' | 'text') => void;
  updateBulkDefectFile: (photoNumber: string, fileName: string) => void;
  reset: () => void;
  getSelectedCounts: () => { defects: number };
  loadUserData: () => Promise<void>;
  saveUserData: () => Promise<void>;
}

export const useMetadataStore = create<MetadataState>((set, get) => ({
  images: [],
  selectedImages: new Set(),
  formData: initialFormData,
  defectSortDirection: null,
  bulkDefects: [],
  viewMode: 'images',

  setFormData: (data) => {
    set((state) => ({
      formData: { ...state.formData, ...data },
    }));
    get().saveUserData().catch(console.error);
  },

  addImages: async (files) => {
    try {
      // For simple password auth, use localStorage-based user ID
      const userId = localStorage.getItem('userId') || 'simple-auth-user';

      // Create image metadata without uploading to Supabase storage
      // Convert files to base64 for localStorage persistence
      const newImages = await Promise.all(files.map(async (file) => {
        const blobUrl = URL.createObjectURL(file);

        // Convert file to base64 for persistence
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        return {
          id: crypto.randomUUID(),
          file,
          photoNumber: '',
          description: '',
          preview: blobUrl,
          publicUrl: blobUrl, // Use blob URL for immediate display
          base64Data: base64, // Store base64 for persistence
          userId: userId
        };
      }));

      set((state) => ({
        images: [...state.images, ...newImages],
      }));

      // Save project data after successful uploads
      await get().saveUserData();
    } catch (error) {
      console.error('Error adding images:', error);
      throw error;
    }
  },

  updateImageMetadata: (id, data) => {
    set((state) => {
      const updatedImages = state.images.map((img) =>
        img.id === id ? { ...img, ...data } : img
      );
      
      const sortedImages = [...updatedImages].sort((a, b) => {
        if (state.defectSortDirection) {
          const numA = parseInt(a.photoNumber || '0');
          const numB = parseInt(b.photoNumber || '0');
          return state.defectSortDirection === 'asc' ? numA - numB : numB - numA;
        }
        
        return 0;
      });

      get().saveUserData().catch(console.error);
      return { images: sortedImages };
    });
  },

  removeImage: async (id) => {
    try {
      const imageToRemove = get().images.find(img => img.id === id);
      
      // Revoke blob URL to free memory
      if (imageToRemove?.preview && imageToRemove.preview.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      if (imageToRemove?.publicUrl && imageToRemove.publicUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.publicUrl);
      }

      set((state) => ({
        images: state.images.filter((img) => img.id !== id),
        selectedImages: new Set([...state.selectedImages].filter(imgId => imgId !== id)),
      }));

      await get().saveUserData();
    } catch (error) {
      console.error('Error removing image:', error);
      throw error;
    }
  },

  toggleImageSelection: (id) => {
    set((state) => {
      const newSelected = new Set(state.selectedImages);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      
      get().saveUserData().catch(console.error);
      return { selectedImages: newSelected };
    });
  },

  clearSelectedImages: () => {
    set((state) => {
      const updatedImages = state.images.map((img) =>
        state.selectedImages.has(img.id)
          ? { ...img, photoNumber: '', description: '' }
          : img
      );
      
      get().saveUserData().catch(console.error);
      return {
        selectedImages: new Set(),
        images: updatedImages
      };
    });
  },

  setDefectSortDirection: (direction) =>
    set((state) => {
      const sortedImages = [...state.images].sort((a, b) => {
        if (direction) {
          const numA = parseInt(a.photoNumber || '0');
          const numB = parseInt(b.photoNumber || '0');
          return direction === 'asc' ? numA - numB : numB - numA;
        }
        return 0;
      });

      return {
        defectSortDirection: direction,
        images: sortedImages
      };
    }),

  setBulkDefects: (defects) => {
    const newDefects = typeof defects === 'function' ? defects(get().bulkDefects) : defects;
    set({ bulkDefects: newDefects });
    // Auto-save after updating defects
    get().saveUserData().catch(console.error);
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  updateBulkDefectFile: (photoNumber, fileName) => {
    set((state) => ({
      bulkDefects: state.bulkDefects.map((defect) =>
        defect.photoNumber === photoNumber
          ? { ...defect, selectedFile: fileName }
          : defect
      ),
    }));
    get().saveUserData().catch(console.error);
  },

  reset: () => {
    set({
      images: [],
      selectedImages: new Set(),
      formData: initialFormData,
      defectSortDirection: null,
      bulkDefects: [],
      viewMode: 'images'
    });
  },

  getSelectedCounts: () => {
    const state = get();
    const selectedImagesList = state.images.filter(img => state.selectedImages.has(img.id));
    return {
      defects: selectedImagesList.length
    };
  },

  loadUserData: async () => {
    try {
      // Load from localStorage instead of Supabase
      const storedData = localStorage.getItem('userProjectData');
      
      if (!storedData) {
        // No stored data, use initial state
        return;
      }

      const projectData = JSON.parse(storedData);

      // Clear existing state first
      set({
        images: [],
        selectedImages: new Set(),
        formData: initialFormData,
        defectSortDirection: null,
        bulkDefects: [],
        viewMode: projectData.viewMode || 'images'
      });

      if (projectData.images && projectData.images.length > 0) {
        // Load images from stored base64 data
        const validImages = await Promise.all(
          projectData.images.map(async (imgData: any) => {
            try {
              // Restore from base64 data
              if (imgData.base64Data) {
                // Convert base64 to blob
                const response = await fetch(imgData.base64Data);
              const blob = await response.blob();
              const file = new File([blob], imgData.fileName || 'image.jpg', {
                type: imgData.fileType || blob.type
              });
                
                const blobUrl = URL.createObjectURL(blob);

              return {
                id: imgData.id,
                file,
                photoNumber: imgData.photoNumber || '',
                description: imgData.description || '',
                  preview: blobUrl,
                  publicUrl: blobUrl,
                  base64Data: imgData.base64Data, // Keep base64 for future saves
                userId: imgData.userId
              };
              }
              return null;
            } catch (error) {
              console.error('Error loading image:', error);
              return null;
            }
          })
        );

        // Filter out failed loads
        const images = validImages.filter((img): img is ImageMetadata => img !== null);
        const selectedImages = new Set(projectData.selected_images || []);

        set({
          formData: projectData.form_data || initialFormData,
          images,
          selectedImages,
          bulkDefects: projectData.bulkDefects || [],
          viewMode: projectData.viewMode || 'images'
        });
      } else if (projectData.form_data) {
        // Just restore form data if no images
        set({
          formData: projectData.form_data || initialFormData,
          bulkDefects: projectData.bulkDefects || [],
          viewMode: projectData.viewMode || 'images'
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Don't throw, just log - allow app to continue with empty state
    }
  },

  saveUserData: async () => {
    try {
      const state = get();
      
      // Prepare images data for storage
      // Store base64 data and file metadata for persistence
      const imagesData = state.images.map(img => ({
        id: img.id,
        photoNumber: img.photoNumber,
        description: img.description,
        base64Data: (img as any).base64Data, // Store base64 for persistence
        userId: img.userId,
        fileName: img.file.name,
        fileType: img.file.type,
        fileSize: img.file.size
      }));

      // Save to localStorage instead of Supabase
      const projectData = {
          form_data: state.formData,
          images: imagesData,
          selected_images: Array.from(state.selectedImages),
          bulkDefects: state.bulkDefects,
          viewMode: state.viewMode,
          updated_at: new Date().toISOString()
      };

      localStorage.setItem('userProjectData', JSON.stringify(projectData));
    } catch (error) {
      console.error('Error saving user data:', error);
      // Don't throw - localStorage errors shouldn't break the app
    }
  }
}));