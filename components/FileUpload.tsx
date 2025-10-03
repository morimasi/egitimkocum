import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { XIcon, DocumentIcon } from './Icons'; // Assuming you have these icons

interface FileUploadProps {
    onFileChange: (file: File | null) => void;
    isUploading: boolean;
}

const FileUpload = ({ onFileChange, isUploading }: FileUploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const currentFile = acceptedFiles[0];
            setFile(currentFile);
            onFileChange(currentFile);
            if (currentFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result as string);
                };
                reader.readAsDataURL(currentFile);
            } else {
                setPreview(null);
            }
        }
    }, [onFileChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        disabled: isUploading || !!file,
    });

    const handleRemoveFile = () => {
        setFile(null);
        setPreview(null);
        onFileChange(null);
    };

    if (file) {
        return (
            <div className="p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                        ) : (
                            <DocumentIcon className="w-12 h-12 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="text-left min-w-0">
                            <p className="font-semibold truncate">{file.name}</p>
                            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRemoveFile}
                        disabled={isUploading}
                        className="p-2 text-red-500 hover:text-red-700 flex-shrink-0"
                        aria-label="Dosyayı kaldır"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div
            {...getRootProps()}
            className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'}`}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="font-semibold">Dosyayı sürükleyip bırakın veya tıklayın</p>
                <p className="text-sm">PNG, JPG, PDF, DOCX vb.</p>
            </div>
        </div>
    );
};

export default FileUpload;