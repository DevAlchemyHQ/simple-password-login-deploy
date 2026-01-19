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

export interface FormData {
  elr: string;
  structureNo: string;
}