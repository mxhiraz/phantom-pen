import { useState } from "react";
import { useMutation as useConvexMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface UseFileUploadOptions {
  allowedTypes: string[];
  maxSize?: number; // in bytes
}

interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<string | null>; // returns storageId or null
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  reset: () => void;
}

export const useFileUpload = (
  options: UseFileUploadOptions
): UseFileUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useConvexMutation(api.files.generateUploadUrl);

  const {
    allowedTypes,
    maxSize = 100 * 1024 * 1024, // 100MB default
  } = options;

  const validateFile = (file: File): boolean => {
    // Check file type
    const isValidType = allowedTypes.some(
      (type) => file.type.startsWith(type) || file.type === type
    );

    if (!isValidType) {
      toast.error(`File type ${file.type} is not supported`);
      return false;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!validateFile(file)) {
      return null;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Generate upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await response.json();
      setUploadProgress(100);

      return storageId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      toast.error("Failed to upload file. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  };

  return {
    uploadFile,
    isUploading,
    uploadProgress,
    error,
    reset,
  };
};

// Default export for audio-only uploads
export const useAudioUpload = (maxSize?: number) =>
  useFileUpload({
    allowedTypes: ["audio/"],
    maxSize,
  });

// Default export for the main hook
export default useFileUpload;
