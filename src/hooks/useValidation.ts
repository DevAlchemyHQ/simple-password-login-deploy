import { useMetadataStore } from '../store/metadataStore';
import { ImageMetadata } from '../types';

/**
 * BATCH DEFECT VALIDATION
 * Validates batch defect tile requirements
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
  const { images, formData, bulkDefects } = useMetadataStore();

  const isValid = () => {
    // Basic form validation
    if (!formData.elr || !formData.structureNo) return false;
    
    // Batch defect mode validation
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
  };

  const getValidationErrors = () => {
    return validateBatchDrag(bulkDefects, images, formData);
  };

  return {
    isValid,
    getValidationErrors,
  };
};