'use client';

import React from 'react';
import { Loader2, X, Link as LinkIcon } from 'lucide-react';
import QuillEditor from './QuillEditor';

interface BlogPost {
    id: string;
    documentId?: string;
    title: string;
    body: string;
    coverImage?: string;
    blog_status: 'draft' | 'published';
}

interface BlogModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingBlog: BlogPost | null;
    formData: {
        title: string;
        body: string;
        coverImage: string;
        blog_status: 'draft' | 'published';
    };
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    onSave: (e?: React.FormEvent) => void;
    submitting: boolean;
}

export default function BlogModal({
    isOpen,
    onClose,
    editingBlog,
    formData,
    setFormData,
    onSave,
    submitting,
}: BlogModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter blog title..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Cover Image URL
                        </label>
                        <div className="relative">
                            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={formData.coverImage}
                                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                placeholder="https://images.unsplash.com/photo-..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Post Status *
                        </label>
                        <select
                            value={formData.blog_status}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    blog_status: e.target.value as 'draft' | 'published',
                                })
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Body Content (Rich Text)
                        </label>
                        <QuillEditor
                            value={formData.body}
                            onChange={(content) => setFormData({ ...formData, body: content })}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={onSave}
                        className={`px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center gap-2 ${formData.blog_status === 'published'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-primary hover:bg-primary-hover'
                            }`}
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>
                            {formData.blog_status === 'published'
                                ? editingBlog
                                    ? 'Update & Publish'
                                    : 'Save & Publish'
                                : editingBlog
                                    ? 'Update Draft'
                                    : 'Save as Draft'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}