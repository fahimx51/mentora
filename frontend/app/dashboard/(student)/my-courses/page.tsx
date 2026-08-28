'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, PlayCircle, Loader2, User as UserIcon, HelpCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';

interface LessonProgress {
    id: number;
    documentId?: string;
    isCompleted?: boolean;
    student?: {
        id: number;
        documentId?: string;
    } | number | string;
}

interface Lesson {
    id: number;
    documentId: string;
    title?: string;
    lesson_progresses?: LessonProgress[];
}

interface Quiz {
    id: number;
    documentId: string;
    title?: string;
}

interface Instructor {
    id: number;
    username: string;
    email: string;
}

interface Course {
    id: number;
    documentId: string;
    title: string;
    description?: string;
    thumbnail?: {
        url: string;
    };
    instructor?: Instructor;
    lessons?: Lesson[];
    quizzes?: Quiz[];
}

export default function MyCoursesPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchMyCourses = async () => {
            if (!user) return;

            try {
                setIsLoading(true);

                // Fetch enrollments and populate the course + thumbnail
                const response = await api.get('/enrollments', {
                    params: {
                        'populate[course][populate]': 'thumbnail',
                    },
                });

                const rawList = Array.isArray(response?.data?.data)
                    ? response.data.data
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];

                // Extract valid course objects directly from user's enrollments
                const extractedCourses: Course[] = rawList
                    .map((item: any) => {
                        const courseData = item.course || item.attributes?.course?.data || item.attributes?.course;
                        if (!courseData) return null;

                        return {
                            id: courseData.id,
                            documentId: courseData.documentId || courseData.id,
                            title: courseData.title || courseData.attributes?.title || 'Untitled Course',
                            description: courseData.description || courseData.attributes?.description,
                            thumbnail: courseData.thumbnail || courseData.attributes?.thumbnail,
                            instructor: courseData.instructor || courseData.attributes?.instructor,
                            lessons: courseData.lessons || courseData.attributes?.lessons,
                            quizzes: courseData.quizzes || courseData.attributes?.quizzes,
                        };
                    })
                    .filter((course: Course | null): course is Course => Boolean(course));

                setCourses(extractedCourses);
            } catch (err: unknown) {
                console.error('Failed to load enrolled courses:', err);
                setError('Could not load your courses right now.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMyCourses();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading your enrolled courses...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm text-center">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    My Enrolled Courses
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Track your learning and keep making progress.
                </p>
            </div>

            {courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                    <BookOpen className="h-12 w-12 text-slate-400 mb-3" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Enrolled Courses</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5">
                        You haven’t enrolled in any courses yet. Start your learning journey today!
                    </p>
                    <Link
                        href="/courses"
                        className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-sm shadow-md transition-all duration-200"
                    >
                        Browse All Courses
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => {
                        const lessons = course.lessons || [];
                        const totalLessons = lessons.length;
                        const totalQuizzes = course.quizzes?.length || 0;

                        const completedLessons = lessons.filter((lesson) => {
                            const progressList = lesson.lesson_progresses || [];
                            return progressList.some((p) => {
                                if (!p.isCompleted) return false;

                                const studentObj = typeof p.student === 'object' ? p.student : null;
                                const studentId = studentObj?.id || (typeof p.student === 'number' ? p.student : null);
                                const studentDocId = studentObj?.documentId || (typeof p.student === 'string' ? p.student : null);

                                return (
                                    (studentId && String(studentId) === String(user?.id)) ||
                                    (studentDocId && studentDocId === user?.documentId) ||
                                    (!p.student && p.isCompleted)
                                );
                            });
                        }).length;

                        const progressPercent = totalLessons > 0
                            ? Math.round((completedLessons / totalLessons) * 100)
                            : 0;

                        const rawUrl = course.thumbnail?.url;
                        const thumbnailUrl = rawUrl
                            ? rawUrl.startsWith('http')
                                ? rawUrl
                                : `${process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337'}${rawUrl}`
                            : null;

                        return (
                            <div
                                key={course.documentId || course.id}
                                className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-200"
                            >
                                <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                                    {thumbnailUrl ? (
                                        <Image
                                            src={thumbnailUrl}
                                            alt={course.title}
                                            fill
                                            unoptimized
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <BookOpen className="h-12 w-12 text-slate-400" />
                                    )}

                                    {progressPercent === 100 && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow">
                                            <CheckCircle2 size={13} />
                                            <span>Completed</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                                            {course.title}
                                        </h2>
                                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {course.description || 'No course description available.'}
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                                            <span>Progress ({completedLessons}/{totalLessons})</span>
                                            <span>{progressPercent}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-400 transition-all duration-300 rounded-full"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                                        {course.instructor && (
                                            <div className="flex items-center gap-2">
                                                <UserIcon size={14} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{course.instructor.username}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <BookOpen size={14} />
                                                <span>{totalLessons} {totalLessons === 1 ? 'Lesson' : 'Lessons'}</span>
                                            </div>
                                            {totalQuizzes > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    <HelpCircle size={14} />
                                                    <span>{totalQuizzes} {totalQuizzes === 1 ? 'Quiz' : 'Quizzes'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Link
                                        href={`/dashboard/my-courses/${course.documentId || course.id}`}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-sm shadow-md shadow-primary/20 transition-all duration-200"
                                    >
                                        <PlayCircle size={18} />
                                        <span>{progressPercent > 0 ? 'Continue Learning' : 'Start Learning'}</span>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}