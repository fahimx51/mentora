'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/header/Navbar';
import CourseCard, { Course } from '@/components/course/CourseCard';
import CourseCardSkeleton from '@/components/course/CourseCardSkeleton';
import { getCoursesApi } from '@/lib/api';
import { Search, BookOpen, AlertTriangle, Sparkles, X, ArrowUpDown, Filter } from 'lucide-react';

export default function PublicCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'title'>('newest');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setIsLoading(true);
            setError('');
            const res = await getCoursesApi();

            const courseList = Array.isArray(res) ? res : res.data || [];
            setCourses(courseList);
        } catch (err: any) {
            console.error('Failed to load public courses:', err);
            setError('Failed to load courses. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Combined Search & Sorting
    const filteredCourses = useMemo(() => {
        return courses
            .filter((course) => {
                const title = (course.title || course.attributes?.title || '').toLowerCase();
                const description = (course.description || course.attributes?.description || '').toLowerCase();
                const query = searchQuery.toLowerCase();

                return title.includes(query) || description.includes(query);
            })
            .sort((a, b) => {
                if (sortBy === 'title') {
                    const titleA = a.title || a.attributes?.title || '';
                    const titleB = b.title || b.attributes?.title || '';
                    return titleA.localeCompare(titleB);
                }
                // Default: newest first (based on ID)
                const idA = Number(a.id || 0);
                const idB = Number(b.id || 0);
                return idB - idA;
            });
    }, [courses, searchQuery, sortBy]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
            <Navbar />

            {/* Hero & Search Header */}
            <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/50 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800/80 py-16 md:py-20 px-4">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative max-w-4xl mx-auto text-center space-y-5">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 text-primary text-xs font-semibold tracking-wide backdrop-blur-sm">
                        <Sparkles size={14} />
                        Interactive Learning Platform
                    </div>

                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
                        Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Free Courses</span>
                    </h1>

                    <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
                        Enhance your technical skills with hands-on interactive courses designed for developers and creators.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto pt-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />

                            <input
                                type="text"
                                placeholder="Search courses by title or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-10 py-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm outline-none shadow-lg shadow-slate-200/50 dark:shadow-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />

                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Control Bar: Results count & Sort menu */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Filter size={16} className="text-primary" />
                        <span>Showing <strong className="text-slate-900 dark:text-white font-semibold">{filteredCourses.length}</strong> {filteredCourses.length === 1 ? 'course' : 'courses'}</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <ArrowUpDown size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-500">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e: any) => setSortBy(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="newest">Newest First</option>
                            <option value="title">Title (A - Z)</option>
                        </select>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-4 mb-8 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-3">
                        <AlertTriangle size={18} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Courses Display */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <CourseCardSkeleton count={6} />
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md mx-auto">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <BookOpen size={28} />
                        </div>
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                            {searchQuery ? 'No matching courses found' : 'No courses available'}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
                            {searchQuery
                                ? `We couldn't find anything for "${searchQuery}". Try adjusting your search query.`
                                : 'Check back later for newly published courses!'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium rounded-xl transition-colors"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <CourseCard
                                key={course.documentId || course.id}
                                course={course}
                                isDashboard={false}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}