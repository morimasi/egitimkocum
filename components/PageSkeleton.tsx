import React from 'react';
import { SkeletonCard, SkeletonText } from './SkeletonLoader';

const PageSkeleton = () => (
    <div className="p-4 md:p-6 lg:p-8 animate-pulse">
        <div className="max-w-7xl mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SkeletonCard className="h-24"/>
                <SkeletonCard className="h-24"/>
                <SkeletonCard className="h-24"/>
            </div>
             <div className="mt-6">
                <SkeletonCard className="h-80"/>
            </div>
        </div>
    </div>
);

export default PageSkeleton;
