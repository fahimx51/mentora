'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, AlertTriangle } from 'lucide-react';
import { getCoursesApi, deleteCourseApi } from '@/lib/api';
import CourseCard, { Course } from '@/components/course/CourseCard';
import CourseCardSkeleton from '@/components/course/CourseCardSkeleton';

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setIsLoading(true);
            setError('');
            const res = await getCoursesApi();

            // Support both Strapi v4/v5 response structures
            const courseList = Array.isArray(res) ? res : res.data || [];
            setCourses(courseList);
        } catch (err: any) {
            console.error('Failed to load courses:', err);
            setError('Failed to fetch courses. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCourse = async (id: string | number) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this course from the database?');
        if (!confirmDelete) return;

        const previousCourses = [...courses];
        setCourses((prev) => prev.filter((course) => (course.documentId || course.id) !== id));

        try {
            await deleteCourseApi(id);
        } catch (err: any) {
            console.error('Failed to delete course from database:', err);
            alert('Failed to delete course. Please try again.');
            setCourses(previousCourses);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Course Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage, edit, or delete courses for your platform.
                    </p>
                </div>
                <Link
                    href="/dashboard/courses/create"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-xl shadow-sm transition-all shrink-0"
                >
                    <Plus size={18} />
                    Create New Course
                </Link>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs sm:text-sm text-red-600 font-medium flex items-center gap-3">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State with Skeleton */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CourseCardSkeleton count={6} />
                </div>
            ) : courses.length === 0 ? (
                /* Empty State */
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <BookOpen size={24} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No courses found</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                        You haven't added any courses yet. Start by creating one!
                    </p>
                    <Link
                        href="/dashboard/courses/create"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
                    >
                        <Plus size={16} /> Create Course
                    </Link>
                </div>
            ) : (
                /* Admin Courses Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <CourseCard
                            key={course.id || course.documentId}
                            course={course}
                            isDashboard={true}
                            onDelete={() => handleDeleteCourse(course.documentId || course.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}