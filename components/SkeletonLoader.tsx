
import React from 'react';

interface SkeletonProps {
    className?: string;
    children?: React.ReactNode;
}

export const SkeletonText = ({ className = '' }: SkeletonProps) => (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}></div>
);

export const SkeletonCard = ({ className = '', children }: SkeletonProps) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-pulse ${className}`}>
        {children || (
            <div className="space-y-4">
                <SkeletonText className="h-4 w-1/4" />
                <SkeletonText className="h-10 w-full" />
                <SkeletonText className="h-10 w-full" />
                <SkeletonText className="h-10 w-3/4" />
            </div>
        )}
    </div>
);

export const DashboardSkeleton = () => (
     <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard className="h-24 p-4">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1 space-y-2">
                        <SkeletonText className="h-4 w-2/3" />
                        <SkeletonText className="h-6 w-1/3" />
                    </div>
                </div>
            </SkeletonCard>
             <SkeletonCard className="h-24 p-4">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1 space-y-2">
                        <SkeletonText className="h-4 w-2/3" />
                        <SkeletonText className="h-6 w-1/3" />
                    </div>
                </div>
            </SkeletonCard>
             <SkeletonCard className="h-24 p-4">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1 space-y-2">
                        <SkeletonText className="h-4 w-2/3" />
                        <SkeletonText className="h-6 w-1/3" />
                    </div>
                </div>
            </SkeletonCard>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonCard className="lg:col-span-2 h-80"/>
            <SkeletonCard className="h-80"/>
        </div>
    </div>
);
