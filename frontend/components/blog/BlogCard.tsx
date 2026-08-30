'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';

export interface BlogPost {
    id: string;
    documentId?: string;
    title: string;
    body: string;
    coverImage?: string;
    createdAt?: string;
    author?: {
        username?: string;
        name?: string;
    };
}

interface BlogCardProps {
    blog: BlogPost;
    plainTextBody: string;
}

// Function to decode HTML entities like &nbsp; and remove HTML tags
const cleanRichText = (htmlString: string): string => {
    if (!htmlString) return '';

    // Step 1: Decode HTML entities if in browser environment
    if (typeof window !== 'undefined') {
        const doc = new DOMParser().parseFromString(htmlString, 'text/html');
        return doc.body.textContent || '';
    }

    // Step 2: Fallback for SSR
    return htmlString
        .replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')   // Replace &nbsp; with space
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
};

export default function BlogCard({ blog, plainTextBody }: BlogCardProps) {
    // Clean the plainTextBody to fix &nbsp; and HTML entity issues
    const cleanedExcerpt = cleanRichText(plainTextBody);

    return (
        <article className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1 transition-all duration-300">
            {/* Cover Image Container */}
            <div className="relative h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Card Body */}
            <div className="flex flex-col flex-1 p-6 justify-between space-y-4">
                <div className="space-y-3">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{blog.createdAt}</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {blog.title}
                    </h2>

                    {/* Excerpt Preview */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {cleanedExcerpt}
                    </p>
                </div>

                {/* Footer / Author & Action */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center uppercase">
                            {(blog.author?.username || 'A')[0]}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            @{blog.author?.username || 'Admin'}
                        </span>
                    </div>

                    <Link
                        href={`/blogs/${blog.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover group/link"
                    >
                        <span>Read Post</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </article>
    );
}