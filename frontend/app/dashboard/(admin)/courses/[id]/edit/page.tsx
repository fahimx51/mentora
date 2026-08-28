'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, AlertTriangle, CheckCircle2, Upload } from 'lucide-react';
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
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [existingThumbnailId, setExistingThumbnailId] = useState<number | null>(null);
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

    // Clean Fetch Course Details (No 404 error)
    const fetchCourseDetails = async () => {
        try {
            setIsLoadingCourse(true);
            setError('');

            let courseData: any = null;
            const isNumericId = /^\d+$/.test(courseId);

            if (isNumericId) {
                // Numeric ID: Query by filters directly to prevent 404 in Strapi v5
                const res = await api.get(`/courses?filters[id][$eq]=${courseId}&populate=*`);
                const items = res.data?.data || res.data || [];
                if (items.length > 0) {
                    courseData = items[0];
                } else {
                    throw new Error('Course not found');
                }
            } else {
                // String documentId: Fetch directly
                const res = await api.get(`/courses/${courseId}?populate=*`);
                courseData = res.data?.data || res.data;
            }

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

            // Thumbnail extraction
            const thumbObj = attributes?.thumbnail?.data || attributes?.thumbnail;
            if (thumbObj) {
                setExistingThumbnailId(thumbObj.id || null);
                const imageUrl = thumbObj.attributes?.url || thumbObj.url;
                if (imageUrl) {
                    const fullUrl = imageUrl.startsWith('http')
                        ? imageUrl
                        : `${process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337'}${imageUrl}`;
                    setPreviewUrl(fullUrl);
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch course details:', err);
            setError('Failed to load course details. Please check if the course exists.');
        } finally {
            setIsLoadingCourse(false);
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
            let thumbnailId: number | null = existingThumbnailId;

            const token = localStorage.getItem('token') || localStorage.getItem('jwt');
            const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

            // Step 1: Upload new image to Strapi if selected
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

            // Step 2: Selected instructor or fallback
            const finalInstructorId = selectedInstructor
                ? Number(selectedInstructor)
                : (currentUser?.id ?? null);

            // Step 3: Payload structure for Strapi
            const coursePayload = {
                data: {
                    title: title.trim(),
                    description: description.trim(),
                    instructor: finalInstructorId,
                    ...(thumbnailId && { thumbnail: thumbnailId }),
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
                router.push('/dashboard/courses');
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
                    href="/dashboard/courses"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Courses
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Course</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Update course details, instructor, and thumbnail.
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