'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/header/Navbar';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';
import {
    Loader2,
    BookOpen,
    User,
    AlertTriangle,
    CheckCircle2,
    FileText,
    HelpCircle,
    Clock,
    Award,
    ArrowRight
} from 'lucide-react';

interface Course {
    id: number;
    documentId?: string;
    title: string;
    description: string;
    instructor?: {
        id?: number;
        username?: string;
        email?: string;
    };
    thumbnail?: string; // String URL for text field
    lessonsCount?: number;
    quizzesCount?: number;
    duration?: string;
}

export default function CourseDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params?.id as string;
    const { user } = useAuth();

    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (courseId) {
            fetchCourseDetails();
        }
    }, [courseId]);

    useEffect(() => {
        if (user && course) {
            checkUserEnrollment();
        }
    }, [user, course]);

    const fetchCourseDetails = async () => {
        try {
            setIsLoading(true);
            setError('');

            let courseData: any = null;
            const isNumericId = /^\d+$/.test(courseId);

            // Populate relational fields only (lessons, quizzes, instructor)
            // Removed populate[3]=thumbnail because thumbnail is a text field
            const populateQuery = 'populate[0]=lessons&populate[1]=quizzes&populate[2]=instructor';

            if (isNumericId) {
                const res = await api.get(`/courses?filters[id][$eq]=${courseId}&${populateQuery}`);
                const items = res.data?.data || res.data || [];
                if (items.length > 0) {
                    courseData = items[0];
                } else {
                    throw new Error('Course not found');
                }
            } else {
                const res = await api.get(`/courses/${courseId}?${populateQuery}`);
                courseData = res.data?.data || res.data;
            }

            const attributes = courseData?.attributes || courseData;

            const lessonsData = attributes?.lessons?.data || attributes?.lessons || [];
            const quizzesData = attributes?.quizzes?.data || attributes?.quizzes || [];

            // Safely parse string URL or object fallback
            const rawThumbnail = attributes?.thumbnail;
            const parsedThumbnail = typeof rawThumbnail === 'string'
                ? rawThumbnail
                : rawThumbnail?.data?.attributes?.url || rawThumbnail?.url || '';

            setCourse({
                id: courseData?.id,
                documentId: courseData?.documentId,
                title: attributes?.title || '',
                description: attributes?.description || '',
                instructor: attributes?.instructor?.data?.attributes || attributes?.instructor || attributes?.instructor?.data,
                thumbnail: parsedThumbnail,
                lessonsCount: Array.isArray(lessonsData) ? lessonsData.length : 0,
                quizzesCount: Array.isArray(quizzesData) ? quizzesData.length : 0,
                duration: attributes?.duration || 'Self-paced',
            });
        } catch (err: any) {
            console.error('Failed to fetch course:', err);
            setError('Could not load course details. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };


    const checkUserEnrollment = async () => {
        try {
            const courseDocId = course?.documentId || course?.id;
            if (!courseDocId) return;

            // No student filter needed here; backend attaches it automatically
            const res = await api.get('/enrollments', {
                params: {
                    'filters[course][documentId][$eq]': courseDocId,
                },
            });

            const enrollments = res.data?.data || res.data || [];
            setIsAlreadyEnrolled(enrollments.length > 0);
        } catch (err) {
            console.error('Failed to check enrollment status:', err);
        }
    };

    const handleEnroll = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            setIsEnrolling(true);
            setError('');
            setSuccessMsg('');

            const courseDocId = course?.documentId || course?.id;
            const userId = user?.id;

            await api.post('/enrollments', {
                data: {
                    course: courseDocId,
                    student: userId, // Match schema field 'student' using numeric ID or docId
                },
            });

            setIsAlreadyEnrolled(true);
            setSuccessMsg('Successfully enrolled in this course!');
        } catch (err: any) {
            console.error('Enrollment failed:', err);
            setError(err.response?.data?.error?.message || 'Failed to enroll.');
        } finally {
            setIsEnrolling(false);
        }
    };

    const userRole = user?.role?.name || user?.role?.type || 'Student';

    const hasFullAccess = userRole === "Admin" || userRole === "Content Manager" || isAlreadyEnrolled || userRole === "Instructor";

    const adminPower = userRole === "Content Manager" || userRole === "Admin" || user?.username === course?.instructor?.username;

    const handleGoToCourse = () => {
        const targetId = course?.documentId || courseId;
        if (adminPower) {
            router.push(`/dashboard/courses/${targetId}`)
        }
        else {
            router.push(`/dashboard/my-courses/${targetId}`);

        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {isLoading ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 animate-pulse space-y-6">
                        <div className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                        <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        <div className="grid grid-cols-3 gap-4">
                            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                        </div>
                        <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    </div>
                ) : error && !course ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center text-red-600 font-medium flex items-center justify-center gap-3">
                        <AlertTriangle size={20} />
                        <span>{error}</span>
                    </div>
                ) : course ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                        {course.thumbnail ? (
                            <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="h-48 w-full bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
                                <BookOpen size={48} className="text-primary/40" />
                            </div>
                        )}

                        <div className="p-6 sm:p-8 space-y-8">
                            <div className="space-y-3">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {course.title}
                                </h1>

                                {course.instructor?.username && (
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <User size={16} className="text-primary" />
                                        <span>Instructor: <strong>{course.instructor.username}</strong></span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-400 font-medium block">Lessons</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {course.lessonsCount} Modules
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                                        <HelpCircle size={20} />
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-400 font-medium block">Quizzes</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {course.quizzesCount} Quizzes
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-400 font-medium block">Pacing</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {course.duration}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                                    <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl">
                                        <Award size={20} />
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-400 font-medium block">Certificate</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            Included
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs sm:text-sm text-red-600 font-medium flex items-center gap-3">
                                    <AlertTriangle size={18} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {successMsg && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-3">
                                    <CheckCircle2 size={18} className="shrink-0" />
                                    <span>{successMsg}</span>
                                </div>
                            )}

                            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Course Overview
                                </h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                                    {course.description}
                                </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                                <div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">Access</span>
                                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                                        {hasFullAccess ? 'Unlocked' : 'Free'}
                                    </span>
                                </div>

                                {hasFullAccess ? (
                                    <button
                                        onClick={handleGoToCourse}
                                        className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
                                    >
                                        <span>Go to Course</span>
                                        <ArrowRight size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleEnroll}
                                        disabled={isEnrolling}
                                        className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isEnrolling ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" /> Enrolling...
                                            </>
                                        ) : (
                                            'Enroll Now'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}