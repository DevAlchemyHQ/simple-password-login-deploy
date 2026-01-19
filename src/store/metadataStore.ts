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
};

interface MetadataState {
  images: ImageMetadata[];
  formData: FormData;
  defectSortDirection: 'asc' | 'desc' | null;
  bulkDefects: BulkDefect[];
  setFormData: (data: Partial<FormData>) => void;
  addImages: (files: File[], date: string) => Promise<void>;
  updateImageMetadata: (id: string, data: Partial<Omit<ImageMetadata, 'id' | 'file' | 'preview'>>) => void;
  removeImage: (id: string) => Promise<void>;
  setDefectSortDirection: (direction: 'asc' | 'desc' | null) => void;
  setBulkDefects: (defects: BulkDefect[] | ((prev: BulkDefect[]) => BulkDefect[])) => void;
  updateBulkDefectFile: (photoNumber: string, fileName: string) => void;
  reset: () => void;
  loadUserData: () => Promise<void>;
  saveUserData: () => Promise<void>;
}

export const useMetadataStore = create<MetadataState>((set, get) => ({
  images: [],
  formData: initialFormData,
  defectSortDirection: null,
  bulkDefects: [],

  setFormData: (data) => {
    set((state) => ({
      formData: { ...state.formData, ...data },
    }));
    get().saveUserData().catch(console.error);
  },

  addImages: async (files, date) => {
    console.log('[metadataStore] addImages called with', files.length, 'files and date:', date);
    try {
      // For simple password auth, use localStorage-based user ID
      const userId = localStorage.getItem('userId') || 'simple-auth-user';

      // Load stored metadata to restore photoNumber/description for re-uploaded images
      // This ensures user edits (photo numbers, descriptions) are never lost
      const storedData = localStorage.getItem('userProjectData');
      const storedMetadata: { [fileName: string]: { photoNumber: string; description: string; date?: string } } = {};
      
      if (storedData) {
        try {
          const projectData = JSON.parse(storedData);
          if (projectData.images && Array.isArray(projectData.images)) {
            // Create a lookup map: fileName -> { photoNumber, description, date }
            // This allows us to restore user edits when images are re-uploaded
            projectData.images.forEach((imgData: any) => {
              if (imgData.fileName) {
                storedMetadata[imgData.fileName] = {
                  photoNumber: imgData.photoNumber || '',
                  description: imgData.description || '',
                  date: imgData.date
                };
              }
            });
          }
        } catch (e) {
          console.warn('Error parsing stored metadata for image restoration:', e);
        }
      }

      // Create image metadata - NO base64 conversion (saves localStorage space)
      // Images will be re-uploaded by user, but metadata (photoNumber, description, date) is restored
      const newImages = await Promise.all(files.map(async (file) => {
        const blobUrl = URL.createObjectURL(file);
        
        // Restore photoNumber, description, and date from stored metadata if this file was uploaded before
        // This ensures user work is never lost - all edits are preserved
        // If date is provided in upload, always use it; otherwise restore from stored metadata
        const restored = storedMetadata[file.name] || { photoNumber: '', description: '', date: undefined };

        // Always use the provided date if it exists, otherwise use restored date
        const imageDate = (date && date.trim()) ? date : restored.date;
        console.log('[metadataStore] Creating image:', file.name, 'with date:', imageDate);
        return {
          id: crypto.randomUUID(),
          file,
          photoNumber: restored.photoNumber,
          description: restored.description,
          preview: blobUrl,
          publicUrl: blobUrl,
          userId: userId,
          date: imageDate
        };
      }));

      set((state) => {
        const updatedImages = [...state.images, ...newImages];
        
        // Auto-match newly uploaded images to existing bulkDefects by filename
        // This allows re-uploaded photos to automatically appear in their assigned tiles
        // The matching happens in SelectedImagesPanel via getImageForDefect() which uses selectedFile
        // No action needed here - the matching is automatic when selectedFile matches file.name
        
        return { images: updatedImages };
      });

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
      }));

      await get().saveUserData();
    } catch (error) {
      console.error('Error removing image:', error);
      throw error;
    }
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
      formData: initialFormData,
      defectSortDirection: null,
      bulkDefects: []
    });
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
        formData: initialFormData,
        defectSortDirection: null,
        bulkDefects: []
      });

      // Restore metadata (form data, bulkDefects, image metadata)
      // NOTE: Images themselves are NOT restored - they must be re-uploaded by the user
      // However, when re-uploaded, their photoNumber/description will be automatically restored
      // from the stored metadata via the addImages function
      // 
      // AUTO-MATCHING SYSTEM EXPLANATION:
      // 1. bulkDefects stores selectedFile (filename) for each tile - this is the key to matching
      // 2. When images are uploaded, addImages() restores photoNumber/description from stored metadata
      // 3. Images automatically match to tiles via filename: img.file.name === defect.selectedFile
      // 4. This matching happens automatically in SelectedImagesPanel via getImageForDefect()
      // 5. Result: User work is never lost - all metadata persists across refresh/logout/shutdown
      
      set({
        formData: projectData.form_data || initialFormData,
        bulkDefects: projectData.bulkDefects || []
      });

      // Note: images array remains empty - user must re-upload photos
      // But all metadata (photoNumber, description, selectedFile) is preserved and will be restored on re-upload
    } catch (error) {
      console.error('Error loading user data:', error);
      // Don't throw, just log - allow app to continue with empty state
    }
  },

  saveUserData: async () => {
    try {
      const state = get();
      
      // METADATA-ONLY STORAGE (No base64 images to save localStorage space)
      // 
      // What gets saved:
      // 1. form_data: Project form fields (elr, structureNo)
      // 2. images: Image metadata only (fileName, photoNumber, description, date) - NO base64Data
      // 3. bulkDefects: Tile metadata (photoNumber, description, selectedFile)
      //
      // Storage capacity: ~27,900 tiles (Chrome/Edge 5MB limit) or ~55,800 tiles (Firefox 10MB)
      // Each tile: ~188 bytes (photoNumber + description + selectedFile)
      //
      // AUTO-MATCHING ON RE-UPLOAD:
      // - When images are re-uploaded, addImages() restores photoNumber/description from stored metadata
      // - Images automatically match to tiles via selectedFile (filename) matching
      // - This happens in SelectedImagesPanel.tsx via getImageForDefect() function
      // - Result: User work is never lost - all edits persist across refresh/logout/shutdown
      
      // Store only metadata - NO base64 image data (saves ~33% space per image)
      const imagesData = state.images.map(img => ({
        id: img.id,
        photoNumber: img.photoNumber || '',
        description: img.description || '',
        fileName: img.file.name,
        fileType: img.file.type,
        fileSize: img.file.size,
        userId: img.userId,
        date: img.date
        // NOTE: base64Data is NOT stored - images must be re-uploaded
        // But photoNumber, description, and date are preserved for restoration
      }));

      // Save to localStorage (Edge/Chrome: ~5MB limit, Firefox: ~10MB limit)
      const projectData = {
        form_data: state.formData,
        images: imagesData, // Metadata only, no base64
        bulkDefects: state.bulkDefects, // Contains selectedFile for auto-matching
        updated_at: new Date().toISOString()
      };

      try {
        localStorage.setItem('userProjectData', JSON.stringify(projectData));
      } catch (storageError: any) {
        // Handle localStorage quota exceeded
        if (storageError.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded. Consider clearing old data.');
          // Could implement cleanup logic here if needed
        }
        throw storageError;
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      // Don't throw - localStorage errors shouldn't break the app
    }
  }
}));
