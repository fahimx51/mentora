'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ToggleMode from './toggle-mode';
import Logo from '../shared/Logo';
import { useAuth } from '@/context/auth-context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout, isLoading } = useAuth();

    type NavItem = {
        href: string;
        label: string;
    };

    const links: NavItem[] = [
        { href: '/', label: 'Home' },
        { href: '/courses', label: 'Courses' },
        { href: '/blogs', label: 'Blogs' },
        { href: '/dashboard', label: 'Dashboard' },
    ];

    function isNavLinkActive(href: string): boolean {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 dark:border-gray-800/80 bg-white/75 dark:bg-slate-950/75 backdrop-blur-md transition-colors duration-200">
            <div className="navbar max-w-7xl mx-auto px-4 sm:px-6">

                {/* Navbar Start: Mobile Dropdown & Logo */}
                <div className="navbar-start">
                    <div className="dropdown">
                        <button
                            tabIndex={0}
                            className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none border-none outline-none lg:hidden mr-2 transition-colors"
                            aria-label="Open Navigation Menu"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h7"
                                />
                            </svg>
                        </button>

                        {/* Dropdown Panel */}
                        <ul
                            tabIndex={0}
                            className="dropdown-content mt-3 z-[1] p-3 shadow-2xl bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 rounded-2xl w-56 border-none outline-none flex flex-col gap-1"
                        >
                            {links.map(({ href, label }) => {
                                const active = isNavLinkActive(href);
                                return (
                                    <li key={href}>
                                        <Link
                                            href={href}
                                            className={`block px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                                ? 'bg-primary-light text-primary font-semibold'
                                                : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300'
                                                }`}
                                        >
                                            {label}
                                        </Link>
                                    </li>
                                );
                            })}

                            {/* Mobile Auth Button */}
                            <div className="pt-2 mt-1 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-2 sm:hidden">
                                {isLoading ? (
                                    <div className="w-full flex items-center justify-center py-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    </div>
                                ) : user ? (
                                    <button
                                        onClick={logout}
                                        className="px-4 py-2 text-sm font-medium rounded-full text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200/60 dark:border-red-800/40 transition-all duration-200 hover:shadow-xs active:scale-95"
                                    >
                                        Logout
                                    </button>
                                ) : (
                                    <Link
                                        href="/register"
                                        className="w-full text-center px-4 py-2 text-sm font-medium rounded-xl bg-primary hover:bg-primary-hover text-white shadow-xs transition-all duration-200"
                                    >
                                        Get Started
                                    </Link>
                                )}
                            </div>
                        </ul>
                    </div>

                    <Logo />
                </div>

                {/* Navbar Center: Navigation */}
                <div className="navbar-center hidden lg:flex">
                    <nav className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-slate-900/80 border border-gray-200/50 dark:border-slate-800/50 rounded-full">
                        {links.map(({ href, label }) => {
                            const active = isNavLinkActive(href);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${active
                                        ? 'bg-white dark:bg-slate-800 text-primary shadow-xs font-semibold'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Navbar End: Theme Switcher & Auth */}
                <div className="navbar-end gap-2.5">
                    <ToggleMode />

                    <div className="hidden sm:flex items-center gap-2">
                        {isLoading ? (
                            <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            </div>
                        ) : user ? (
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm font-medium rounded-full text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200/60 dark:border-red-800/40 transition-all duration-200 hover:shadow-xs active:scale-95"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link
                                href="/register"
                                className="px-4 py-2 text-sm font-medium rounded-full bg-primary hover:bg-primary-hover text-white shadow-xs transition-all duration-200 hover:shadow-md active:scale-95"
                            >
                                Get Started
                            </Link>
                        )}
                    </div>
                </div>

            </div>
        </header>
    );
}