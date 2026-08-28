'use client';

import React from 'react';
import { Edit2, Trash2, Globe, FileEdit, Newspaper } from 'lucide-react';

interface BlogPost {
    id: string;
    documentId?: string;
    title: string;
    body: string;
    coverImage?: string;
    blog_status: 'draft' | 'published';
    createdAt?: string;
    author?: {
        id?: number;
        username?: string;
        name?: string;
    };
}

interface BlogTableProps {
    blogs: BlogPost[];
    defaultUsername?: string;
    extractPlainText: (body: any) => string;
    onTogglePublish: (blog: BlogPost, e?: React.MouseEvent) => void;
    onEdit: (blog: BlogPost, e?: React.MouseEvent) => void;
    onDelete: (blog: BlogPost, e?: React.MouseEvent) => void;
}

export default function BlogTable({
    blogs,
    defaultUsername,
    extractPlainText,
    onTogglePublish,
    onEdit,
    onDelete,
}: BlogTableProps) {
    if (blogs.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
                <Newspaper className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
                    No blog posts found.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                            <th className="py-3.5 px-4 sm:px-6">Title</th>
                            <th className="py-3.5 px-4 sm:px-6">Author</th>
                            <th className="py-3.5 px-4 sm:px-6">Status</th>
                            <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                        {blogs.map((blog) => {
                            const isPub = blog.blog_status === 'published';
                            return (
                                <tr
                                    key={blog.id}
                                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                    <td className="py-3.5 px-4 sm:px-6">
                                        <div className="space-y-1 max-w-md">
                                            <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                                                {blog.title}
                                            </p>
                                            <p className="text-xs text-slate-400 line-clamp-1">
                                                {extractPlainText(blog.body)}
                                            </p>
                                        </div>
                                    </td>

                                    <td className="py-3.5 px-4 sm:px-6 text-slate-600 dark:text-slate-400 font-medium">
                                        @{blog.author?.username || defaultUsername || 'Admin'}
                                    </td>

                                    <td className="py-3.5 px-4 sm:px-6">
                                        <button
                                            type="button"
                                            onClick={(e) => onTogglePublish(blog, e)}
                                            title="Click to toggle Draft / Published status"
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${isPub
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100'
                                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100'
                                                }`}
                                        >
                                            {isPub ? (
                                                <>
                                                    <Globe className="w-3.5 h-3.5" /> Published
                                                </>
                                            ) : (
                                                <>
                                                    <FileEdit className="w-3.5 h-3.5" /> Draft
                                                </>
                                            )}
                                        </button>
                                    </td>

                                    <td className="py-3.5 px-4 sm:px-6 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => onEdit(blog, e)}
                                                className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => onDelete(blog, e)}
                                                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}