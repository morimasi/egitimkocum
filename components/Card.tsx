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

const Card = React.memo(({ children, className = '', title, action, onClick, variant = 'default', icon, ...props }: CardProps) => {
    const clickableClasses = onClick ? 'cursor-pointer hover:shadow-primary hover:-translate-y-1' : '';
    const variantClasses = {
        default: 'bg-card text-card-foreground',
        gradient: 'bg-primary text-primary-foreground'
    };
    const titleColor = variant === 'gradient' ? 'text-primary-foreground' : 'text-foreground';
    const borderColor = variant === 'gradient' ? 'border-primary-foreground/20' : 'border-border';

    return (
        <div {...props} onClick={onClick} className={`relative rounded-lg shadow-md shadow-black/5 dark:shadow-none overflow-hidden transition-all duration-300 border border-border ${variantClasses[variant]} ${clickableClasses} ${className}`}>
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
});

export default Card;