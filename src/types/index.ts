/**
 * Core image metadata type
 */
export interface ImageMetadata {
  id: string;
  file: File;
  photoNumber: string;
  description: string;
  preview: string;
  publicUrl?: string;
  userId?: string;
  date?: string;
}

/**
 * Form data for project metadata
 */
export interface FormData {
  elr: string;
  structureNo: string;
}

// Re-export all types from other type files
export * from './defect';
export * from './ui';
export * from './profile';
export * from './pdf';
export * from './location';
