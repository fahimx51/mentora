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
    PlayCircle,
    Award,
    Clock,
    User,
    LayoutDashboard,
    Sparkles,
    Check
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';
import VideoPlayer from '@/components/shared/VideoPlayer';
import Image from 'next/image';

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
    videoUrl: string;
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
    duration?: string;
    instructor?: {
        username?: string;
    };
    thumbnail: string;
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
                    'populate[instructor]': 'true',
                    'populate[quizzes]': 'true',
                    'populate[lessons][populate][lesson_progresses][populate][student][fields][0]': 'id',
                    'populate[lessons][populate][lesson_progresses][populate][student][fields][1]': 'documentId',
                },
            });

            const data: CourseDetails = response?.data?.data || response?.data;
            // console.log("course data => ",data);
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
        } catch (err: unknown) {
            console.error('Failed to load course details:', err);
            if (!isBackground) setError('Could not load course details. Please try again.');
        } finally {
            if (!isBackground) setIsLoading(false);
        }
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
                    lesson: lessonVal,
                },
            };

            let res;
            if (currentProgress) {
                const targetId = currentProgress.documentId || currentProgress.id;
                res = await api.put(`/lesson-progresses/${targetId}`, payload);
            } else {
                res = await api.post('/lesson-progresses', payload);
            }

            const savedProgress = res?.data?.data || res?.data;
            // console.log('Saved progress:', savedProgress);

            const newProgressObj = {
                id: savedProgress?.id || Date.now(),
                documentId: savedProgress?.documentId,
                isCompleted: true,
            };

            // 1. Update course state
            setCourse((prevCourse) => {
                if (!prevCourse || !prevCourse.lessons) return prevCourse;
                return {
                    ...prevCourse,
                    lessons: prevCourse.lessons.map((l) => {
                        const match = l.documentId
                            ? l.documentId === lesson.documentId
                            : l.id === lesson.id;
                        return match ? { ...l, lesson_progresses: [newProgressObj] } : l;
                    }),
                };
            });

            // 2. Update timeline items state (This updates the lesson list on screen)
            setTimelineItems((prevItems) =>
                prevItems.map((item) => {
                    if (item.type === 'lesson') {
                        const match = item.data.documentId
                            ? item.data.documentId === lesson.documentId
                            : item.data.id === lesson.id;
                        if (match) {
                            return {
                                ...item,
                                data: {
                                    ...item.data,
                                    lesson_progresses: [newProgressObj],
                                },
                            };
                        }
                    }
                    return item;
                })
            );

            // 3. Sync with backend
            await fetchCourseDetails(true);
        } catch (err) {
            console.error('Failed to update lesson progress:', err);
            await fetchCourseDetails(true);
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        fetchCourseDetails();
    }, [user, courseId]);


    const isLessonCompleted = (lesson: Lesson) => {
        const progressList = lesson.lesson_progresses || [];
        return progressList.some((p) => p.isCompleted);
    };
    // Calculate progress
    const totalLessons = course?.lessons?.length || 0;
    const completedLessonsCount = course?.lessons?.filter(isLessonCompleted).length || 0;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-primary" />
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Loading course player...</p>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="space-y-4 text-center py-12">
                <p className="text-red-500 text-xs sm:text-sm font-medium">{error || 'Course not found'}</p>
                <Link
                    href="/dashboard/my-courses"
                    className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary hover:underline font-medium"
                >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back to My Courses
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
            {/* Header Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3 sm:pb-4 gap-2 sm:gap-4">
                <Link
                    href="/dashboard/my-courses"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-medium w-fit"
                >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back to My Courses
                </Link>

                <div className="flex items-center gap-2 sm:gap-3">
                    <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                        {course.title}
                    </h1>
                    {progressPercent === 100 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-semibold">
                            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" /> Completed
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-4">
                    {activeItem === null ? (
                        /* Course Overview Screen */
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {course.thumbnail && (
                                <div className="relative h-44 sm:h-64 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                                    <Image
                                        src={course.thumbnail}
                                        alt={course.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 right-3 sm:right-4 flex items-center justify-between text-white">
                                        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium bg-black/40 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-white/10">
                                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                            <span>{course.instructor?.username || 'Instructor'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 sm:space-y-4">
                                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {course.title}
                                </h2>

                                {/* Progress Box */}
                                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <span className="flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                            Course Progress
                                        </span>
                                        <span className="text-primary font-bold">{progressPercent}%</span>
                                    </div>
                                    <div className="w-full h-2 sm:h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                        {completedLessonsCount} of {totalLessons} lessons completed
                                    </p>
                                </div>
                            </div>

                            {/* Info Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                                <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-2.5 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">Lessons</span>
                                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate block">
                                            {totalLessons} Modules
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-2.5 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                                        <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">Quizzes</span>
                                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate block">
                                            {course.quizzes?.length || 0} Quizzes
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-2.5 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
                                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">Pacing</span>
                                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate block">
                                            {course.duration || 'Self-paced'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-2.5 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 bg-purple-500/10 text-purple-500 rounded-lg shrink-0">
                                        <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">Certificate</span>
                                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate block">
                                            Included
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {course.description && (
                                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4 sm:pt-5">
                                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                        Course Overview
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                        {course.description}
                                    </p>
                                </div>
                            )}

                            {timelineItems.length > 0 && (
                                <div className="pt-2">
                                    <button
                                        onClick={() => setActiveItem(timelineItems[0])}
                                        className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>{progressPercent > 0 ? 'Continue Learning' : 'Start Learning'}</span>
                                        <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : activeItem.type === 'lesson' ? (
                        /* Lesson Player Screen */
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm">
                            <VideoPlayer
                                url={activeItem.data.videoUrl}
                                title={activeItem.data.title}
                                content={activeItem.data.content}
                            />

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                                    {activeItem.data.title}
                                </h2>

                                <button
                                    onClick={() => handleToggleComplete(activeItem.data)}
                                    disabled={isUpdating || isLessonCompleted(activeItem.data)}
                                    className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm shrink-0 ${isLessonCompleted(activeItem.data)
                                        ? 'bg-emerald-500 text-white cursor-not-allowed opacity-95'
                                        : 'bg-primary hover:bg-primary-hover text-white'
                                        }`}
                                >
                                    {isUpdating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isLessonCompleted(activeItem.data) ? (
                                        <>
                                            <Check className="w-4 h-4" strokeWidth={3} /> Completed
                                        </>
                                    ) : (
                                        <>
                                            <Circle className="w-4 h-4" /> Mark as Complete
                                        </>
                                    )}
                                </button>
                            </div>

                            {activeItem.data.content && (
                                <div className="pt-2 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed space-y-2 sm:space-y-3">
                                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Lesson Content
                                    </h3>
                                    <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                        <p className="whitespace-pre-line">{activeItem.data.content}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Quiz Screen */
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 text-center space-y-4 sm:space-y-6 shadow-sm">
                            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <HelpCircle className="w-7 h-7 sm:w-9 sm:h-9" />
                            </div>

                            <div className="space-y-2 max-w-md mx-auto">
                                <span className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider">
                                    Knowledge Quiz
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                    {activeItem.data.title || 'Knowledge Assessment'}
                                </h2>
                                {activeItem.data.description && (
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                        {activeItem.data.description}
                                    </p>
                                )}
                            </div>

                            <div className="pt-2">
                                <Link
                                    href={`/dashboard/quizzes/${activeItem.data.documentId || activeItem.data.id}`}
                                    className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm transition-all shadow-md"
                                >
                                    Start Quiz Now
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Navigation */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-sm">
                    {/* Header + Mini Progress */}
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
                                <BookOpen className="w-4 h-4 sm:w-4 sm:h-4 text-primary" /> Course Syllabus
                            </h3>
                            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {timelineItems.length} Items
                            </span>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span>Progress</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{progressPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5 max-h-[500px] sm:max-h-[600px] overflow-y-auto pr-1">
                        {/* Course Overview Option */}
                        <button
                            onClick={() => setActiveItem(null)}
                            className={`w-full text-left p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs sm:text-sm transition-all ${activeItem === null
                                ? 'border-primary bg-primary/10 font-semibold text-primary dark:bg-primary/20'
                                : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <div className="flex items-center gap-2 sm:gap-2.5 truncate">
                                <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeItem === null ? 'text-primary' : 'text-slate-400'}`} />
                                <span className="truncate">Course Overview</span>
                            </div>
                        </button>

                        {/* Lessons & Quizzes Timeline */}
                        {timelineItems.map((item, idx) => {
                            const isSelected =
                                activeItem !== null &&
                                activeItem.type === item.type &&
                                activeItem.data.id === item.data.id;

                            if (item.type === 'lesson') {
                                const completed = isLessonCompleted(item.data);
                                return (
                                    <button
                                        key={`lesson-${item.data.documentId || item.data.id}`}
                                        onClick={() => setActiveItem(item)}
                                        className={`w-full text-left p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs sm:text-sm transition-all ${isSelected
                                            ? 'border-primary bg-primary/10 font-semibold text-primary dark:bg-primary/20'
                                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 sm:gap-2.5 truncate">
                                            <span className="text-slate-400 font-mono text-[10px] sm:text-xs w-4 shrink-0">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <PlayCircle className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                                            <span className="truncate">{item.data.title}</span>
                                        </div>

                                        {completed ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        ) : (
                                            <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                                        )}
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={`quiz-${item.data.documentId || item.data.id}`}
                                    onClick={() => setActiveItem(item)}
                                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs sm:text-sm transition-all ${isSelected
                                        ? 'border-primary bg-primary/10 font-semibold text-primary dark:bg-primary/20'
                                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 sm:gap-2.5 truncate">
                                        <span className="text-slate-400 font-mono text-[10px] sm:text-xs w-4 shrink-0">
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="truncate">{item.data.title || 'Quiz'}</span>
                                    </div>

                                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
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