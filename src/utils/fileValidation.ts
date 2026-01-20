import { ImageMetadata, FormData } from '../types';

export const validateFormData = (formData: FormData): string | null => {
  if (!formData.elr?.trim()) return 'ELR is required';
  if (!formData.structureNo?.trim()) return 'Structure number is required';
  return null;
};

export const validateFileSize = (
  files: File[], 
  maxSizeKB: number = 500
): { 
  valid: boolean; 
  oversizedFiles?: { name: string; sizeKB: number }[];
  totalFiles?: number;
  averageSizeKB?: number;
} => {
  const MAX_SIZE = maxSizeKB * 1024;
  const oversized = files.filter(f => f.size > MAX_SIZE);
  
  if (oversized.length === 0) {
    return { valid: true };
  }
  
  // For bulk uploads, calculate statistics
  const totalOversizedSize = oversized.reduce((sum, f) => sum + f.size, 0);
  const avgSize = totalOversizedSize / oversized.length;
  
  const oversizedFiles = oversized.map(f => ({
    name: f.name,
    sizeKB: f.size / 1024
  }));
  
  return {
    valid: false,
    oversizedFiles,
    totalFiles: files.length,
    averageSizeKB: avgSize / 1024
  };
};

export const validateDescription = (description: string): { 
  isValid: boolean;
  invalidChars: string[];
} => {
  const slashChars = description.match(/[/\\]/g) || [];
  return {
    isValid: slashChars.length === 0,
    invalidChars: [...new Set(slashChars)]
  };
};

export const validateImages = (images: ImageMetadata[]): string | null => {
  if (images.length === 0) return 'No images selected';
  
  // Check if any image is missing required metadata
  for (const img of images) {
    if (!img.photoNumber?.trim()) {
      return `Photo number is required for defect: ${img.file.name}`;
    }
    
    // Check description for all images
    if (!img.description?.trim()) {
      return `Description is required for defect: ${img.file.name}`;
    }
    
    // Check for slashes in descriptions
      const { isValid } = validateDescription(img.description);
      if (!isValid) {
        return 'Remove slashes (/ or \\) from descriptions before downloading';
    }
  }
  
  // Check for duplicate photo numbers
  const photoNumbers = new Set();

  for (const img of images) {
    const number = img.photoNumber.trim();

    if (photoNumbers.has(number)) {
      return `Duplicate photo number found: ${number}`;
    }
    photoNumbers.add(number);
  }
  
  return null;
};