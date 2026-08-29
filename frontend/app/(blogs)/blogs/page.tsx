'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/header/Navbar';
import { Search, Calendar, ArrowRight, BookOpen, Loader2, Sparkles, X } from 'lucide-react';
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

const extractPlainText = (bodyData: any): string => {
    if (!bodyData) return '';
    if (typeof bodyData === 'string') {
        return bodyData.replace(/<[^>]*>?/gm, '');
    }
    return String(bodyData);
};

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        const fetchPublishedBlogs = async () => {
            try {
                setLoading(true);
                const res = await api.get('/blogs?filters[blog_status][$eq]=published&populate=*');
                const rawData = res?.data?.data || res?.data || [];

                const formatted: BlogPost[] = rawData.map((item: any) => {
                    const attrs = item.attributes || item;
                    const authorData = attrs.author?.data?.attributes || attrs.author?.data || attrs.author;

                    return {
                        id: String(item.documentId || attrs.documentId || item.id),
                        documentId: item.documentId || attrs.documentId,
                        title: attrs.title || 'Untitled Post',
                        body: typeof attrs.body === 'string' ? attrs.body : '',
                        coverImage: attrs.coverImage || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
                        createdAt: attrs.createdAt
                            ? new Date(attrs.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })
                            : 'Recently',
                        author: {
                            username: authorData?.username || authorData?.name || 'Admin',
                        },
                    };
                });

                setBlogs(formatted);
            } catch (err) {
                console.error('Failed to load published blogs:', err);
                setError('Failed to load blogs. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchPublishedBlogs();
    }, []);

    // Filter blogs based on search query
    const filteredBlogs = useMemo(() => {
        if (!searchQuery.trim()) return blogs;

        const query = searchQuery.toLowerCase();
        return blogs.filter((blog) => {
            const titleMatch = blog.title.toLowerCase().includes(query);
            const bodyMatch = extractPlainText(blog.body).toLowerCase().includes(query);
            const authorMatch = (blog.author?.username || '').toLowerCase().includes(query);
            return titleMatch || bodyMatch || authorMatch;
        });
    }, [blogs, searchQuery]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            {/* Navbar */}
            <Navbar />

            {/* Hero Header Section */}
            <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 sm:py-20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Discover Articles & Tutorials</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
                        Explore Our Blog
                    </h1>

                    <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
                        Search through technology updates, modern development guides, and detailed tutorials.
                    </p>

                    {/* Search Input Box */}
                    <div className="max-w-xl mx-auto pt-2">
                        <div className="relative flex items-center shadow-lg shadow-slate-200/50 dark:shadow-none rounded-2xl">
                            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search articles by title, content, or author..."
                                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                {/* Search Count Header */}
                {!loading && !error && searchQuery && (
                    <div className="flex items-center justify-between pb-6">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                            Found <span className="text-primary font-bold">{filteredBlogs.length}</span> {filteredBlogs.length === 1 ? 'article' : 'articles'} matching "{searchQuery}"
                        </p>
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="text-xs font-bold text-primary hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-slate-500 font-medium">Loading articles...</p>
                    </div>
                ) : error ? (
                    /* Error State */
                    <div className="max-w-md mx-auto text-center py-12 px-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm font-medium">
                        {error}
                    </div>
                ) : filteredBlogs.length === 0 ? (
                    /* Empty Search State */
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                No articles found
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {searchQuery ? `We couldn't find anything matching "${searchQuery}". Try different keywords.` : 'No published blogs are available at the moment.'}
                            </p>
                        </div>
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Reset Search
                            </button>
                        )}
                    </div>
                ) : (
                    /* Blog Card Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredBlogs.map((blog) => (
                            <article
                                key={blog.id}
                                className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1 transition-all duration-300"
                            >
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
                                            {extractPlainText(blog.body)}
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
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}