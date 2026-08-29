'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api'; // Update path if api.ts is located elsewhere
import {
    Users,
    BookOpen,
    Newspaper,
    GraduationCap,
    ShieldCheck,
    FileEdit,
    UserCheck,
    Award,
    TrendingUp,
    BarChart3,
    Video,
    HelpCircle,
    Loader2,
    AlertCircle,
} from 'lucide-react';

interface StatsData {
    totalUsers: number;
    students: number;
    instructors: number;
    contentManagers: number;
    admins: number;
    totalCourses: number;
    totalBlogs: number;
    totalLessons: number;
    totalQuizzes: number;
}

export default function PerformanceStatsPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchAllStats = async () => {
            try {
                setIsLoading(true);

                // Call Strapi endpoints concurrently via Axios instance
                const [usersRes, coursesRes, blogsRes, lessonsRes, quizzesRes] = await Promise.all([
                    api.get('/users?populate=role'),
                    api.get('/courses'),
                    api.get('/blogs'),
                    api.get('/lessons'),
                    api.get('/quizzes'),
                ]);

                if (!isMounted) return;

                // Normalize user collection response
                const usersList: any[] = Array.isArray(usersRes.data) ? usersRes.data : [];

                let studentsCount = 0;
                let instructorsCount = 0;
                let contentManagersCount = 0;
                let adminsCount = 0;

                usersList.forEach((u) => {
                    const roleName = u.role?.name?.toLowerCase() || u.role?.type?.toLowerCase() || '';
                    if (roleName.includes('student')) {
                        studentsCount++;
                    } else if (roleName.includes('instructor') || roleName.includes('teacher')) {
                        instructorsCount++;
                    } else if (roleName.includes('content') || roleName.includes('manager')) {
                        contentManagersCount++;
                    } else if (roleName.includes('admin')) {
                        adminsCount++;
                    }
                });

                // Extract total counts from Strapi pagination meta (or fallback to array length)
                const getCount = (res: any) => {
                    if (res?.data?.meta?.pagination?.total !== undefined) {
                        return res.data.meta.pagination.total;
                    }
                    if (Array.isArray(res?.data?.data)) {
                        return res.data.data.length;
                    }
                    if (Array.isArray(res?.data)) {
                        return res.data.length;
                    }
                    return 0;
                };

                setStats({
                    totalUsers: usersList.length,
                    students: studentsCount,
                    instructors: instructorsCount,
                    contentManagers: contentManagersCount,
                    admins: adminsCount,
                    totalCourses: getCount(coursesRes),
                    totalBlogs: getCount(blogsRes),
                    totalLessons: getCount(lessonsRes),
                    totalQuizzes: getCount(quizzesRes),
                });
            } catch (err: any) {
                if (isMounted) {
                    setError(err?.response?.data?.error?.message || 'Failed to fetch platform stats from Strapi.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchAllStats();

        return () => {
            isMounted = false;
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Loading stats from Strapi backend...
                </p>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    {error || 'Could not fetch platform stats.'}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-primary hover:bg-primary/90 shadow-md transition-all"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const {
        totalUsers = 0,
        students = 0,
        instructors = 0,
        contentManagers = 0,
        admins = 0,
        totalCourses = 0,
        totalBlogs = 0,
        totalLessons = 0,
        totalQuizzes = 0,
    } = stats;

    const userRolesBreakdown = [
        { label: "Students", count: students, icon: GraduationCap, color: "bg-blue-500", textColor: "text-blue-500" },
        { label: "Instructors", count: instructors, icon: UserCheck, color: "bg-indigo-500", textColor: "text-indigo-500" },
        { label: "Content Managers", count: contentManagers, icon: FileEdit, color: "bg-emerald-500", textColor: "text-emerald-500" },
        { label: "Admins", count: admins, icon: ShieldCheck, color: "bg-amber-500", textColor: "text-amber-500" },
    ];

    const contentBreakdown = [
        { label: "Total Courses", count: totalCourses, icon: BookOpen, subtext: "Available courses", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50" },
        { label: "Total Blog Posts", count: totalBlogs, icon: Newspaper, subtext: "Published & Draft articles", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50" },
        { label: "Video Lessons", count: totalLessons, icon: Video, subtext: "Total video contents", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/50" },
        { label: "Total Quizzes", count: totalQuizzes, icon: HelpCircle, subtext: "Interactive assessments", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/50" },
    ];

    const lessonsPerCourse = totalCourses > 0 ? (totalLessons / totalCourses).toFixed(1) : "0";
    const quizzesPerCourse = totalCourses > 0 ? (totalQuizzes / totalCourses).toFixed(1) : "0";
    const studentToInstructorRatio = instructors > 0 ? `${Math.round(students / instructors)} : 1` : "N/A";

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-primary" />
                        Platform Performance Stats
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Live performance metrics loaded directly from your Strapi models.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl shrink-0 self-start sm:self-auto">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span>Live Connection</span>
                </div>
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {contentBreakdown.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={idx}
                            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {item.label}
                                </span>
                                <div className={`p-2.5 rounded-xl ${item.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                                    {item.count.toLocaleString()}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                    {item.subtext}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* User Distribution & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                <span>User Distribution by Role</span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total registered users: {totalUsers.toLocaleString()}</p>
                        </div>
                        <span className="text-xs font-black px-3 py-1 rounded-full bg-primary/10 text-primary">
                            {totalUsers.toLocaleString()} Total Users
                        </span>
                    </div>

                    <div className="space-y-6">
                        {userRolesBreakdown.map((role, idx) => {
                            const Icon = role.icon;
                            const percentage = totalUsers > 0 ? Math.round((role.count / totalUsers) * 100) : 0;

                            return (
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-1.5 rounded-lg ${role.color}/10 ${role.textColor}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span>{role.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-400">{percentage}%</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{role.count.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${role.color}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Calculated Insights</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Dynamic system metrics</p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Student to Instructor Ratio</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{studentToInstructorRatio}</span>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Lessons per Course</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">~{lessonsPerCourse} Avg</span>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Quizzes per Course</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">~{quizzesPerCourse} Avg</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-1">
                        <Award className="w-6 h-6 text-primary mx-auto" />
                        <p className="text-xs font-bold text-primary">Strapi Connected</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Metrics calculated smoothly</p>
                    </div>
                </div>
            </div>
        </div>
    );
}