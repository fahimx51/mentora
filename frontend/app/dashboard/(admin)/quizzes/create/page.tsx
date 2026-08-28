'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, HelpCircle, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Course {
    id: number;
    documentId?: string;
    title: string;
}

interface QuestionItem {
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: 'A' | 'B' | 'C' | 'D';
}

export default function CreateQuizPage() {
    const router = useRouter();

    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [quizTitle, setQuizTitle] = useState<string>('');
    const [questions, setQuestions] = useState<QuestionItem[]>([
        {
            question: '',
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            correctOption: 'A',
        },
    ]);

    const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // Fetch existing courses for relation dropdown
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setIsLoadingCourses(true);
                const response = await api.get('/courses');
                const list = Array.isArray(response?.data?.data)
                    ? response.data.data
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];

                const mappedCourses: Course[] = list.map((item: any) => ({
                    id: item.id,
                    documentId: item.documentId || item.id,
                    title: item.title || item.attributes?.title || 'Untitled Course',
                }));

                setCourses(mappedCourses);
            } catch (err) {
                console.error('Failed to load courses:', err);
                setError('Could not load course list.');
            } finally {
                setIsLoadingCourses(false);
            }
        };

        fetchCourses();
    }, []);

    // Manage dynamic questions
    const handleAddQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            {
                question: '',
                optionA: '',
                optionB: '',
                optionC: '',
                optionD: '',
                correctOption: 'A',
            },
        ]);
    };

    const handleRemoveQuestion = (index: number) => {
        if (questions.length === 1) return;
        setQuestions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleQuestionChange = (
        index: number,
        field: keyof QuestionItem,
        value: string
    ) => {
        setQuestions((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!quizTitle.trim()) {
            setError('Please enter a quiz title.');
            return;
        }

        if (!selectedCourse) {
            setError('Please select a course for this quiz.');
            return;
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question.trim() || !q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
                setError(`Please complete all fields for Question ${i + 1}.`);
                return;
            }
        }

        try {
            setIsSubmitting(true);

            const payload = {
                data: {
                    title: quizTitle,
                    course: selectedCourse,
                    questions: questions,
                },
            };

            await api.post('/quizzes', payload);
            setIsSuccess(true);

            // Redirect after 1.5 seconds so user can see the success UI
            setTimeout(() => {
                router.push('/dashboard/quizzes');
            }, 1500);
        } catch (err: any) {
            console.error('Failed to create quiz:', err);
            setError(err?.response?.data?.error?.message || 'Failed to create quiz. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4 gap-3">
                <div className="space-y-1">
                    <Link
                        href="/dashboard/quizzes"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-medium mb-1"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Quizzes
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-primary" /> Create New Quiz
                    </h1>
                </div>
            </div>

            {/* Success Alert */}
            {isSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    Quiz created successfully! Redirecting to quizzes list...
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs sm:text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Information Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 space-y-4 shadow-sm">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        General Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Quiz Title */}
                        <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                Quiz Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                placeholder="e.g. JavaScript Basics Quiz"
                                disabled={isSubmitting || isSuccess}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                                required
                            />
                        </div>

                        {/* Select Course */}
                        <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                Associated Course <span className="text-red-500">*</span>
                            </label>
                            {isLoadingCourses ? (
                                <div className="flex items-center gap-2 py-2.5 text-xs text-slate-500">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading courses...
                                </div>
                            ) : (
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    disabled={isSubmitting || isSuccess}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                                    required
                                >
                                    <option value="">Select a Course</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.documentId || course.id}>
                                            {course.title}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                            Quiz Questions ({questions.length})
                        </h2>
                        <button
                            type="button"
                            onClick={handleAddQuestion}
                            disabled={isSubmitting || isSuccess}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                            <Plus className="w-4 h-4" /> Add Question
                        </button>
                    </div>

                    {questions.map((q, qIndex) => (
                        <div
                            key={qIndex}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 space-y-4 shadow-sm relative"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                                        {qIndex + 1}
                                    </span>
                                    Question {qIndex + 1}
                                </span>

                                {questions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuestion(qIndex)}
                                        disabled={isSubmitting || isSuccess}
                                        className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-50"
                                        title="Delete Question"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Question Title */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Question Statement
                                </label>
                                <input
                                    type="text"
                                    value={q.question}
                                    onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                                    placeholder="Enter your question text here..."
                                    disabled={isSubmitting || isSuccess}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                                    required
                                />
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        Option A
                                    </label>
                                    <input
                                        type="text"
                                        value={q.optionA}
                                        onChange={(e) => handleQuestionChange(qIndex, 'optionA', e.target.value)}
                                        placeholder="First option"
                                        disabled={isSubmitting || isSuccess}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        Option B
                                    </label>
                                    <input
                                        type="text"
                                        value={q.optionB}
                                        onChange={(e) => handleQuestionChange(qIndex, 'optionB', e.target.value)}
                                        placeholder="Second option"
                                        disabled={isSubmitting || isSuccess}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        Option C
                                    </label>
                                    <input
                                        type="text"
                                        value={q.optionC}
                                        onChange={(e) => handleQuestionChange(qIndex, 'optionC', e.target.value)}
                                        placeholder="Third option"
                                        disabled={isSubmitting || isSuccess}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        Option D
                                    </label>
                                    <input
                                        type="text"
                                        value={q.optionD}
                                        onChange={(e) => handleQuestionChange(qIndex, 'optionD', e.target.value)}
                                        placeholder="Fourth option"
                                        disabled={isSubmitting || isSuccess}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Correct Option Selector */}
                            <div className="pt-2">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                                    Correct Option
                                </label>
                                <select
                                    value={q.correctOption}
                                    onChange={(e) =>
                                        handleQuestionChange(
                                            qIndex,
                                            'correctOption',
                                            e.target.value as any
                                        )
                                    }
                                    disabled={isSubmitting || isSuccess}
                                    className="w-full sm:w-1/2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                                >
                                    <option value="A">Option A</option>
                                    <option value="B">Option B</option>
                                    <option value="C">Option C</option>
                                    <option value="D">Option D</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Action */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting || isSuccess}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                        {isSuccess ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-white" /> Quiz Created!
                            </>
                        ) : isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Saving Quiz...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> Save & Publish Quiz
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}