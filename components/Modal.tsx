import React, { useEffect } from 'react';
import { XIcon } from './Icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    if (!isOpen) return null;
    
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

    const modalId = `modal-title-${Math.random().toString(36).substring(2, 9)}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog" aria-labelledby={modalId}>
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh] transform transition-all duration-300 animate-scale-in`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h3 id={modalId} className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        aria-label="Kapat"
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
