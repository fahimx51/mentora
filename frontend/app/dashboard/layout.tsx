'use client';

import { useAuth } from "@/context/auth-context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Newspaper,
    BarChart3,
    GraduationCap,
    ClipboardList,
    Home,
    PlusCircle,
    Video,
    HelpCircle,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import ToggleMode from "@/components/header/toggle-mode";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import PrivateRoute from "@/components/route/PrivateRoute";

const NAV_ITEMS: Record<string, { label: string; href: string; icon: React.ElementType }[]> = {
    Admin: [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { label: "Manage Users", href: "/dashboard/users", icon: Users },
        { label: "All Courses", href: "/dashboard/courses", icon: BookOpen },
        { label: "Create Course", href: "/dashboard/courses/create", icon: PlusCircle },
        { label: "Create Lesson", href: "/dashboard/lessons/create", icon: Video },
        { label: "Create Quiz", href: "/dashboard/quizzes/create", icon: HelpCircle },
        { label: "Blog Posts", href: "/dashboard/blog", icon: Newspaper },
        { label: "Platform Stats", href: "/dashboard/stats", icon: BarChart3 },
    ],
    "Content Manager": [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { label: "All Courses", href: "/dashboard/courses", icon: BookOpen },
        { label: "Create Course", href: "/dashboard/courses/create", icon: PlusCircle },
        { label: "Create Lesson", href: "/dashboard/lessons/create", icon: Video },
        { label: "Create Quiz", href: "/dashboard/quizzes/create", icon: HelpCircle },
        { label: "Blog Posts", href: "/dashboard/blog", icon: Newspaper },
    ],
    Instructor: [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { label: "All Courses", href: "/dashboard/courses", icon: BookOpen },
        { label: "Create Course", href: "/dashboard/courses/create", icon: PlusCircle },
        { label: "Create Lesson", href: "/dashboard/lessons/create", icon: Video },
        { label: "Create Quiz", href: "/dashboard/quizzes/create", icon: HelpCircle },
    ],
    Student: [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { label: "My Courses", href: "/dashboard/my-courses", icon: GraduationCap },
        { label: "Quiz Results", href: "/dashboard/quiz-results", icon: ClipboardList },
    ],
};

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    const roleName = user?.role?.name ?? "Student";
    const navItems = NAV_ITEMS[roleName] ?? [];

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
            {/* Fixed Left Sidebar */}
            <aside className="sticky top-0 h-screen w-16 sm:w-20 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col shrink-0 transition-all duration-300">

                {/* Header / Brand */}
                <div className="p-3 sm:p-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 shrink-0">
                    <div className="overflow-hidden">
                        <Logo />
                    </div>
                    <div className="hidden lg:block">
                        <ToggleMode />
                    </div>
                </div>

                {/* User Profile Badge Box */}
                <div className="p-3 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 flex gap-4 justify-center items-center lg:items-start text-center lg:text-left shrink-0">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden lg:block min-w-0 w-full">
                        <p className="font-semibold truncate text-sm text-primary dark:text-white">
                            @{user?.username}
                        </p>
                        <span className="inline-block px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                            {roleName}
                        </span>
                    </div>
                </div>

                {/* Scrollable Navigation Menu */}
                <nav className="flex-1 p-2 sm:p-3 space-y-1 overflow-y-auto min-h-0">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        title={item.label}
                                        className={`flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                            ? "bg-primary text-white shadow-md shadow-primary/20"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                                            }`}
                                    >
                                        <Icon size={20} className="shrink-0" />
                                        <span className="hidden lg:inline truncate">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Bottom Tools */}
                <div className="p-2 sm:p-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col items-center lg:flex-row lg:justify-between gap-2 shrink-0">
                    <Link
                        href="/"
                        title="Back to Home"
                        className="flex items-center justify-center lg:justify-start gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Home size={18} className="shrink-0" />
                        <span className="hidden lg:inline truncate">Main Site</span>
                    </Link>
                    <div className="lg:hidden">
                        <ToggleMode />
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
                <div>
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <PrivateRoute>
            <DashboardContent>{children}</DashboardContent>
        </PrivateRoute>
    );
}