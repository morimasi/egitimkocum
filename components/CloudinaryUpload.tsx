import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import cloudinaryService from '../services/cloudinaryService';

interface CloudinaryUploadProps {
  onUploadComplete: (url: string, publicId: string) => void;
  onUploadError?: (error: Error) => void;
  folder?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  multiple?: boolean;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  onUploadComplete,
  onUploadError,
  folder = 'mahmut-hoca',
  acceptedFileTypes = ['image/*', 'video/*', 'application/pdf'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  resourceType = 'auto'
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (!cloudinaryService.isConfigured()) {
      const errorMsg = 'Cloudinary is not configured. Please set environment variables.';
      setError(errorMsg);
      onUploadError?.(new Error(errorMsg));
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const file = acceptedFiles[0];
      
      const response = await cloudinaryService.uploadWithProgress(
        file,
        (progressValue) => setProgress(progressValue),
        { folder, resourceType }
      );

      onUploadComplete(response.secure_url, response.public_id);
      setProgress(100);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onUploadError?.(error);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    multiple
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary/50'
          }
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <>
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="w-full max-w-xs">
                <div className="bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
              </div>
            </>
          ) : (
            <>
              <svg
                className="w-16 h-16 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              
              {isDragActive ? (
                <p className="text-lg font-medium text-primary">
                  Dosyaları buraya bırakın...
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      Dosya yüklemek için tıklayın veya sürükleyin
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Maksimum boyut: {(maxFileSize / (1024 * 1024)).toFixed(0)}MB
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {acceptedFileTypes.map((type) => (
                      <span
                        key={type}
                        className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
                      >
                        {type.split('/')[1] || type}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;
