import { useMetadataStore } from '../store/metadataStore';
import { ImageMetadata } from '../types';

/**
 * SINGLE SELECT VALIDATION
 * Validates single select mode requirements
 */
const validateSingleSelect = (
  images: ImageMetadata[],
  selectedImages: Set<string>,
  formData: { elr: string; structureNo: string }
) => {
  const errors: string[] = [];

  // Basic form validation
  if (!formData.elr) errors.push('Enter ELR');
  if (!formData.structureNo) errors.push('Enter Structure No');
  
  // Image selection validation
  if (selectedImages.size === 0) {
    errors.push('Select at least one image');
  } else {
    const selectedImagesList = images.filter(img => selectedImages.has(img.id));
    
    // Check for missing dates
    if (selectedImagesList.some(img => !img.date)) {
      errors.push('All images must have dates assigned');
    }
    
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
  images: ImageMetadata[],
  formData: { elr: string; structureNo: string }
) => {
  const errors: string[] = [];

  // Basic form validation
  if (!formData.elr) errors.push('Enter ELR');
  if (!formData.structureNo) errors.push('Enter Structure No');
  
  // Batch drag validation
  const defectsWithImages = bulkDefects.filter(defect => defect.selectedFile);
  
  if (defectsWithImages.length === 0) {
    errors.push('Assign at least one image to a defect');
  } else {
    // Check for missing descriptions
    if (defectsWithImages.some(defect => !defect.description?.trim())) {
      errors.push('Add descriptions to all defects with images');
    }
    
    // Check that all assigned images have dates
    const assignedImages = defectsWithImages
      .map(defect => images.find(img => img.file.name === defect.selectedFile))
      .filter(img => img !== undefined) as ImageMetadata[];
    
    if (assignedImages.some(img => !img.date)) {
      errors.push('All assigned images must have dates');
    }
  }

  return errors;
};

export const useValidation = () => {
  const { images, selectedImages, formData, bulkDefects, viewMode } = useMetadataStore();

  const isValid = () => {
    // Basic form validation (common to both modes)
    if (!formData.elr || !formData.structureNo) return false;
    
    if (viewMode === 'text') {
      // Batch drag mode validation
      const defectsWithImages = bulkDefects.filter(defect => defect.selectedFile);
      if (defectsWithImages.length === 0) return false;
      
      // All defects with images must have descriptions
      const allHaveDescriptions = defectsWithImages.every(defect => defect.description?.trim() !== '');
      if (!allHaveDescriptions) return false;
      
      // All assigned images must have dates
      const assignedImages = defectsWithImages
        .map(defect => images.find(img => img.file.name === defect.selectedFile))
        .filter(img => img !== undefined) as ImageMetadata[];
      
      return assignedImages.every(img => img.date !== undefined);
    } else {
      // Single select mode validation
      if (selectedImages.size === 0) return false;
      
      const selectedImagesList = images.filter(img => selectedImages.has(img.id));
      
      // All images must have dates, numbers and descriptions
      return selectedImagesList.every(img => 
        img.date !== undefined &&
        img.photoNumber?.trim() !== '' && 
        img.description?.trim() !== ''
      );
    }
  };

  const getValidationErrors = () => {
    if (viewMode === 'text') {
      return validateBatchDrag(bulkDefects, images, formData);
    } else {
      return validateSingleSelect(images, selectedImages, formData);
    }
  };

  return {
    isValid,
    getValidationErrors,
  };
};