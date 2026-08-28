'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
    BookOpen,
    CheckCircle2,
    Circle,
    ChevronLeft,
    Loader2,
    FileText,
    HelpCircle,
    PlayCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';
import VideoPlayer from '@/components/shared/VideoPlayer';

interface LessonProgress {
    id?: number;
    documentId?: string;
    isCompleted?: boolean;
    student?: { id: number; documentId?: string } | number | string;
    user?: { id: number; documentId?: string } | number | string;
}

interface Lesson {
    id: number;
    documentId: string;
    title: string;
    content?: string;
    videoUrl?: string;
    createdAt?: string;
    lesson_progresses?: LessonProgress[];
}

interface Quiz {
    id: number;
    documentId: string;
    title?: string;
    description?: string;
    createdAt?: string;
}

interface CourseDetails {
    id: number;
    documentId: string;
    title: string;
    description?: string;
    lessons?: Lesson[];
    quizzes?: Quiz[];
}

type TimelineItem =
    | { type: 'lesson'; data: Lesson; createdAt: string }
    | { type: 'quiz'; data: Quiz; createdAt: string };

export default function SingleCoursePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const courseId = resolvedParams.id;

    const { user } = useAuth();
    const [course, setCourse] = useState<CourseDetails | null>(null);
    const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
    const [activeItem, setActiveItem] = useState<TimelineItem | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const fetchCourseDetails = async (isBackground = false) => {
        if (!user || !courseId) return;

        try {
            if (!isBackground) setIsLoading(true);

            const response = await api.get(`/courses/${courseId}`, {
                params: {
                    'populate[lessons][populate][lesson_progresses][populate]': '*',
                    'populate[quizzes]': 'true',
                },
            });

            const data: CourseDetails = response?.data?.data || response?.data;
            setCourse(data);

            const mergedItems: TimelineItem[] = [];

            if (data?.lessons) {
                data.lessons.forEach((l) => {
                    mergedItems.push({
                        type: 'lesson',
                        data: l,
                        createdAt: l.createdAt || '',
                    });
                });
            }

            if (data?.quizzes) {
                data.quizzes.forEach((q) => {
                    mergedItems.push({
                        type: 'quiz',
                        data: q,
                        createdAt: q.createdAt || '',
                    });
                });
            }

            mergedItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            setTimelineItems(mergedItems);

            // Sync active selection cleanly without resetting UI position
            setActiveItem((prev) => {
                if (!prev) return mergedItems[0];
                const found = mergedItems.find((item) =>
                    item.type === prev.type && item.data.id === prev.data.id
                );
                return found || mergedItems[0];
            });
        } catch (err: unknown) {
            console.error('Failed to load course details:', err);
            if (!isBackground) setError('Could not load course details. Please try again.');
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourseDetails();
    }, [user, courseId]);

    const isLessonCompleted = (lesson: Lesson) => {
        const progressList = lesson.lesson_progresses || [];
        return progressList.some((p) => p.isCompleted);
    };

    const handleToggleComplete = async (lesson: Lesson) => {
        if (!lesson || !user || isLessonCompleted(lesson)) return;

        try {
            setIsUpdating(true);

            const currentProgress = lesson.lesson_progresses?.[0];
            const studentVal = user.documentId || user.id;
            const lessonVal = lesson.documentId || lesson.id;

            const payload = {
                data: {
                    isCompleted: true,
                    student: studentVal,
                    lesson: lessonVal
                }
            };

            let res;
            if (currentProgress) {
                const targetId = currentProgress.documentId || currentProgress.id;
                res = await api.put(`/lesson-progresses/${targetId}`, payload);
            } else {
                res = await api.post('/lesson-progresses', payload);
            }

            const savedProgress = res?.data?.data || res?.data;

            // Direct local state mutation (no screen reload/flash)
            setCourse((prevCourse) => {
                if (!prevCourse || !prevCourse.lessons) return prevCourse;
                return {
                    ...prevCourse,
                    lessons: prevCourse.lessons.map((l) => {
                        if (l.id === lesson.id) {
                            return {
                                ...l,
                                lesson_progresses: [
                                    ...(l.lesson_progresses || []),
                                    {
                                        id: savedProgress?.id || Date.now(),
                                        documentId: savedProgress?.documentId,
                                        isCompleted: true
                                    }
                                ]
                            };
                        }
                        return l;
                    })
                };
            });

            // Sync currently active lesson state
            setActiveItem((prev) => {
                if (prev && prev.type === 'lesson' && prev.data.id === lesson.id) {
                    return {
                        ...prev,
                        data: {
                            ...prev.data,
                            lesson_progresses: [
                                ...(prev.data.lesson_progresses || []),
                                {
                                    id: savedProgress?.id || Date.now(),
                                    documentId: savedProgress?.documentId,
                                    isCompleted: true
                                }
                            ]
                        }
                    };
                }
                return prev;
            });

            // Quiet background sync without triggering full page loader
            fetchCourseDetails(true);
        } catch (err) {
            console.error('Failed to update lesson progress:', err);
            await fetchCourseDetails(true);
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading course player...</p>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="space-y-4 text-center py-12">
                <p className="text-red-500 font-medium">{error || 'Course not found'}</p>
                <Link
                    href="/dashboard/my-courses"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                >
                    <ChevronLeft size={16} /> Back to My Courses
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <Link
                    href="/dashboard/my-courses"
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-medium"
                >
                    <ChevronLeft size={18} /> Back to My Courses
                </Link>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-md">
                    {course.title}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-4">
                    {activeItem ? (
                        activeItem.type === 'lesson' ? (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-5">
                                <VideoPlayer
                                    url={activeItem.data.videoUrl}
                                    title={activeItem.data.title}
                                />

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {activeItem.data.title}
                                    </h2>

                                    <button
                                        onClick={() => handleToggleComplete(activeItem.data)}
                                        disabled={isUpdating || isLessonCompleted(activeItem.data)}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${isLessonCompleted(activeItem.data)
                                            ? 'bg-emerald-500 text-white cursor-not-allowed opacity-90'
                                            : 'bg-primary hover:bg-primary-hover text-white'
                                            }`}
                                    >
                                        {isUpdating ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : isLessonCompleted(activeItem.data) ? (
                                            <>
                                                <CheckCircle2 size={16} /> Completed
                                            </>
                                        ) : (
                                            <>
                                                <Circle size={16} /> Mark as Complete
                                            </>
                                        )}
                                    </button>
                                </div>

                                {activeItem.data.content && (
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-3">
                                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                            <FileText size={16} /> Lesson Content
                                        </h3>
                                        <p>{activeItem.data.content}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6">
                                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <HelpCircle size={36} />
                                </div>

                                <div className="space-y-2 max-w-md mx-auto">
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                        Course Quiz
                                    </span>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {activeItem.data.title || 'Knowledge Assessment'}
                                    </h2>
                                    {activeItem.data.description && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {activeItem.data.description}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <Link
                                        href={`/dashboard/quizzes/${activeItem.data.documentId || activeItem.data.id}`}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-all shadow-md"
                                    >
                                        Start Quiz
                                    </Link>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
                            Select an item from the syllabus to get started.
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                            <BookOpen size={16} /> Course Syllabus
                        </h3>
                        <span className="text-xs font-medium text-slate-500">
                            {timelineItems.length} Items
                        </span>
                    </div>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                        {timelineItems.map((item, idx) => {
                            const isSelected =
                                activeItem?.type === item.type &&
                                activeItem.data.id === item.data.id;

                            if (item.type === 'lesson') {
                                const completed = isLessonCompleted(item.data);
                                return (
                                    <button
                                        key={`lesson-${item.data.documentId || item.data.id}`}
                                        onClick={() => setActiveItem(item)}
                                        className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${isSelected
                                            ? 'border-primary bg-primary/5 dark:bg-primary/10 font-semibold text-primary'
                                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <span className="text-slate-400 font-mono text-[11px]">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <PlayCircle size={14} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{item.data.title}</span>
                                        </div>

                                        {completed ? (
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                        ) : (
                                            <Circle size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                        )}
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={`quiz-${item.data.documentId || item.data.id}`}
                                    onClick={() => setActiveItem(item)}
                                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${isSelected
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 font-semibold text-primary'
                                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <span className="text-slate-400 font-mono text-[11px]">
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <HelpCircle size={14} className="text-amber-500 shrink-0" />
                                        <span className="truncate">{item.data.title || 'Quiz'}</span>
                                    </div>

                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                        Quiz
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}