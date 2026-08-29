'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Edit, Trash2, ArrowRight, Sparkles } from 'lucide-react';

export interface Course {
    id: number;
    title?: string;
    description?: string;
    slug?: string;
    // Updated thumbnail type to accept direct text string or legacy media object
    thumbnail: string;
    attributes?: {
        title?: string;
        description?: string;
        slug?: string;
        thumbnail?: string | { data?: { attributes?: { url?: string } } };
    };
}

interface CourseCardProps {
    course: Course;
    href?: string;
    isDashboard?: boolean;
    onDelete?: (id: number) => void;
}

export default function CourseCard({ course, href, isDashboard = false, onDelete }: CourseCardProps) {
    // Extract normalized data across Strapi responses
    const title = course.title || course.attributes?.title || 'Untitled Course';
    const description = course.description || course.attributes?.description || 'No description provided.';
    const slug = course.slug || course.attributes?.slug || course.id.toString();



    const thumbnailUrl: string = course.thumbnail;

    // Default target link
    const targetHref = href || (isDashboard ? `/dashboard/courses/${course.id}` : `/courses/${slug}`);

    return (
        <div className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between">
            <div>
                {/* Cover Image Container */}
                <div className="h-48 bg-slate-100 dark:bg-slate-800/80 relative overflow-hidden">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            onError={(e) => {
                                // Fallback image if external URL fails to load
                                (e.target as HTMLImageElement).src = '/placeholder-course.png';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                            <BookOpen size={36} className="opacity-50" />
                            <span className="text-xs font-medium text-slate-400">No Cover Image</span>
                        </div>
                    )}

                    {/* Free Badge */}
                    <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <Sparkles size={12} />
                        FREE
                    </div>

                    {/* Dashboard Edit & Delete Buttons */}
                    {isDashboard && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                            <Link
                                href={`/dashboard/courses/${course.id}/edit`}
                                className="p-2 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition-colors"
                                title="Edit Course"
                            >
                                <Edit size={14} />
                            </Link>
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(course.id)}
                                    className="p-2 bg-white/90 dark:bg-slate-900/90 hover:bg-red-500 hover:text-white text-red-500 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition-colors"
                                    title="Delete Course"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Content Details */}
                <div className="p-5 space-y-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-5 pt-0">
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                        Full Access
                    </span>
                    <Link
                        href={targetHref}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:gap-1.5 transition-all"
                    >
                        Course Details
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}