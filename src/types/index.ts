export interface ImageMetadata {
  id: string;
  file: File;
  photoNumber: string;
  description: string;
  preview: string;
  publicUrl?: string;
  userId?: string;
}

export interface FormData {
  elr: string;
  structureNo: string;
  date: string;
}