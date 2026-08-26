import React from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export default function Logo() {
    return (
        <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none"
            aria-label="Mentora Home"
        >
            {/* Icon Badge using global CSS variables */}
            <div className="p-2.5 rounded-xl bg-primary-light text-primary group-hover:bg-primary-hover group-hover:text-white transition-all duration-300 shadow-sm">
                <GraduationCap className="h-6 w-6" />
            </div>

            {/* Brand Text */}
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Mentora<span className="text-primary">.</span>
            </span>
        </Link>
    );
}