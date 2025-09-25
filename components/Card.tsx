
import React from 'react';

interface CardProps {
    children?: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
    onClick?: () => void;
    variant?: 'default' | 'gradient';
    icon?: React.ReactNode;
    [key: string]: any;
}

const Card = ({ children, className = '', title, action, onClick, variant = 'default', icon, ...props }: CardProps) => {
    const clickableClasses = onClick ? 'cursor-pointer hover:ring-2 hover:ring-primary-500/50' : '';
    const variantClasses = {
        default: 'bg-white dark:bg-gray-800',
        gradient: 'bg-gradient-to-br from-primary-500 to-primary-700 text-white dark:from-primary-600 dark:to-primary-800'
    };
    const titleColor = variant === 'gradient' ? 'text-white/90' : 'text-gray-900 dark:text-white';
    const borderColor = variant === 'gradient' ? 'border-white/20' : 'border-gray-200 dark:border-gray-700';

    return (
        <div {...props} onClick={onClick} className={`relative rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl ${variantClasses[variant]} ${clickableClasses} ${className}`}>
            {icon && (
                <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 text-white text-6xl pointer-events-none">
                    {icon}
                </div>
            )}
            {title && (
                <div className={`px-6 py-4 border-b ${borderColor} flex justify-between items-center`}>
                    <h3 className={`text-lg font-semibold ${titleColor}`}>{title}</h3>
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