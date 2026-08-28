'use client';

import React, { useState, useEffect } from 'react';
import { Newspaper, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';
import BlogTable from '@/components/admin/BlogTable';
import BlogModal from '@/components/admin/BlogModal';

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

const extractPlainText = (bodyData: any): string => {
    if (!bodyData) return '';
    if (typeof bodyData === 'string') {
        return bodyData.replace(/<[^>]*>?/gm, '');
    }
    return String(bodyData);
};

export default function AdminBlogPage() {
    const { user } = useAuth();
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [formData, setFormData] = useState<{
        title: string;
        body: string;
        coverImage: string;
        blog_status: 'draft' | 'published';
    }>({
        title: '',
        body: '',
        coverImage: '',
        blog_status: 'draft',
    });

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/blogs?populate=*');
            const rawData = res?.data?.data || res?.data || [];

            const formatted: BlogPost[] = rawData.map((item: any) => {
                const attrs = item.attributes || item;
                const authorData = attrs.author?.data?.attributes || attrs.author?.data || attrs.author;

                return {
                    id: String(item.documentId || attrs.documentId || item.id),
                    documentId: item.documentId || attrs.documentId,
                    title: attrs.title || 'Untitled Post',
                    body: typeof attrs.body === 'string' ? attrs.body : '',
                    coverImage: attrs.coverImage || '',
                    blog_status: attrs.blog_status || 'draft',
                    createdAt: attrs.createdAt,
                    author: {
                        id: authorData?.id,
                        username: authorData?.username || authorData?.name || 'Admin',
                    },
                };
            });

            setBlogs(formatted);
        } catch (err: any) {
            console.error('Failed to fetch blogs:', err);
            setError('Failed to load blog posts.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const handleOpenCreateModal = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        setEditingBlog(null);
        setFormData({ title: '', body: '', coverImage: '', blog_status: 'draft' });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (blog: BlogPost, e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        setEditingBlog(blog);
        setFormData({
            title: blog.title,
            body: blog.body || '',
            coverImage: blog.coverImage || '',
            blog_status: blog.blog_status || 'draft',
        });
        setIsModalOpen(true);
    };

    const handleSavePost = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!formData.title.trim()) {
            alert('Please enter a title');
            return;
        }

        if (!user?.id) {
            alert('User session not found. Please log in again.');
            return;
        }

        try {
            setSubmitting(true);
            const targetId = editingBlog?.documentId || editingBlog?.id;

            const payload = {
                data: {
                    title: formData.title,
                    body: formData.body || '',
                    coverImage: formData.coverImage || '',
                    author: user.id,
                    blog_status: formData.blog_status,
                },
            };

            if (editingBlog && targetId) {
                await api.put(`/blogs/${targetId}`, payload);
                setBlogs((prev) =>
                    prev.map((b) =>
                        (b.documentId || b.id) === targetId
                            ? { ...b, ...formData }
                            : b
                    )
                );
            } else {
                const res = await api.post('/blogs', payload);
                const newItem = res?.data?.data || res?.data;
                const attrs = newItem?.attributes || newItem || {};

                const createdPost: BlogPost = {
                    id: String(newItem?.documentId || attrs.documentId || newItem?.id || Date.now()),
                    documentId: newItem?.documentId || attrs.documentId,
                    ...formData,
                    createdAt: new Date().toISOString(),
                    author: {
                        id: Number(user.id),
                        username: user.username || 'Admin',
                    },
                };

                setBlogs((prev) => [createdPost, ...prev]);
            }

            setIsModalOpen(false);
        } catch (err: any) {
            console.error('--- STRAPI ERROR ---', err?.response?.data);
            const errorMsg = err?.response?.data?.error?.message || 'Validation error occurred';
            alert(`Failed to save post: ${errorMsg}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePublish = async (blog: BlogPost, e?: React.MouseEvent) => {
        if (e) e.preventDefault();

        const targetId = blog.documentId || blog.id;
        if (!targetId) return;

        const newStatus = blog.blog_status === 'published' ? 'draft' : 'published';

        setBlogs((prev) =>
            prev.map((b) => ((b.documentId || b.id) === targetId ? { ...b, blog_status: newStatus } : b))
        );

        try {
            await api.put(`/blogs/${targetId}`, { data: { blog_status: newStatus } });
        } catch (err) {
            console.error('Failed to toggle status:', err);
            alert('Failed to update status on server.');
            setBlogs((prev) =>
                prev.map((b) =>
                    (b.documentId || b.id) === targetId ? { ...b, blog_status: blog.blog_status } : b
                )
            );
        }
    };

    const handleDelete = async (blog: BlogPost, e?: React.MouseEvent) => {
        if (e) e.preventDefault();

        const targetId = blog.documentId || blog.id;
        if (!targetId) return;

        if (!confirm(`Are you sure you want to delete "${blog.title}"?`)) return;

        try {
            await api.delete(`/blogs/${targetId}`);
            setBlogs((prev) => prev.filter((b) => (b.documentId || b.id) !== targetId));
        } catch (err) {
            console.error('Failed to delete blog:', err);
            alert('Failed to delete post.');
        }
    };

    const filteredBlogs = blogs.filter((blog) => {
        const safeTitle = blog.title || '';
        const plainBody = extractPlainText(blog.body);

        const matchesQuery =
            safeTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            plainBody.toLowerCase().includes(searchQuery.toLowerCase());

        const isPub = blog.blog_status === 'published';

        if (filterStatus === 'published') return matchesQuery && isPub;
        if (filterStatus === 'draft') return matchesQuery && !isPub;
        return matchesQuery;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-slate-500 font-medium">Loading blog posts...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 px-3 sm:px-6 py-4">
            <style jsx global>{`
                .ql-toolbar.ql-snow {
                    border: none !important;
                    border-bottom: 1px solid rgba(226, 232, 240, 1) !important;
                    background-color: transparent;
                }
                .dark .ql-toolbar.ql-snow {
                    border-bottom: 1px solid rgba(51, 65, 85, 1) !important;
                }
                .ql-container.ql-snow {
                    border: none !important;
                    font-size: 14px;
                }
                .dark .ql-editor {
                    color: #f8fafc !important;
                }
                .dark .ql-editor.ql-blank::before {
                    color: #94a3b8 !important;
                }
                .dark .ql-stroke {
                    stroke: #94a3b8 !important;
                }
                .dark .ql-fill {
                    fill: #94a3b8 !important;
                }
                .dark .ql-picker {
                    color: #94a3b8 !important;
                }
                .dark .ql-picker-options {
                    background-color: #1e293b !important;
                    border-color: #334155 !important;
                    color: #f8fafc !important;
                }
            `}</style>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <Newspaper className="w-7 h-7 text-primary shrink-0" />
                        <span>Blog Posts Management</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Create, edit, publish, or draft articles across the platform.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md transition-all self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Blog Post</span>
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm flex items-center gap-3 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search posts by title or body..."
                        className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'all'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        All ({blogs.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterStatus('published')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'published'
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        Published ({blogs.filter((b) => b.blog_status === 'published').length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterStatus('draft')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'draft'
                            ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        Drafts ({blogs.filter((b) => b.blog_status !== 'published').length})
                    </button>
                </div>
            </div>

            <BlogTable
                blogs={filteredBlogs}
                defaultUsername={user?.username}
                extractPlainText={extractPlainText}
                onTogglePublish={handleTogglePublish}
                onEdit={handleOpenEditModal}
                onDelete={handleDelete}
            />

            <BlogModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingBlog={editingBlog}
                formData={formData}
                setFormData={setFormData}
                onSave={handleSavePost}
                submitting={submitting}
            />
        </div>
    );
}