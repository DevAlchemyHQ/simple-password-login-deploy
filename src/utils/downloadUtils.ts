import { ImageMetadata, FormData } from '../types';
import { createDownloadPackage } from './fileUtils';
import { validateDescription } from './fileValidation';

/**
 * SINGLE SELECT DOWNLOAD LOGIC
 * Handles download for single select mode
 * Creates ONE zip file with all images using their assigned dates
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

  // Check that all images have dates
  const imagesWithoutDate = selectedImagesList.filter(img => !img.date);
  if (imagesWithoutDate.length > 0) {
    throw new Error(`Some images are missing dates: ${imagesWithoutDate.map(img => img.file.name).join(', ')}`);
  }

  // Check for special characters
  const hasSpecialChars = selectedImagesList.some(img => 
    !validateDescription(img.description || '').isValid
  );
  
  if (hasSpecialChars) {
    throw new Error('Remove special characters from defect descriptions before downloading');
  }

  // Create ONE zip file with all images
  const zipBlob = await createDownloadPackage(selectedImagesList, formData);
  
  // Get primary date for filename (most common date or first date)
  const dateCounts: { [date: string]: number } = {};
  selectedImagesList.forEach(img => {
    if (img.date) {
      dateCounts[img.date] = (dateCounts[img.date] || 0) + 1;
    }
  });
  const sortedDates = Object.keys(dateCounts).sort((a, b) => dateCounts[b] - dateCounts[a]);
  const primaryDate = sortedDates[0] || selectedImagesList[0]?.date;
  
  // Trigger download
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = primaryDate ? primaryDate.split('-').reverse().join('-') : 'mixed';
  a.download = `${formData.elr.trim().toUpperCase()}_${formData.structureNo.trim()}_${dateStr}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Track download event
  onTrackEvent({
    action: 'download_package',
    category: 'user_action',
    label: `${formData.elr.trim()}_${formData.structureNo.trim()}_${dateStr}`,
    value: selectedImagesList.length
  });
};

/**
 * BATCH DRAG DOWNLOAD LOGIC
 * Handles download for batch drag mode
 * Creates ONE zip file with all images using their assigned dates
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

  // Check that all images have dates
  const imagesWithoutDate = imagesForDownload.filter(img => !img.date);
  if (imagesWithoutDate.length > 0) {
    throw new Error(`Some images are missing dates: ${imagesWithoutDate.map(img => img.file.name).join(', ')}`);
  }

  // Check for special characters
  const hasSpecialChars = imagesForDownload.some(img => 
    !validateDescription(img.description || '').isValid
  );
  
  if (hasSpecialChars) {
    throw new Error('Remove special characters from defect descriptions before downloading');
  }

  // Create ONE zip file with all images
  const zipBlob = await createDownloadPackage(imagesForDownload, formData);
  
  // Get primary date for filename (most common date or first date)
  const dateCounts: { [date: string]: number } = {};
  imagesForDownload.forEach(img => {
    if (img.date) {
      dateCounts[img.date] = (dateCounts[img.date] || 0) + 1;
    }
  });
  const sortedDates = Object.keys(dateCounts).sort((a, b) => dateCounts[b] - dateCounts[a]);
  const primaryDate = sortedDates[0] || imagesForDownload[0]?.date;
  
  // Trigger download
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = primaryDate ? primaryDate.split('-').reverse().join('-') : 'mixed';
  a.download = `${formData.elr.trim().toUpperCase()}_${formData.structureNo.trim()}_${dateStr}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Track download event
  onTrackEvent({
    action: 'download_batch_package',
    category: 'user_action',
    label: `${formData.elr.trim()}_${formData.structureNo.trim()}_${dateStr}`,
    value: imagesForDownload.length
  });
};
