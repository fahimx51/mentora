'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/header/Navbar';
import { Calendar, ArrowLeft, Loader2, AlertCircle, Share2, Check, Clock, User } from 'lucide-react';
import { api } from '@/lib/api';

interface BlogPost {
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

export default function BlogDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const blogId = params?.id as string;

    const [blog, setBlog] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [copied, setCopied] = useState<boolean>(false);

    useEffect(() => {
        if (!blogId) return;

        const fetchSingleBlog = async () => {
            try {
                setLoading(true);
                setError('');

                const res = await api.get(`/blogs/${blogId}?populate=*`);
                const item = res?.data?.data || res?.data;

                if (!item) {
                    setError('Blog post not found.');
                    return;
                }

                const attrs = item.attributes || item;
                const authorData = attrs.author?.data?.attributes || attrs.author?.data || attrs.author;

                setBlog({
                    id: String(item.documentId || attrs.documentId || item.id),
                    documentId: item.documentId || attrs.documentId,
                    title: attrs.title || 'Untitled Post',
                    body: typeof attrs.body === 'string' ? attrs.body : '',
                    coverImage: attrs.coverImage || '',
                    createdAt: attrs.createdAt
                        ? new Date(attrs.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        })
                        : 'Recently',
                    author: {
                        username: authorData?.username || authorData?.name || 'Admin',
                    },
                });
            } catch (err: any) {
                console.error('Failed to fetch blog details:', err);
                setError('Failed to load this blog post.');
            } finally {
                setLoading(false);
            }
        };

        fetchSingleBlog();
    }, [blogId]);

    const handleCopyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const calculateReadingTime = (htmlBody: string) => {
        const text = htmlBody.replace(/<[^>]*>?/gm, '');
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16 overflow-x-hidden">
            {/* Rich Content Styling - Handles Horizontal Scroll Bugs */}
            <style jsx global>{`
                .blog-content {
                    color: inherit;
                    font-size: 1rem;
                    line-height: 1.8;
                    overflow-wrap: break-word;
                    word-wrap: break-word;
                    word-break: break-word;
                    max-width: 100%;
                }
                @media (min-width: 640px) {
                    .blog-content {
                        font-size: 1.125rem;
                    }
                }
                .blog-content h1 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    margin-top: 1.75rem;
                    margin-bottom: 0.75rem;
                }
                @media (min-width: 640px) {
                    .blog-content h1 {
                        font-size: 1.85rem;
                    }
                }
                .blog-content h2 {
                    font-size: 1.3rem;
                    font-weight: 700;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                }
                .blog-content h3 {
                    font-size: 1.15rem;
                    font-weight: 600;
                    margin-top: 1.25rem;
                    margin-bottom: 0.5rem;
                }
                .blog-content p {
                    margin-bottom: 1.25rem;
                }
                .blog-content ul {
                    list-style-type: disc;
                    padding-left: 1.25rem;
                    margin-bottom: 1.25rem;
                }
                .blog-content ol {
                    list-style-type: decimal;
                    padding-left: 1.25rem;
                    margin-bottom: 1.25rem;
                }
                .blog-content blockquote {
                    border-left: 4px solid #6366f1;
                    padding-left: 1rem;
                    margin: 1.25rem 0;
                    font-style: italic;
                    opacity: 0.9;
                }
                /* Code blocks wrapped to prevent screen blowout */
                .blog-content pre {
                    background-color: #0f172a;
                    color: #f8fafc;
                    padding: 1rem;
                    border-radius: 0.75rem;
                    overflow-x: auto;
                    max-width: 100%;
                    white-space: pre-wrap;
                    word-break: break-all;
                    font-size: 0.875rem;
                    margin: 1.25rem 0;
                }
                .blog-content code {
                    background-color: rgba(99, 102, 241, 0.1);
                    color: #6366f1;
                    padding: 0.2rem 0.4rem;
                    border-radius: 0.375rem;
                    font-size: 0.875em;
                    word-break: break-word;
                }
                .blog-content img {
                    border-radius: 0.75rem;
                    margin: 1.25rem 0;
                    max-width: 100% !important;
                    height: auto !important;
                    object-fit: cover;
                }
                .blog-content iframe,
                .blog-content table,
                .blog-content video {
                    max-width: 100% !important;
                }
                .blog-content a {
                    color: #6366f1;
                    text-decoration: underline;
                    text-underline-offset: 4px;
                    word-break: break-all;
                }
            `}</style>

            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() => router.push('/blogs')}
                        className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:border-primary/40 transition-all shadow-sm cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Articles</span>
                    </button>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-slate-500 font-medium">Loading article details...</p>
                    </div>
                ) : error || !blog ? (
                    /* Error State */
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 text-center space-y-4 shadow-sm max-w-md mx-auto">
                        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{error || 'Post Not Found'}</h2>
                        <button
                            type="button"
                            onClick={() => router.push('/blogs')}
                            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors"
                        >
                            Back to Blogs
                        </button>
                    </div>
                ) : (
                    /* Main Article Body */
                    <article className="space-y-6 sm:space-y-8 max-w-full">
                        {/* Header Box */}
                        <header className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-5 shadow-sm">
                            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight break-words">
                                {blog.title}
                            </h1>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                                {/* Author Info */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-purple-500/20 text-primary font-bold flex items-center justify-center border border-primary/30 shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                            @{blog.author?.username || 'Admin'}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {blog.createdAt}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {calculateReadingTime(blog.body)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <button
                                    type="button"
                                    onClick={handleCopyLink}
                                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all self-start sm:self-auto"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-emerald-500" />
                                            <span className="text-emerald-500">Link Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Share2 className="w-4 h-4 text-slate-400" />
                                            <span>Share Article</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </header>

                        {/* Banner Cover Image */}
                        {blog.coverImage && (
                            <div className="relative w-full h-[200px] sm:h-[350px] lg:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm">
                                <img
                                    src={blog.coverImage}
                                    alt={blog.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Main Body Content Container */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-sm max-w-full overflow-hidden">
                            <div
                                className="blog-content"
                                dangerouslySetInnerHTML={{ __html: blog.body }}
                            />
                        </div>
                    </article>
                )}
            </main>
        </div>
    );
}