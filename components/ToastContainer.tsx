

import React from 'react';
import { useUI } from '../contexts/UIContext';
import { ToastMessage } from '../types';
import { CheckCircleIcon, AlertCircleIcon, InfoIcon, XIcon } from './Icons';

// FIX: Define a props interface for the Toast component to resolve key prop error.
interface ToastProps {
    toast: ToastMessage;
    onDismiss: (id: number) => void;
}

const Toast = ({ toast, onDismiss }: ToastProps) => {
    const { type, message, id } = toast;

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [id, onDismiss]);

    const ICONS = {
        success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
        error: <AlertCircleIcon className="w-6 h-6 text-red-500" />,
        info: <InfoIcon className="w-6 h-6 text-blue-500" />,
    };

    const BG_COLORS = {
        success: 'bg-green-50 dark:bg-green-900/50 border-green-400',
        error: 'bg-red-50 dark:bg-red-900/50 border-red-400',
        info: 'bg-blue-50 dark:bg-blue-900/50 border-blue-400',
    };

    return (
        <div
            className={`flex items-start p-4 mb-4 rounded-lg shadow-lg border-l-4 ${BG_COLORS[type]} w-full max-w-sm animate-fade-in-right`}
        >
            <div className="flex-shrink-0">{ICONS[type]}</div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
                <button
                    onClick={() => onDismiss(id)}
                    className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <span className="sr-only">Close</span>
                    <XIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

const ToastContainer = () => {
    const { toasts, removeToast } = useUI();

    return (
        <div 
            className="fixed top-5 right-5 z-50 w-full max-w-sm"
            role="alert"
            aria-live="assertive"
        >
            {/* FIX: Simplified map to pass props directly, removing unused destructuring. */}
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
        </div>
    );
};

export default ToastContainer;