'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, PlayCircle, Loader2, User as UserIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';

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
    thumbnail?: string;
    instructor?: Instructor;
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
                setError('');

                const response = await api.get('/enrollments', {
                    params: {
                        'filters[student][id][$eq]': user.id,
                        'populate[course][populate][instructor]': true,
                    },
                });

                const rawList = Array.isArray(response?.data?.data)
                    ? response.data.data
                    : [];

                const extractedCourses: Course[] = rawList
                    .map((item: any) => {
                        const courseData = item.course;
                        if (!courseData) return null;

                        return {
                            id: courseData.id,
                            documentId: courseData.documentId || String(courseData.id),
                            title: courseData.title || 'Untitled Course',
                            description: courseData.description,
                            thumbnail: courseData.thumbnail || null,
                            instructor: courseData.instructor,
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
                    Continue where you left off.
                </p>
            </div>

            {courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                    <BookOpen className="h-12 w-12 text-slate-400 mb-3" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Enrolled Courses</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5">
                        You haven&apos;t enrolled in any courses yet. Start your learning journey today!
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
                        const rawUrl = course.thumbnail;
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

                                    {course.instructor && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <UserIcon size={14} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{course.instructor.username}</span>
                                        </div>
                                    )}

                                    <Link
                                        href={`/dashboard/my-courses/${course.documentId || course.id}`}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-sm shadow-md shadow-primary/20 transition-all duration-200"
                                    >
                                        <PlayCircle size={18} />
                                        <span>Continue Learning</span>
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