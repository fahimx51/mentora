'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Image as ImageIcon, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';

interface Instructor {
    id: number;
    documentId?: string;
    username: string;
    email: string;
}

export default function CreateCoursePage() {
    const router = useRouter();
    const { user: currentUser } = useAuth();

    // Role verification
    const userRole = currentUser?.role?.name?.toLowerCase() || '';
    const canSelectInstructor = userRole.includes('admin') || userRole.includes('content manager');

    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedInstructor, setSelectedInstructor] = useState<string>('');
    const [thumbnailUrl, setThumbnailUrl] = useState<string>('');

    // Status
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [isLoadingInstructors, setIsLoadingInstructors] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (canSelectInstructor) {
            fetchInstructors();
        }
    }, [canSelectInstructor]);

    const fetchInstructors = async () => {
        try {
            setIsLoadingInstructors(true);
            const res = await api.get('/users?populate=role');
            const usersList: any[] = res.data || [];

            const filtered = usersList.filter((u) => {
                const roleName = u.role?.name?.toLowerCase() || '';
                return roleName.includes('instructor') || roleName.includes('instractor');
            });

            setInstructors(filtered.length > 0 ? filtered : usersList);
        } catch (err: any) {
            console.error('Failed to load instructors:', err);
        } finally {
            setIsLoadingInstructors(false);
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

            let targetDocId: string | null = null;

            if (canSelectInstructor && selectedInstructor) {
                const selectedInst = instructors.find(
                    (i) => String(i.id) === String(selectedInstructor) || i.documentId === selectedInstructor
                );
                targetDocId = selectedInst?.documentId || null;
            } else {
                targetDocId = currentUser?.documentId || null;
            }

            if (!targetDocId) {
                setError('Could not identify instructor. Please re-login.');
                setIsSubmitting(false);
                return;
            }

            await api.post('/courses', {
                data: {
                    title: title.trim(),
                    description: description.trim(),
                    thumbnail: thumbnailUrl.trim(),
                    instructor: targetDocId,
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
                setError('Permission denied. Make sure Course "create" permission is enabled for your role in Strapi Admin Settings.');
            } else {
                setError(err.response?.data?.error?.message || 'Failed to create course. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
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
                    Add course basic info, assign an instructor, and add a cover image URL.
                </p>
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

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
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

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Assign Instructor</span>
                        {!canSelectInstructor && (
                            <span className="text-[11px] text-slate-400 lowercase font-normal flex items-center gap-1">
                                <Lock size={12} /> locked to your account
                            </span>
                        )}
                    </label>

                    {canSelectInstructor ? (
                        isLoadingInstructors ? (
                            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                                <Loader2 size={14} className="animate-spin text-primary" /> Loading instructors...
                            </div>
                        ) : (
                            <select
                                value={selectedInstructor}
                                onChange={(e) => setSelectedInstructor(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                <option value="">Default ({currentUser?.username || 'Logged-in User'})</option>
                                {instructors.map((inst) => (
                                    <option key={inst.id} value={inst.documentId || inst.id}>
                                        {inst.username} ({inst.email})
                                    </option>
                                ))}
                            </select>
                        )
                    ) : (
                        <div className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400 font-medium flex items-center justify-between cursor-not-allowed">
                            <span>{currentUser?.username || 'Current User'} ({currentUser?.email || 'N/A'})</span>
                            <Lock size={16} className="text-slate-400 shrink-0" />
                        </div>
                    )}
                </div>

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

                    {thumbnailUrl.trim() && (
                        <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl inline-block">
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Preview:</p>
                            <img
                                src={thumbnailUrl}
                                alt="Thumbnail Preview"
                                className="h-32 w-auto max-w-full object-cover rounded-lg"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                }}
                            />
                        </div>
                    )}
                </div>

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