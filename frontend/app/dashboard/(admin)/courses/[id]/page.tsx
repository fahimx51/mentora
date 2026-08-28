'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
    BookOpen,
    HelpCircle,
    FileText,
    Plus,
    Trash2,
    Edit,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Save,
    Video,
    Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Lesson {
    id: number;
    documentId?: string;
    title: string;
    videoUrl?: string;
    content?: string;
}

interface Quiz {
    id: number;
    documentId?: string;
    title: string;
}

interface Course {
    id: number;
    documentId?: string;
    title: string;
    description?: string;
    lessons?: Lesson[];
    quizzes?: Quiz[];
}

export default function SingleCourseAdminPage() {
    const params = useParams();
    const router = useRouter();
    const courseIdFromUrl = params?.id as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [successMsg, setSuccessMsg] = useState<string>('');
    const [isDeletingCourse, setIsDeletingCourse] = useState<boolean>(false);

    // Accordion expand/collapse state
    const [expandedLessonId, setExpandedLessonId] = useState<string | number | null>(null);

    // Form data state for each lesson
    const [editData, setEditData] = useState<{
        [key: string]: { title: string; videoUrl: string; content: string };
    }>({});
    const [savingLessonId, setSavingLessonId] = useState<string | number | null>(null);

    const fetchCourseDetails = async () => {
        if (!courseIdFromUrl) return;

        try {
            setLoading(true);
            setError('');

            let item = null;
            const isNumericId = /^\d+$/.test(courseIdFromUrl);

            // Fetch course with fully populated lessons and quizzes fields
            if (isNumericId) {
                const filterResponse = await api.get(
                    `/courses?filters[id][$eq]=${courseIdFromUrl}&populate[lessons][populate]=*&populate[quizzes][populate]=*`
                );
                const list = filterResponse?.data?.data || filterResponse?.data;
                if (Array.isArray(list) && list.length > 0) {
                    item = list[0];
                }
            } else {
                const response = await api.get(
                    `/courses/${courseIdFromUrl}?populate[lessons][populate]=*&populate[quizzes][populate]=*`
                );
                item = response?.data?.data || response?.data;
            }

            if (!item) {
                setError('Course not found.');
                return;
            }

            const attrs = item.attributes || item;

            // Extract all lesson properties properly (handling both Strapi v4 and v5 nested structures)
            const fetchedLessons: Lesson[] = (attrs.lessons?.data || attrs.lessons || []).map((l: any) => {
                const lessonAttrs = l.attributes || l;
                return {
                    id: l.id,
                    documentId: l.documentId || l.id,
                    title: lessonAttrs.title || '',
                    videoUrl: lessonAttrs.videoUrl || lessonAttrs.video_url || lessonAttrs.url || '',
                    content: lessonAttrs.content || lessonAttrs.description || '',
                };
            });

            const formattedCourse: Course = {
                id: item.id,
                documentId: item.documentId || item.id,
                title: attrs.title || 'Untitled Course',
                description: attrs.description || '',
                lessons: fetchedLessons,
                quizzes: (attrs.quizzes?.data || attrs.quizzes || []).map((q: any) => ({
                    id: q.id,
                    documentId: q.documentId || q.id,
                    title: q.attributes?.title || q.title || 'Untitled Quiz',
                })),
            };

            setCourse(formattedCourse);

            // Pre-fill all lesson form fields with fetched data
            const initialEditState: {
                [key: string]: { title: string; videoUrl: string; content: string };
            } = {};

            fetchedLessons.forEach((l) => {
                const key = l.documentId || l.id;
                initialEditState[key] = {
                    title: l.title || '',
                    videoUrl: l.videoUrl || '',
                    content: l.content || '',
                };
            });

            setEditData(initialEditState);

        } catch (err: any) {
            console.error('Failed to fetch course:', err);
            setError('Failed to load course details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourseDetails();
    }, [courseIdFromUrl]);

    const showMessage = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const toggleAccordion = (id: string | number) => {
        setExpandedLessonId(expandedLessonId === id ? null : id);
    };

    const handleInputChange = (
        lessonKey: string | number,
        field: 'title' | 'videoUrl' | 'content',
        value: string
    ) => {
        setEditData((prev) => ({
            ...prev,
            [lessonKey]: {
                ...prev[lessonKey],
                [field]: value,
            },
        }));
    };

    const handleSaveLesson = async (lessonKey: string | number) => {
        const payload = editData[lessonKey];
        if (!payload || !payload.title.trim()) {
            setError('Lesson title is required.');
            return;
        }

        try {
            setSavingLessonId(lessonKey);
            setError('');

            // Send API update request
            await api.put(`/lessons/${lessonKey}`, {
                data: {
                    title: payload.title,
                    videoUrl: payload.videoUrl,
                    content: payload.content,
                },
            });

            // Update the local course state directly without re-fetching
            setCourse((prevCourse) => {
                if (!prevCourse) return null;
                return {
                    ...prevCourse,
                    lessons: prevCourse.lessons?.map((l) => {
                        const key = l.documentId || l.id;
                        if (key === lessonKey) {
                            return {
                                ...l,
                                title: payload.title,
                                videoUrl: payload.videoUrl,
                                content: payload.content,
                            };
                        }
                        return l;
                    }),
                };
            });

            showMessage('Lesson updated successfully.');
        } catch (err) {
            console.error(err);
            setError('Failed to save lesson details.');
        } finally {
            setSavingLessonId(null);
        }
    };

    const handleDeleteCourse = async () => {
        if (!course) return;
        if (!confirm('Are you sure you want to delete this course?')) return;

        try {
            setIsDeletingCourse(true);
            setError('');

            await api.delete(`/courses/${course.documentId || course.id}`);

            // Show message before redirecting
            showMessage('Course deleted successfully. Redirecting...');

            // Smooth client-side navigation using Next.js router
            setTimeout(() => {
                router.push('/dashboard/courses');
            }, 1500);

        } catch (err) {
            console.error(err);
            setError('Failed to delete course.');
            setIsDeletingCourse(false);
        }
    };

    const handleDeleteLesson = async (lessonId: string | number) => {
        if (!confirm('Are you sure you want to delete this lesson?')) return;
        try {
            await api.delete(`/lessons/${lessonId}`);

            // Update local state directly to avoid re-fetching
            setCourse((prevCourse) => {
                if (!prevCourse) return null;
                return {
                    ...prevCourse,
                    lessons: prevCourse.lessons?.filter((l) => {
                        const key = l.documentId || l.id;
                        return key !== lessonId;
                    }),
                };
            });

            showMessage('Lesson deleted successfully.');
        } catch (err) {
            console.error(err);
            setError('Failed to delete lesson.');
        }
    };

    const handleDeleteQuiz = async (quizId: string | number) => {
        if (!confirm('Are you sure you want to delete this quiz?')) return;
        try {
            await api.delete(`/quizzes/${quizId}`);

            // Update local state directly to avoid re-fetching
            setCourse((prevCourse) => {
                if (!prevCourse) return null;
                return {
                    ...prevCourse,
                    quizzes: prevCourse.quizzes?.filter((q) => {
                        const key = q.documentId || q.id;
                        return key !== quizId;
                    }),
                };
            });

            showMessage('Quiz deleted successfully.');
        } catch (err) {
            console.error(err);
            setError('Failed to delete quiz.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs sm:text-sm text-slate-500">Loading course data...</p>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="max-w-5xl mx-auto space-y-4 px-2 sm:px-4 py-6">
                <Link
                    href="/dashboard/courses"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Courses
                </Link>
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error || 'Course not found.'}
                </div>
            </div>
        );
    }

    const courseDocId = course.documentId || course.id;

    return (
        <div className="max-w-5xl mx-auto space-y-6 px-2 sm:px-4 py-4">
            {/* Header / Navigation */}
            <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <Link
                    href="/dashboard/courses"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to All Courses
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-primary" /> {course.title}
                        </h1>
                        {course.description && (
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {course.description}
                            </p>
                        )}
                        <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1">
                            {course.lessons?.length || 0} Lessons • {course.quizzes?.length || 0} Quizzes
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/dashboard/courses/edit/${courseDocId}`}
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm"
                        >
                            <Edit className="w-4 h-4" /> Edit Course
                        </Link>
                        <button
                            onClick={handleDeleteCourse}
                            disabled={isDeletingCourse}
                            className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                            {isDeletingCourse ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" /> Delete Course
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {successMsg}
                </div>
            )}

            {/* Course Content Sections */}
            <div className="space-y-6">
                {/* Lessons Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" /> Lessons ({course.lessons?.length || 0})
                        </h2>
                        <Link
                            href={`/dashboard/lessons/create?courseId=${courseDocId}`}
                            className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" /> Add Lesson
                        </Link>
                    </div>

                    {course.lessons && course.lessons.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {course.lessons.map((lesson) => {
                                const lessonKey = lesson.documentId || lesson.id;
                                const isExpanded = expandedLessonId === lessonKey;
                                const isSaving = savingLessonId === lessonKey;

                                return (
                                    <div
                                        key={lesson.id}
                                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 overflow-hidden transition-all"
                                    >
                                        {/* Header */}
                                        <div
                                            onClick={() => toggleAccordion(lessonKey)}
                                            className="w-full p-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                {editData[lessonKey]?.title || lesson.title}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteLesson(lessonKey);
                                                    }}
                                                    className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
                                                    title="Delete Lesson"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-slate-500" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded Form */}
                                        {isExpanded && (
                                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Lesson Title */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                            Lesson Title *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={editData[lessonKey]?.title ?? ''}
                                                            onChange={(e) =>
                                                                handleInputChange(lessonKey, 'title', e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                            placeholder="Enter lesson title"
                                                        />
                                                    </div>

                                                    {/* Fixed Read-Only Course Field */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                                            <span>Course *</span>
                                                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                                                <Lock className="w-3 h-3" /> Fixed
                                                            </span>
                                                        </label>
                                                        <div className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between cursor-not-allowed">
                                                            <span>{course.title}</span>
                                                            <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Video URL */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                        Video URL (YouTube or direct video link)
                                                    </label>
                                                    <div className="relative">
                                                        <Video className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                        <input
                                                            type="text"
                                                            value={editData[lessonKey]?.videoUrl ?? ''}
                                                            onChange={(e) =>
                                                                handleInputChange(lessonKey, 'videoUrl', e.target.value)
                                                            }
                                                            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                            placeholder="https://www.youtube.com/watch?v=..."
                                                        />
                                                    </div>
                                                </div>

                                                {/* Lesson Content */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                        Lesson Content
                                                    </label>
                                                    <textarea
                                                        rows={4}
                                                        value={editData[lessonKey]?.content ?? ''}
                                                        onChange={(e) =>
                                                            handleInputChange(lessonKey, 'content', e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
                                                        placeholder="Write the text content, notes, or instructions for this lesson..."
                                                    />
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleAccordion(lessonKey)}
                                                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveLesson(lessonKey)}
                                                        disabled={isSaving}
                                                        className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all inline-flex items-center gap-1.5"
                                                    >
                                                        {isSaving ? (
                                                            <>
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Save className="w-3.5 h-3.5" /> Save Lesson
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs sm:text-sm text-slate-400 italic py-2">
                            No lessons added to this course yet.
                        </p>
                    )}
                </div>

                {/* Quizzes Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-emerald-500" /> Quizzes ({course.quizzes?.length || 0})
                        </h2>
                        <Link
                            href={`/dashboard/quizzes/create?courseId=${courseDocId}`}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" /> Add Quiz
                        </Link>
                    </div>

                    {course.quizzes && course.quizzes.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2.5">
                            {course.quizzes.map((quiz) => {
                                const quizDocId = quiz.documentId || quiz.id;
                                return (
                                    <div
                                        key={quiz.id}
                                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm"
                                    >
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {quiz.title}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDeleteQuiz(quizDocId)}
                                                className="p-1.5 rounded-md text-slate-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
                                                title="Delete Quiz"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs sm:text-sm text-slate-400 italic py-2">
                            No quizzes added to this course yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}