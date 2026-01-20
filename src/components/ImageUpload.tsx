import React, { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useMetadataStore } from "../store/metadataStore";
import { DatePickerModal } from "./DatePickerModal";
import { ImageSizeCheckModal } from "./ImageSizeCheckModal";
import { validateFileSize } from "../utils/fileValidation";

interface SizeValidationData {
  oversizedFiles: { name: string; sizeKB: number }[];
  totalFiles: number;
  averageSizeKB: number;
}

export const ImageUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addImages = useMetadataStore((state) => state.addImages);
  const formData = useMetadataStore((state) => state.formData);
  const [isLoading, setIsLoading] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [isSizeWarningOpen, setIsSizeWarningOpen] = useState(false);
  const [sizeValidationData, setSizeValidationData] = useState<SizeValidationData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      // Store files and show date picker modal
      const files = Array.from(e.target.files);
      console.log('[ImageUpload] Files selected:', files.length);
      
      // Validate file sizes before proceeding
      const sizeValidation = validateFileSize(files, 500);
      
      if (!sizeValidation.valid) {
        // Show custom size warning modal
        setSizeValidationData({
          oversizedFiles: sizeValidation.oversizedFiles || [],
          totalFiles: sizeValidation.totalFiles || files.length,
          averageSizeKB: sizeValidation.averageSizeKB || 0
        });
        setIsSizeWarningOpen(true);
        // Clear the input so user can select different files
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      setPendingFiles(files);
      console.log('[ImageUpload] Setting modal open, isDateModalOpen will be:', true);
      setIsDateModalOpen(true);
    }
  };

  const handleSizeWarningClose = () => {
    setIsSizeWarningOpen(false);
    setSizeValidationData(null);
  };

  const handleDateConfirm = async (date: string) => {
    if (!pendingFiles || pendingFiles.length === 0) {
      console.error('[ImageUpload] No pending files to upload');
      return;
    }

    if (!date || !date.trim()) {
      console.error('[ImageUpload] No date provided');
      alert('Please select a date before uploading.');
      return;
    }

    // Close modal first
    setIsDateModalOpen(false);
    try {
      setIsLoading(true);
      // Upload all files at once with the same date
      await addImages(pendingFiles, date);
    } catch (error) {
      console.error('[ImageUpload] Error uploading images:', error);
      alert(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setPendingFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDateModalClose = () => {
    setIsDateModalOpen(false);
    setPendingFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  return (
    <>
      <div className="mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept="image/*"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all group shadow ${isLoading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-indigo-600'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Upload Exam Photos</span>
            </>
          )}
        </button>
      </div>
      <DatePickerModal
        isOpen={isDateModalOpen}
        onClose={handleDateModalClose}
        onConfirm={handleDateConfirm}
        defaultDate={undefined}
      />
      {sizeValidationData && (
        <ImageSizeCheckModal
          isOpen={isSizeWarningOpen}
          onClose={handleSizeWarningClose}
          oversizedFiles={sizeValidationData.oversizedFiles}
          totalFiles={sizeValidationData.totalFiles}
          averageSizeKB={sizeValidationData.averageSizeKB}
          maxSizeKB={500}
        />
      )}
    </>
  );
};