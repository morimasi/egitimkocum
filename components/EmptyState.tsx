import React from 'react';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
    return (
        <div className="text-center p-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="mx-auto w-16 h-16 flex items-center justify-center text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
