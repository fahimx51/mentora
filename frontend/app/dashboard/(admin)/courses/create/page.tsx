'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';

interface Instructor {
    id: number;
    username: string;
    email: string;
}

export default function CreateCoursePage() {
    const router = useRouter();
    const { user: currentUser } = useAuth();

    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedInstructor, setSelectedInstructor] = useState<string>('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    // Dynamic Data & Status
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [isLoadingInstructors, setIsLoadingInstructors] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchInstructors();
    }, []);

    // Fetch Instructors list for dropdown
    const fetchInstructors = async () => {
        try {
            setIsLoadingInstructors(true);
            const res = await api.get('/users?populate=role');
            const usersList: any[] = res.data || [];

            console.log("result => ", usersList);

            const filtered = usersList.filter((u) =>
                u.role?.name?.includes('Instractor')
            );

            console.log("filtered  => ", filtered);

            setInstructors(filtered.length > 0 ? filtered : usersList);
        } catch (err: any) {
            console.error('Failed to load instructors:', err);
        } finally {
            setIsLoadingInstructors(false);
        }
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!title.trim() || !description.trim()) {
            setError('Please fill out all required fields.');
            return;
        }

        try {
            setIsSubmitting(true);
            let thumbnailId: number | null = null;

            // Get token for authenticated Strapi requests
            const token = localStorage.getItem('token') || localStorage.getItem('jwt');
            const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

            // Step 1: Upload Thumbnail file to Strapi if selected
            if (thumbnailFile) {
                const formData = new FormData();
                formData.append('files', thumbnailFile);

                const uploadRes = await api.post('/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        ...authHeader,
                    },
                });

                if (uploadRes.data && uploadRes.data[0]) {
                    thumbnailId = uploadRes.data[0].id;
                }
            }

            // Step 2: Use selected instructor or fallback to current logged-in user
            const finalInstructorId = selectedInstructor
                ? Number(selectedInstructor)
                : (currentUser?.id ?? null);

            // Step 3: Create Course Entry
            const coursePayload = {
                data: {
                    title: title.trim(),
                    description: description.trim(),
                    instructor: finalInstructorId,
                    ...(thumbnailId && { thumbnail: thumbnailId }),
                },
            };

            await api.post('/courses', coursePayload, {
                headers: {
                    ...authHeader,
                },
            });

            setSuccessMsg('Course created successfully!');
            setTimeout(() => {
                router.push('/dashboard/courses');
            }, 1500);
        } catch (err: any) {
            console.error('Failed to create course:', err);
            const status = err.response?.status;
            if (status === 403) {
                setError('Permission denied (403). Make sure Upload and Course create permissions are enabled in Strapi Settings -> Roles.');
            } else {
                setError(err.response?.data?.error?.message || 'Failed to create course. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Top Navigation */}
            <div>
                <Link
                    href="/dashboard/courses"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Courses
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Course</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Add course basic info, assign an instructor, and upload cover image.
                </p>
            </div>

            {/* Notifications */}
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

            {/* Main Form */}
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

                {/* Instructor Selection */}
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

                {/* Thumbnail Upload */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Course Thumbnail
                    </label>

                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:border-primary/50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {previewUrl ? (
                            <div className="flex flex-col items-center gap-3">
                                <img
                                    src={previewUrl}
                                    alt="Thumbnail Preview"
                                    className="h-40 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                                />
                                <span className="text-xs text-slate-500">Click or drag to replace image</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                                <Upload size={24} className="text-primary" />
                                <span className="text-sm font-medium">Click to upload or drag image here</span>
                                <span className="text-xs text-slate-400">PNG, JPG, or WEBP up to 5MB</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Action */}
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
                                <Loader2 size={16} className="animate-spin" /> Saving...
                            </>
                        ) : (
                            'Save Course'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}