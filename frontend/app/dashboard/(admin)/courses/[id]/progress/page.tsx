'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Users,
    Loader2,
    AlertCircle,
    CheckCircle2,
    BookOpen,
    Search,
    UserCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

interface StudentProgress {
    id: string;
    name: string;
    email: string;
    completedLessonsCount: number;
    totalLessonsCount: number;
    progressPercentage: number;
    isCompleted: boolean;
}

interface CourseInfo {
    title: string;
    totalLessons: number;
}

export default function CourseProgressPage() {
    const params = useParams();
    const courseId = params?.id as string;

    const [course, setCourse] = useState<CourseInfo | null>(null);
    const [students, setStudents] = useState<StudentProgress[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const fetchProgressData = async () => {
        if (!courseId) return;

        try {
            setLoading(true);
            setError('');

            // 1. Fetch Course details & lessons (Published)
            const isNumeric = /^\d+$/.test(courseId);
            const courseEndpoint = isNumeric
                ? `/courses?filters[id][$eq]=${courseId}&populate[0]=lessons`
                : `/courses/${courseId}?populate[0]=lessons`;

            const courseRes = await api.get(courseEndpoint);
            const rawCourse = courseRes?.data?.data || courseRes?.data;
            const courseData = Array.isArray(rawCourse) ? rawCourse[0] : rawCourse;

            if (!courseData) {
                setError('Course not found.');
                return;
            }

            const courseAttrs = courseData.attributes || courseData;
            const courseLessons = courseAttrs.lessons?.data || courseAttrs.lessons || [];

            const courseDocId = courseData.documentId || courseAttrs.documentId;
            const courseNumId = courseData.id || courseAttrs.id;

            const courseLessonIds = new Set<string>();
            courseLessons.forEach((l: any) => {
                const docId = l.documentId || l.attributes?.documentId;
                const numId = l.id || l.attributes?.id;
                if (docId) courseLessonIds.add(String(docId));
                if (numId) courseLessonIds.add(String(numId));
            });

            const totalLessonsCount = courseLessons.length;

            setCourse({
                title: courseAttrs.title || 'Course Progress',
                totalLessons: totalLessonsCount,
            });

            // 2. Fetch Enrollments (Published)
            const enrolledStudentsMap = new Map<
                string,
                { id: string; name: string; email: string }
            >();

            try {
                const enrollmentsRes = await api.get(
                    `/enrollments?populate[0]=student&populate[1]=course&pagination[pageSize]=1000`
                );
                const rawEnrollments = enrollmentsRes?.data?.data || enrollmentsRes?.data || [];

                rawEnrollments.forEach((enrollment: any) => {
                    const eAttrs = enrollment.attributes || enrollment;
                    const courseObj = eAttrs.course?.data || eAttrs.course;
                    const userData = eAttrs.student?.data || eAttrs.student;

                    // Skip if no student is assigned
                    if (!userData) return;

                    let matchesCourse = true;
                    if (courseObj) {
                        const cDocId = courseObj.documentId || courseObj.attributes?.documentId;
                        const cNumId = String(courseObj.id || courseObj.attributes?.id || '');

                        matchesCourse =
                            (courseDocId && cDocId === courseDocId) ||
                            (courseNumId && cNumId === String(courseNumId)) ||
                            cDocId === courseId ||
                            cNumId === courseId;
                    }

                    if (matchesCourse) {
                        const uAttrs = userData.attributes || userData;
                        const userKey = String(
                            userData.documentId || uAttrs.documentId || userData.id || uAttrs.id
                        );

                        enrolledStudentsMap.set(userKey, {
                            id: userKey,
                            name: uAttrs.username || uAttrs.name || uAttrs.email?.split('@')[0] || 'Student',
                            email: uAttrs.email || 'No email',
                        });
                    }
                });
            } catch (eErr) {
                console.warn('Could not fetch course enrollments:', eErr);
            }

            // 3. Fetch Lesson Progress records (Published)
            let progressList: any[] = [];
            try {
                const progressRes = await api.get(
                    '/lesson-progresses?populate[0]=student&populate[1]=lesson&pagination[pageSize]=1000'
                );
                progressList = progressRes?.data?.data || progressRes?.data || [];
            } catch (pErr) {
                console.warn('Could not fetch lesson progress records:', pErr);
            }

            const completedCountMap = new Map<string, Set<string>>();

            progressList.forEach((item: any) => {
                const pAttrs = item.attributes || item;
                const isCompleted = pAttrs.isCompleted ?? true;

                if (!isCompleted) return;

                const userData = pAttrs.student?.data || pAttrs.student;
                const lessonData = pAttrs.lesson?.data || pAttrs.lesson;

                if (!userData || !lessonData) return;

                const userKey = String(
                    userData.documentId || userData.attributes?.documentId || userData.id || userData.attributes?.id
                );

                const lessonKey = String(
                    lessonData.documentId || lessonData.attributes?.documentId || lessonData.id || lessonData.attributes?.id
                );

                if (courseLessonIds.has(lessonKey)) {
                    if (!completedCountMap.has(userKey)) {
                        completedCountMap.set(userKey, new Set());
                    }
                    completedCountMap.get(userKey)!.add(lessonKey);
                }
            });

            // 4. Formatted student progress list
            const formattedStudents: StudentProgress[] = Array.from(
                enrolledStudentsMap.values()
            ).map((student) => {
                const completedSet = completedCountMap.get(student.id);
                const completedCount = completedSet ? completedSet.size : 0;
                const percentage =
                    totalLessonsCount > 0
                        ? Math.round((completedCount / totalLessonsCount) * 100)
                        : 0;

                return {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    completedLessonsCount: completedCount,
                    totalLessonsCount: totalLessonsCount,
                    progressPercentage: Math.min(percentage, 100),
                    isCompleted: percentage >= 100 && totalLessonsCount > 0,
                };
            });

            setStudents(formattedStudents);
        } catch (err: any) {
            console.error('Failed to fetch progress:', err);
            setError('Failed to load student progress.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgressData();
    }, [courseId]);

    const filteredStudents = students.filter(
        (student) =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 px-4">
                <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-primary" />
                <p className="text-xs sm:text-sm md:text-base text-slate-500 font-medium">
                    Loading student progress...
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <Link
                    href={`/dashboard/courses/${courseId}`}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-medium"
                >
                    <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> Back to Course
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>Student Progress</span>
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            <span>{course?.title}</span> • <span>{course?.totalLessons || 0} Total Lessons</span>
                        </p>
                    </div>

                    <div className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold self-start sm:self-auto flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        <span>{students.length} Enrolled Students</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs sm:text-sm md:text-base flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8 space-y-5 shadow-sm">
                <div className="relative max-w-md">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search student by name or email..."
                        className="w-full pl-10 sm:pl-11 pr-4 py-2.5 text-xs sm:text-sm md:text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                {filteredStudents.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-wider">
                                    <th className="py-3.5 px-4 sm:px-6">Student</th>
                                    <th className="py-3.5 px-4 sm:px-6">Completed Lessons</th>
                                    <th className="py-3.5 px-4 sm:px-6">Progress</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm md:text-base">
                                {filteredStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <td className="py-3.5 px-4 sm:px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 uppercase text-xs sm:text-sm">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                        {student.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {student.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-700 dark:text-slate-300">
                                            {student.completedLessonsCount} / {student.totalLessonsCount}
                                        </td>

                                        <td className="py-3.5 px-4 sm:px-6 min-w-[180px]">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs font-semibold">
                                                    <span className="text-slate-600 dark:text-slate-400">
                                                        {student.progressPercentage}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 rounded-full ${student.isCompleted
                                                            ? 'bg-emerald-500'
                                                            : 'bg-primary'
                                                            }`}
                                                        style={{ width: `${student.progressPercentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4 sm:px-6 text-right">
                                            {student.isCompleted ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/40">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-800/40">
                                                    In Progress
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10 space-y-2">
                        <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="text-sm md:text-base text-slate-500 font-medium">
                            No enrolled students found for this course.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}