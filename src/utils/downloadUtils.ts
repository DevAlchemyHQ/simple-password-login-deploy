import { ImageMetadata, FormData } from '../types';
import { createDownloadPackage } from './fileUtils';
import { validateDescription } from './fileValidation';

/**
 * SINGLE SELECT DOWNLOAD LOGIC
 * Handles download for single select mode
 */
export const handleSingleSelectDownload = async (
  images: ImageMetadata[],
  selectedImages: Set<string>,
  formData: FormData,
  onTrackEvent: (data: { action: string; category: string; label: string; value: number }) => void
): Promise<void> => {
  // Get selected images
  const selectedImagesList = images.filter(img => selectedImages.has(img.id));
  
  if (selectedImagesList.length === 0) {
    throw new Error('No images selected');
  }

  // Check for special characters
  const hasSpecialChars = selectedImagesList.some(img => 
    !validateDescription(img.description || '').isValid
  );
  
  if (hasSpecialChars) {
    throw new Error('Remove special characters from defect descriptions before downloading');
  }
  
  // Create download package
  const zipBlob = await createDownloadPackage(selectedImagesList, formData);
  
  // Trigger download
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${formData.elr.trim().toUpperCase()}_${formData.structureNo.trim()}_${formData.date.split('-').reverse().join('-')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Track download event
  onTrackEvent({
    action: 'download_package',
    category: 'user_action',
    label: `${formData.elr.trim()}_${formData.structureNo.trim()}`,
    value: selectedImagesList.length
  });
};

/**
 * BATCH DRAG DOWNLOAD LOGIC
 * Handles download for batch drag mode
 */
export const handleBatchDragDownload = async (
  images: ImageMetadata[],
  bulkDefects: Array<{ photoNumber: string; description: string; selectedFile?: string }>,
  formData: FormData,
  onTrackEvent: (data: { action: string; category: string; label: string; value: number }) => void
): Promise<void> => {
  // Get defects with assigned images
  const defectsWithImages = bulkDefects.filter(defect => defect.selectedFile);
  
  if (defectsWithImages.length === 0) {
    throw new Error('No images assigned to defects');
  }

  // Map defects to images with their metadata
  const imagesForDownload: ImageMetadata[] = defectsWithImages.map(defect => {
    const image = images.find(img => img.file.name === defect.selectedFile);
    if (!image) {
      throw new Error(`Image not found: ${defect.selectedFile}`);
    }
    
    // Return image with defect's photo number and description
    return {
      ...image,
      photoNumber: defect.photoNumber,
      description: defect.description
    };
  });

  // Check for special characters
  const hasSpecialChars = imagesForDownload.some(img => 
    !validateDescription(img.description || '').isValid
  );
  
  if (hasSpecialChars) {
    throw new Error('Remove special characters from defect descriptions before downloading');
  }
  
  // Create download package
  const zipBlob = await createDownloadPackage(imagesForDownload, formData);
  
  // Trigger download
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${formData.elr.trim().toUpperCase()}_${formData.structureNo.trim()}_${formData.date.split('-').reverse().join('-')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Track download event
  onTrackEvent({
    action: 'download_batch_package',
    category: 'user_action',
    label: `${formData.elr.trim()}_${formData.structureNo.trim()}`,
    value: imagesForDownload.length
  });
};
