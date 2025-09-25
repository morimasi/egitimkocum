
import React from 'react';

// FIX: Updated CardProps to make children optional and accept any other props to resolve TS errors.
interface CardProps {
    children?: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
    [key: string]: any;
}

const Card = ({ children, className = '', title, action, ...props }: CardProps) => {
    return (
        <div {...props} className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl ${className}`}>
            {title && (
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    {action}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};

export default Card;
