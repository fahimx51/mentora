'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, PlayCircle, BookOpen, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';

interface Course {
    id: number;
    documentId?: string;
    title: string;
}

export default function CreateLessonPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const searchParams = useSearchParams();
    const courseId = searchParams.get('courseId');
    const isCourseLocked = Boolean(courseId);

    useEffect(() => {
        if (!isAuthLoading) {
            fetchCourses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthLoading]);

    const fetchCourses = async () => {
        try {
            setIsLoadingCourses(true);

            const roleName = user?.role?.name?.toLowerCase();

            // Instructors only see their own courses
            const query =
                roleName === 'instructor'
                    ? `/courses?filters[instructor][id][$eq]=${user?.id}`
                    : '/courses';

            const res = await api.get(query);
            const data = res.data?.data || res.data || [];

            const parsedCourses = data.map((item: any) => ({
                id: item.id,
                documentId: item.documentId,
                title: item.title || item.attributes?.title || 'Untitled Course'
            }));

            setCourses(parsedCourses);

            if (courseId) {
                // Lock to the course passed via URL, if it's in the fetched list
                const matched = parsedCourses.find(
                    (c: Course) => String(c.documentId || c.id) === String(courseId)
                );
                if (matched) {
                    setSelectedCourse(String(matched.documentId || matched.id));
                } else {
                    // Course wasn't in their allowed list (e.g. not their own) — block silently
                    setSelectedCourse('');
                    setError('You do not have access to add lessons to this course.');
                }
            } else if (parsedCourses.length > 0) {
                setSelectedCourse(String(parsedCourses[0].documentId || parsedCourses[0].id));
            }
        } catch (err) {
            console.error('Failed to fetch courses:', err);
            setError('Could not load courses for selection.');
        } finally {
            setIsLoadingCourses(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!title.trim()) {
            setError('Title is required.');
            return;
        }

        if (!selectedCourse) {
            setError('Please select a course.');
            return;
        }

        try {
            setIsSubmitting(true);

            await api.post('/lessons', {
                data: {
                    title,
                    content,
                    videoUrl,
                    course: selectedCourse,
                },
            });

            setSuccessMsg('Lesson created successfully!');
            setTimeout(() => {
                if (courseId) {
                    router.push(`/dashboard/courses/${courseId}`);
                } else {
                    router.push('/dashboard/courses');
                }
            }, 1500);
        } catch (err: any) {
            console.error('Failed to create lesson:', err);
            setError(err.response?.data?.error?.message || 'Failed to create lesson. Please check fields.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 py-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <Link
                    href={`${courseId ? `/dashboard/courses/${courseId}` : "/dashboard/courses"}`}
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-medium"
                >
                    <ArrowLeft size={18} /> Back to Courses
                </Link>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    Create New Lesson
                </h1>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-600 font-medium">
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    <span>{successMsg}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Lesson Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter lesson title"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Course *
                        </label>
                        {isLoadingCourses ? (
                            <div className="flex items-center gap-2 py-3 px-4 border rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 text-sm">
                                <Loader2 size={16} className="animate-spin" /> Loading courses...
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    required
                                    disabled={isCourseLocked}
                                    className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm appearance-none ${isCourseLocked ? 'opacity-60 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {courses.map((c) => (
                                        <option key={c.id} value={c.documentId || c.id}>
                                            {c.title}
                                        </option>
                                    ))}
                                </select>
                                <BookOpen size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        )}
                        {isCourseLocked && (
                            <p className="text-xs text-slate-500">
                                Course is preselected and cannot be changed.
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Video URL (YouTube or Direct Video Link)
                    </label>
                    <div className="relative">
                        <input
                            type="url"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                        <PlayCircle size={18} className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Lesson Content
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write the text content, notes, or instructions for this lesson..."
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm leading-relaxed"
                    />
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Link
                        href="/dashboard/my-courses"
                        className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting || !selectedCourse}
                        className="px-8 py-3 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-hover text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Saving...
                            </>
                        ) : (
                            'Save Lesson'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}