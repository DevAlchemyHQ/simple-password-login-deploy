import { useMetadataStore } from '../store/metadataStore';
import { ImageMetadata } from '../types';

/**
 * SINGLE SELECT VALIDATION
 * Validates single select mode requirements
 */
const validateSingleSelect = (
  images: ImageMetadata[],
  selectedImages: Set<string>,
  formData: { elr: string; structureNo: string; date: string }
) => {
  const errors: string[] = [];

  // Basic form validation
  if (!formData.elr) errors.push('Enter ELR');
  if (!formData.structureNo) errors.push('Enter Structure No');
  if (!formData.date) errors.push('Select Date');
  
  // Image selection validation
  if (selectedImages.size === 0) {
    errors.push('Select at least one image');
  } else {
    const selectedImagesList = images.filter(img => selectedImages.has(img.id));
    
    // Check for missing numbers
    if (selectedImagesList.some(img => !img.photoNumber?.trim())) {
      errors.push('Add numbers to selected images');
    }
    
    // Check for missing descriptions
    if (selectedImagesList.some(img => !img.description?.trim())) {
      errors.push('Add descriptions to selected images');
    }
  }

  return errors;
};

/**
 * BATCH DRAG VALIDATION
 * Validates batch drag mode requirements
 */
const validateBatchDrag = (
  bulkDefects: Array<{ photoNumber: string; description: string; selectedFile?: string }>,
  formData: { elr: string; structureNo: string; date: string }
) => {
  const errors: string[] = [];

  // Basic form validation
  if (!formData.elr) errors.push('Enter ELR');
  if (!formData.structureNo) errors.push('Enter Structure No');
  if (!formData.date) errors.push('Select Date');
  
  // Batch drag validation
  const defectsWithImages = bulkDefects.filter(defect => defect.selectedFile);
  
  if (defectsWithImages.length === 0) {
    errors.push('Assign at least one image to a defect');
  } else {
    // Check for missing descriptions
    if (defectsWithImages.some(defect => !defect.description?.trim())) {
      errors.push('Add descriptions to all defects with images');
    }
  }

  return errors;
};

export const useValidation = () => {
  const { images, selectedImages, formData, bulkDefects, viewMode } = useMetadataStore();

  const isValid = () => {
    // Basic form validation (common to both modes)
    if (!formData.elr || !formData.structureNo || !formData.date) return false;
    
    if (viewMode === 'text') {
      // Batch drag mode validation
      const defectsWithImages = bulkDefects.filter(defect => defect.selectedFile);
      if (defectsWithImages.length === 0) return false;
      
      // All defects with images must have descriptions
      return defectsWithImages.every(defect => defect.description?.trim() !== '');
    } else {
      // Single select mode validation
      if (selectedImages.size === 0) return false;
      
      const selectedImagesList = images.filter(img => selectedImages.has(img.id));
      
      // All images must have numbers and descriptions
      return selectedImagesList.every(img => 
        img.photoNumber?.trim() !== '' && 
        img.description?.trim() !== ''
      );
    }
  };

  const getValidationErrors = () => {
    if (viewMode === 'text') {
      return validateBatchDrag(bulkDefects, formData);
    } else {
      return validateSingleSelect(images, selectedImages, formData);
    }
  };

  return {
    isValid,
    getValidationErrors,
  };
};