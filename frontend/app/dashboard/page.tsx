'use client';

import { useAuth } from "@/context/auth-context/AuthContext";
import Link from "next/link";
import {
    Users,
    BookOpen,
    GraduationCap,
    Newspaper,
    TrendingUp,
    Clock,
    PlusCircle,
    Award,
    CheckCircle2,
    Video,
    HelpCircle,
    Calendar,
    Bell,
    AlertCircle,
    ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading your dashboard...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                    Please log in to view your dashboard.
                </p>
                <Link
                    href="/login"
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium shadow-md transition-all duration-200"
                >
                    Go to Login
                </Link>
            </div>
        );
    }

    const roleName = user.role?.name ?? "Student";

    const getStats = () => {
        switch (roleName) {
            case "Admin":
                return [
                    { label: "Total Users", value: "1,248", icon: Users, change: "+12% this month", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/50" },
                    { label: "Active Courses", value: "48", icon: BookOpen, change: "+4 new added", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50" },
                    { label: "Published Blogs", value: "86", icon: Newspaper, change: "+8 this week", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50" },
                    { label: "Platform Growth", value: "94.2%", icon: TrendingUp, change: "+3.4% overall", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/50" },
                ];
            case "Instructor":
                return [
                    { label: "My Courses", value: "6", icon: GraduationCap, change: "2 active now", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50" },
                    { label: "Total Enrolled Students", value: "412", icon: Users, change: "+24 this week", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/50" },
                    { label: "Total Lessons", value: "54", icon: Video, change: "All up to date", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50" },
                    { label: "Avg. Completion Rate", value: "88%", icon: Award, change: "+2.1% rating", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/50" },
                ];
            case "Content-Manager":
                return [
                    { label: "Manage Courses", value: "48", icon: BookOpen, change: "3 in draft", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50" },
                    { label: "Published Quizzes", value: "120", icon: HelpCircle, change: "+15 new", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/50" },
                    { label: "Video Lessons", value: "310", icon: Video, change: "+12 uploaded", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/50" },
                    { label: "Blog Articles", value: "86", icon: Newspaper, change: "+5 pending", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50" },
                ];
            default:
                return [
                    { label: "Enrolled Courses", value: "4", icon: BookOpen, change: "2 in progress", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50" },
                    { label: "Completed Lessons", value: "28", icon: CheckCircle2, change: "+6 this week", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50" },
                    { label: "Quizzes Taken", value: "12", icon: HelpCircle, change: "85% avg score", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/50" },
                    { label: "Hours Learned", value: "34.5 hrs", icon: Clock, change: "+4.2 hrs today", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/50" },
                ];
        }
    };

    const stats = getStats();

    // Schedule / Announcements static items
    const scheduleItems = [
        {
            title: "Next.js 15 App Router Quiz",
            type: "Quiz Deadline",
            time: "Tomorrow at 11:59 PM",
            priority: "High",
            badgeColor: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/60",
        },
        {
            title: "Live Q&A: Fullstack Auth Best Practices",
            type: "Live Event",
            time: "Friday, Aug 29 • 6:00 PM",
            priority: "Upcoming",
            badgeColor: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60",
        },
        {
            title: "Database Optimization Module Review",
            type: "New Content",
            time: "Sunday, Aug 31",
            priority: "Normal",
            badgeColor: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                <div className="max-w-2xl space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-primary text-white">
                        {roleName} Dashboard
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Welcome back, {user.username}!
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                        Here is your daily activity overview, schedule, and quick shortcuts.
                    </p>
                </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={idx}
                            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {stat.label}
                                </span>
                                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                                    {stat.value}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                    {stat.change}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Schedule & Announcements + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Upcoming Events & Deadlines */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                <span>Upcoming Deadlines & Schedule</span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Tasks and events that require your attention</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                            3 Items Pending
                        </span>
                    </div>

                    <div className="space-y-4">
                        {scheduleItems.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 gap-3"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.badgeColor}`}>
                                            {item.type}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">{item.time}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-1">
                                        {item.title}
                                    </h4>
                                </div>

                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-start sm:self-auto"
                                >
                                    <span>Action</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* System Announcement Notice Box */}
                    <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 flex gap-3.5 items-start">
                        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs text-blue-900 dark:text-blue-200">
                            <p className="font-bold">System Maintenance Scheduled</p>
                            <p className="text-blue-700 dark:text-blue-300">
                                Platform updates will take place this Sunday from 2:00 AM to 4:00 AM UTC. Some features may be temporarily limited.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Shortcuts Panel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Actions</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Shortcuts for common tasks</p>
                    </div>

                    <div className="space-y-3">
                        {roleName === "Admin" || roleName === "Content-Manager" || roleName === "Instructor" ? (
                            <>
                                <Link
                                    href="/dashboard/courses/create"
                                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                                >
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <PlusCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Create Course</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Add a new course curriculum</p>
                                    </div>
                                </Link>

                                <Link
                                    href="/dashboard/lessons/create"
                                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                                >
                                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <Video className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Upload Lesson</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Add video/text content</p>
                                    </div>
                                </Link>

                                <Link
                                    href="/dashboard/quizzes/create"
                                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                                >
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                        <HelpCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Create Quiz</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Add interactive assessments</p>
                                    </div>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/dashboard/my-courses"
                                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                                >
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <GraduationCap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Continue Learning</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Jump back into your courses</p>
                                    </div>
                                </Link>

                                <Link
                                    href="/dashboard/quiz-results"
                                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                                >
                                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        <Award className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Quiz Results</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Review your test scores</p>
                                    </div>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}