import { ImageMetadata, FormData } from '../types';
import { validateFormData, validateImages } from './fileValidation';
import { formatDate, generateMetadataFileName, generateImageFileName, generateZipFileName } from './fileNaming';
import { createZipFile } from './zipUtils';

export const generateMetadataContent = (
  images: ImageMetadata[],
  formData: FormData
): string => {
  if (!images?.length) {
    throw new Error('No images provided for metadata generation');
  }

  try {
    // Group images by date
    const imagesByDate: { [date: string]: ImageMetadata[] } = {};
    const noDate: ImageMetadata[] = [];

    images.forEach(img => {
      if (img.date) {
        if (!imagesByDate[img.date]) {
          imagesByDate[img.date] = [];
        }
        imagesByDate[img.date].push(img);
      } else {
        noDate.push(img);
      }
    });

    if (noDate.length > 0) {
      throw new Error(`Some images are missing dates: ${noDate.map(img => img.file.name).join(', ')}`);
    }

    // Build content sections
    const content = [];
    const sortedDates = Object.keys(imagesByDate).sort();

    // Extract unique formatted dates for header
    const uniqueDates = sortedDates.map(date => formatDate(date)).join(', ');

    // Add header section
    content.push(`ELR: ${formData.elr.trim().toUpperCase()}`);
    content.push(`Structure No: ${formData.structureNo.trim()}`);
    content.push(`Date(s): ${uniqueDates}`);
    content.push(''); // Empty line

    // Add Defects section grouped by date
    if (images.length > 0) {
      content.push('Defects:');
      
      sortedDates.forEach(date => {
        const dateImages = imagesByDate[date]
          .sort((a, b) => parseInt(a.photoNumber || '0') - parseInt(b.photoNumber || '0'));
        
        const formattedDate = formatDate(date);
        
        dateImages.forEach(img => {
          if (!img.photoNumber?.trim()) {
            throw new Error(`Missing photo number for defect: ${img.file.name}`);
          }
          if (!img.description?.trim()) {
            throw new Error(`Missing description for defect: ${img.file.name}`);
          }
          content.push(`Photo ${img.photoNumber.trim().padStart(2, '0')} ^ ${img.description.trim()} ^ ${formattedDate}    ${img.file.name}`);
        });
      });

      // Add empty line before defect list
      content.push('');

      // Add Defect List section (description - P1 format, no zero padding)
      content.push('Defect List:');
      
      // Sort all images by photo number for the defect list
      const sortedImages = [...images].sort((a, b) => 
        parseInt(a.photoNumber || '0') - parseInt(b.photoNumber || '0')
      );
      
      sortedImages.forEach(img => {
        // Use P1, P2, P3 format (no zero padding)
        content.push(`${img.description.trim()} - P${img.photoNumber.trim()}`);
      });
    }

    const result = content.join('\n');
    if (!result) {
      throw new Error('Failed to generate metadata content');
    }

    return result;
  } catch (error) {
    console.error('Error generating metadata content:', error);
    throw error instanceof Error ? error : new Error('Failed to generate metadata content');
  }
};

export const createDownloadPackage = async (
  images: ImageMetadata[],
  formData: FormData
): Promise<Blob> => {
  try {
    // Input validation
    if (!images?.length) {
      throw new Error('No images selected for download');
    }

    if (!formData) {
      throw new Error('Form data is required');
    }

    // Validate form data
    const formError = validateFormData(formData);
    if (formError) {
      throw new Error(formError);
    }

    // Validate images
    const imagesError = validateImages(images);
    if (imagesError) {
      throw new Error(imagesError);
    }

    // Validate all images have dates
    const imagesWithoutDate = images.filter(img => !img.date);
    if (imagesWithoutDate.length > 0) {
      throw new Error(`Some images are missing dates: ${imagesWithoutDate.map(img => img.file.name).join(', ')}`);
    }

    // Generate metadata content
    const metadataContent = await generateMetadataContent(images, formData);
    if (!metadataContent) {
      throw new Error('Failed to generate metadata content');
    }

    // Get the most common date or first date for metadata/zip filename
    const dateCounts: { [date: string]: number } = {};
    images.forEach(img => {
      if (img.date) {
        dateCounts[img.date] = (dateCounts[img.date] || 0) + 1;
      }
    });
    const sortedDates = Object.keys(dateCounts).sort((a, b) => dateCounts[b] - dateCounts[a]);
    const primaryDate = sortedDates[0] || images[0]?.date;
    
    if (!primaryDate) {
      throw new Error('No date found in images');
    }

    // Generate file names
    const metadataFileName = generateMetadataFileName(
      formData.elr.trim(),
      formData.structureNo.trim(),
      primaryDate
    );

    const zipFileName = generateZipFileName(
      formData.elr.trim(),
      formData.structureNo.trim(),
      primaryDate
    );

    // Create and return zip file
    const zipBlob = await createZipFile(
      images,
      metadataFileName,
      metadataContent,
      zipFileName
    );

    if (!zipBlob) {
      throw new Error('Failed to create zip file');
    }

    return zipBlob;
  } catch (error) {
    console.error('Error in createDownloadPackage:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to create download package');
  }
};