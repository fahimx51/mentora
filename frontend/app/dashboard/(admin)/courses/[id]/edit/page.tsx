'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, AlertTriangle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';

interface Instructor {
    id: number;
    username: string;
    email: string;
}

export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params?.id as string;
    const { user: currentUser } = useAuth();

    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedInstructor, setSelectedInstructor] = useState<string>('');
    const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
    const [realTargetId, setRealTargetId] = useState<string>('');

    // Dynamic Data & Status
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [isLoadingInstructors, setIsLoadingInstructors] = useState(true);
    const [isLoadingCourse, setIsLoadingCourse] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchInstructors();
    }, []);

    useEffect(() => {
        if (courseId) {
            fetchCourseDetails();
        }
    }, [courseId]);

    // Fetch Instructors list for dropdown
    const fetchInstructors = async () => {
        try {
            setIsLoadingInstructors(true);
            const res = await api.get('/users?populate=role');
            const usersList: any[] = res.data || [];

            const filtered = usersList.filter((u) =>
                u.role?.name?.toLowerCase().includes('instractor') ||
                u.role?.name?.toLowerCase().includes('instructor')
            );

            setInstructors(filtered.length > 0 ? filtered : usersList);
        } catch (err: any) {
            console.error('Failed to load instructors:', err);
        } finally {
            setIsLoadingInstructors(false);
        }
    };

    // Fetch Course Details
    const fetchCourseDetails = async () => {
        try {
            setIsLoadingCourse(true);
            setError('');

            const res = await api.get(`/courses/${courseId}?populate=*`);
            const courseData = res.data?.data || res.data;
            const attributes = courseData?.attributes || courseData;

            // Save documentId for PUT request (Strapi v5 priority) or fallback to ID
            setRealTargetId(courseData?.documentId || courseData?.id || courseId);

            setTitle(attributes?.title || '');
            setDescription(attributes?.description || '');

            // Instructor extraction
            const instructorObj = attributes?.instructor?.data || attributes?.instructor;
            if (instructorObj?.id) {
                setSelectedInstructor(String(instructorObj.id));
            }

            // Thumbnail extraction (URL string or legacy object URL)
            const thumbVal = attributes?.thumbnail;
            if (typeof thumbVal === 'string') {
                setThumbnailUrl(thumbVal);
            } else if (thumbVal?.data?.attributes?.url || thumbVal?.url) {
                const rawUrl = thumbVal?.data?.attributes?.url || thumbVal?.url;
                const fullUrl = rawUrl.startsWith('http')
                    ? rawUrl
                    : `${process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337'}${rawUrl}`;
                setThumbnailUrl(fullUrl);
            }
        } catch (err: any) {
            console.error('Failed to fetch course details:', err);
            setError('Failed to load course details. Please check if the course exists.');
        } finally {
            setIsLoadingCourse(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!title.trim() || !description.trim() || !thumbnailUrl.trim()) {
            setError('Please fill out all required fields, including the thumbnail URL.');
            return;
        }

        try {
            setIsSubmitting(true);

            const token = localStorage.getItem('token') || localStorage.getItem('jwt');
            const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

            // Selected instructor or fallback
            const finalInstructorId = selectedInstructor
                ? Number(selectedInstructor)
                : (currentUser?.id ?? null);

            // Update course payload with direct thumbnail URL text string
            const coursePayload = {
                data: {
                    title: title.trim(),
                    description: description.trim(),
                    thumbnail: thumbnailUrl.trim(),
                    instructor: finalInstructorId,
                },
            };

            const updateEndpointId = realTargetId || courseId;
            await api.put(`/courses/${updateEndpointId}`, coursePayload, {
                headers: {
                    ...authHeader,
                },
            });

            setSuccessMsg('Course updated successfully!');
            setTimeout(() => {
                router.push(`/dashboard/courses/${courseId}`);
            }, 1500);
        } catch (err: any) {
            console.error('Failed to update course:', err);
            const status = err.response?.status;
            if (status === 403) {
                setError('Permission denied (403). Check your permissions in Strapi Settings -> Roles.');
            } else {
                setError(err.response?.data?.error?.message || 'Failed to update course. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Top Header */}
            <div>
                <Link
                    href={`/dashboard/courses/${courseId}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Details
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Course</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Update course details, instructor, and thumbnail URL.
                </p>
            </div>

            {/* Notification Alerts */}
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

            {/* Loading Skeleton */}
            {isLoadingCourse ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 animate-pulse">
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-28 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    </div>
                </div>
            ) : (
                /* Edit Course Form */
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">

                    {/* Course Title */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Course Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Master Next.js & Full-Stack Development"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    {/* Course Description */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={5}
                            required
                            placeholder="Provide a detailed overview of what students will learn..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                        />
                    </div>

                    {/* Instructor Dropdown */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Assign Instructor
                        </label>
                        {isLoadingInstructors ? (
                            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                                <Loader2 size={14} className="animate-spin text-primary" /> Loading instructors...
                            </div>
                        ) : (
                            <select
                                value={selectedInstructor}
                                onChange={(e) => setSelectedInstructor(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                <option value="">Default (Logged-in User)</option>
                                {instructors.map((inst) => (
                                    <option key={inst.id} value={inst.id}>
                                        {inst.username} ({inst.email})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Thumbnail URL Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Course Thumbnail URL <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="url"
                                required
                                placeholder="https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
                                value={thumbnailUrl}
                                onChange={(e) => setThumbnailUrl(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            <ImageIcon size={18} className="absolute left-3 top-3 text-slate-400" />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                        <Link
                            href="/dashboard/courses"
                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Saving Changes...
                                </>
                            ) : (
                                <>
                                    <Save size={16} /> Update Course
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}