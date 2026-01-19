import JSZip from 'jszip';
import { ImageMetadata } from '../types';
import { generateImageFileName } from './fileNaming';

export const createZipFile = async (
  images: ImageMetadata[],
  metadataFileName: string,
  metadataContent: string,
  zipFileName: string
): Promise<Blob> => {
  // Input validation
  if (!images?.length) {
    throw new Error('No images provided for zip creation');
  }

  if (!metadataFileName || !metadataContent) {
    throw new Error('Invalid metadata for zip file');
  }

  try {
    const zip = new JSZip();
    
    // Add metadata file
    zip.file(metadataFileName, metadataContent);
    
    // Add images with appropriate naming (using each image's date)
    for (const img of images) {
      if (!img.file) {
        throw new Error(`Invalid image entry: missing file data`);
      }

      if (!img.date) {
        throw new Error(`Image missing date: ${img.file.name}`);
      }

      try {
        const fileName = generateImageFileName(img);
        if (!fileName) {
          throw new Error(`Failed to generate filename for image: ${img.file.name}`);
        }
        
        zip.file(fileName, img.file);
      } catch (error) {
        console.error('Error processing image:', error);
        throw new Error(`Failed to process image: ${img.file.name}`);
      }
    }
    
    // Generate zip with compression
    const blob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });

    if (!blob) {
      throw new Error('Failed to generate zip file');
    }

    return blob;
  } catch (error) {
    console.error('Error creating zip file:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to create zip file');
  }
};