import { ImageMetadata, FormData } from '../types';
import { createDownloadPackage, generateMetadataContent } from './fileUtils';
import { validateDescription } from './fileValidation';
import { generateMetadataFileName, generateImageFileName } from './fileNaming';

/**
 * Check if File System Access API is supported
 */
const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

/**
 * Save files directly to a user-selected folder using File System Access API
 * Falls back to ZIP download if not supported
 * Returns folder name if successful, null if fallback needed
 */
const saveFilesToFolder = async (
  images: ImageMetadata[],
  formData: FormData,
  metadataContent: string,
  primaryDate: string
): Promise<string | null> => {
  if (!isFileSystemAccessSupported()) {
    return null; // Signal to use ZIP fallback
  }

  try {
    // Show folder picker
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'downloads'
    });

    // Create subfolder with ELR_StructureNo_(count) format
    const folderName = `${formData.elr.trim().toUpperCase()}_${formData.structureNo.trim()}_(${images.length})`;
    const subfolderHandle = await dirHandle.getDirectoryHandle(folderName, { create: true });

    // Generate metadata filename
    const metadataFileName = generateMetadataFileName(
      formData.elr.trim(),
      formData.structureNo.trim(),
      primaryDate
    );

    // Save metadata file to subfolder
    const metadataFileHandle = await subfolderHandle.getFileHandle(metadataFileName, { create: true });
    const metadataWritable = await metadataFileHandle.createWritable();
    await metadataWritable.write(metadataContent);
    await metadataWritable.close();

    // Save each image to subfolder
    for (const image of images) {
      const imageFileName = generateImageFileName(image);
      const imageFileHandle = await subfolderHandle.getFileHandle(imageFileName, { create: true });
      const imageWritable = await imageFileHandle.createWritable();
      await imageWritable.write(image.file);
      await imageWritable.close();
    }

    return folderName; // Return folder name for success message
  } catch (error) {
    // User cancelled or error occurred
    if ((error as any).name === 'AbortError') {
      throw new Error('Folder selection cancelled');
    }
    console.error('Error saving files to folder:', error);
    return null; // Fall back to ZIP
  }
};

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
): Promise<{ success: true; message: string }> => {
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

  // Get primary date for filename (most common date or first date)
  const dateCounts: { [date: string]: number } = {};
  selectedImagesList.forEach(img => {
    if (img.date) {
      dateCounts[img.date] = (dateCounts[img.date] || 0) + 1;
    }
  });
  const sortedDates = Object.keys(dateCounts).sort((a, b) => dateCounts[b] - dateCounts[a]);
  const primaryDate = sortedDates[0] || selectedImagesList[0]?.date;

  if (!primaryDate) {
    throw new Error('No date found in selected images');
  }

  // Generate metadata content
  const metadataContent = generateMetadataContent(selectedImagesList, formData);

  // Try to save to folder first (if supported)
  const folderName = await saveFilesToFolder(
    selectedImagesList,
    formData,
    metadataContent,
    primaryDate
  );

  if (folderName) {
    // Success - files saved to folder
    onTrackEvent({
      action: 'download_to_folder',
      category: 'user_action',
      label: `${formData.elr.trim()}_${formData.structureNo.trim()}_${primaryDate}`,
      value: selectedImagesList.length
    });
    return {
      success: true,
      message: `Successfully saved ${selectedImagesList.length} file${selectedImagesList.length > 1 ? 's' : ''} to folder: ${folderName}`
    };
  }

  // Fallback to ZIP download
  const zipBlob = await createDownloadPackage(selectedImagesList, formData);

  // Trigger download
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = primaryDate.split('-').reverse().join('-');
  const zipFileName = `${formData.elr.trim().toUpperCase()}_${formData.structureNo.trim()}_${dateStr}.zip`;
  a.download = zipFileName;
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

  return {
    success: true,
    message: `Successfully downloaded ZIP file: ${zipFileName}`
  };
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
): Promise<{ success: true; message: string }> => {
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

  // Get primary date for filename (most common date or first date)
  const dateCounts: { [date: string]: number } = {};
  imagesForDownload.forEach(img => {
    if (img.date) {
      dateCounts[img.date] = (dateCounts[img.date] || 0) + 1;
    }
  });
  const sortedDates = Object.keys(dateCounts).sort((a, b) => dateCounts[b] - dateCounts[a]);
  const primaryDate = sortedDates[0] || imagesForDownload[0]?.date;

  if (!primaryDate) {
    throw new Error('No date found in images');
  }

  // Generate metadata content
  const metadataContent = generateMetadataContent(imagesForDownload, formData);

  // Try to save to folder first (if supported)
  const folderName = await saveFilesToFolder(
    imagesForDownload,
    formData,
    metadataContent,
    primaryDate
  );

  if (folderName) {
    // Success - files saved to folder
    onTrackEvent({
      action: 'download_batch_to_folder',
      category: 'user_action',
      label: `${formData.elr.trim()}_${formData.structureNo.trim()}_${primaryDate}`,
      value: imagesForDownload.length
    });
    return {
      success: true,
      message: `Successfully saved ${imagesForDownload.length} file${imagesForDownload.length > 1 ? 's' : ''} to folder: ${folderName}`
    };
  }

  // Fallback to ZIP download
  const zipBlob = await createDownloadPackage(imagesForDownload, formData);

  // Trigger download
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = primaryDate.split('-').reverse().join('-');
  const zipFileName = `${formData.elr.trim().toUpperCase()}_${formData.structureNo.trim()}_${dateStr}.zip`;
  a.download = zipFileName;
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

  return {
    success: true,
    message: `Successfully downloaded ZIP file: ${zipFileName}`
  };
};
