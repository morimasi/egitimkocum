import React from 'react';
import Modal from './Modal';
import { AlertTriangleIcon } from './Icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Sil',
    cancelText = 'İptal',
}: ConfirmationModalProps) => {

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const footerContent = (
        <div className="flex flex-row-reverse gap-2">
             <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
            >
                {confirmText}
            </button>
            <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
            >
                {cancelText}
            </button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" footer={footerContent}>
            <div className="flex items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="mt-1 text-center sm:mt-0 sm:ml-4 sm:text-left">
                     <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;