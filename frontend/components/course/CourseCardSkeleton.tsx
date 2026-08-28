import React from 'react';

interface CourseCardSkeletonProps {
    count?: number;
}

export default function CourseCardSkeleton({ count = 1 }: CourseCardSkeletonProps) {
    const skeletons = Array.from({ length: count });

    return (
        <>
            {skeletons.map((_, idx) => (
                <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between animate-pulse min-h-[380px]"
                >
                    <div>
                        {/* Thumbnail Skeleton */}
                        <div className="h-48 w-full bg-slate-200 dark:bg-slate-800" />

                        {/* Content Skeleton */}
                        <div className="p-5 space-y-3">
                            {/* Title */}
                            <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />

                            {/* Description Lines */}
                            <div className="space-y-2 pt-2">
                                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
                                <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-md" />
                            </div>
                        </div>
                    </div>

                    {/* Footer Skeleton */}
                    <div className="p-5 pt-0">
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}