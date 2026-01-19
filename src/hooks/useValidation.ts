import { useMetadataStore } from '../store/metadataStore';
import { ImageMetadata } from '../types';

/**
 * BATCH DEFECT VALIDATION
 * Validates batch defect tile requirements
 * ALL tiles must have images assigned, descriptions, and dates
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
  
  // Check if there are images uploaded
  if (images.length === 0) {
    errors.push('Upload at least one image');
  }
  
  // Check if there are tiles
  if (bulkDefects.length === 0) {
    errors.push('Create at least one tile');
  } else {
    // ALL tiles must have images assigned
    const tilesWithoutImages = bulkDefects.filter(defect => !defect.selectedFile);
    if (tilesWithoutImages.length > 0) {
      errors.push(`Assign images to all tiles (${tilesWithoutImages.length} tile${tilesWithoutImages.length > 1 ? 's' : ''} missing)`);
    }
    
    // ALL tiles must have descriptions
    const tilesWithoutDescriptions = bulkDefects.filter(defect => !defect.description?.trim());
    if (tilesWithoutDescriptions.length > 0) {
      errors.push(`Add descriptions to all tiles (${tilesWithoutDescriptions.length} tile${tilesWithoutDescriptions.length > 1 ? 's' : ''} missing)`);
    }
    
    // Check that all assigned images have dates
    const assignedImages = bulkDefects
      .filter(defect => defect.selectedFile)
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
    
    // Must have images uploaded
    if (images.length === 0) return false;
    
    // Must have tiles created
    if (bulkDefects.length === 0) return false;
    
    // ALL tiles must have images assigned
    if (bulkDefects.some(defect => !defect.selectedFile)) return false;
    
    // ALL tiles must have descriptions
    if (bulkDefects.some(defect => !defect.description?.trim())) return false;
    
    // All assigned images must have dates
    const assignedImages = bulkDefects
      .filter(defect => defect.selectedFile)
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