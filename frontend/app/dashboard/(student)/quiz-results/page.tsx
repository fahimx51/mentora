'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Award, CheckCircle2, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';

interface QuizResult {
    id: number;
    documentId?: string;
    score: number;
    totalQuestions: number;
    createdAt: string;
    quiz?: {
        id: number;
        documentId?: string;
        title?: string;
    };
}

export default function QuizResultsPage() {
    const { user } = useAuth();
    const [results, setResults] = useState<QuizResult[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchAllUserResults = async () => {
            if (!user) return;

            try {
                setIsLoading(true);

                // Fetch all quiz results with target populated fields
                const response = await api.get('/quiz-results', {
                    params: {
                        'populate[quiz][fields][0]': 'documentId',
                        'populate[quiz][fields][1]': 'id',
                        'populate[quiz][fields][2]': 'title',
                        'populate[student][fields][0]': 'id',
                        'populate[student][fields][1]': 'documentId',
                        'sort[0]': 'createdAt:desc',
                    },
                });

                const rawList = response?.data?.data || response?.data || [];
                const resultList: QuizResult[] = Array.isArray(rawList) ? rawList : [];

                // Filter items belonging to current user
                const userAttempts = resultList.filter((res: any) => {
                    if (!res.student) return true; // Include if backend auto-filters user entries
                    const studentId = typeof res.student === 'object' ? res.student.id : res.student;
                    const studentDocId = typeof res.student === 'object' ? res.student.documentId : res.student;

                    return (
                        String(studentId) === String(user.id) ||
                        (user.documentId && String(studentDocId) === String(user.documentId))
                    );
                });

                setResults(userAttempts);
            } catch (err: unknown) {
                console.error('Failed to fetch quiz results:', err);
                setError('Failed to load your quiz attempts. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllUserResults();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Loading your quiz attempts...
                </p>
            </div>
        );
    }

    // Calculate Summary Statistics
    const totalQuizzesTaken = results.length;
    const totalScoreEarned = results.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const totalPossibleScore = results.reduce((acc, curr) => acc + (curr.totalQuestions || 0), 0);
    const overallPercentage = totalPossibleScore > 0
        ? Math.round((totalScoreEarned / totalPossibleScore) * 100)
        : 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quiz Performance</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Track your scores and review all completed quiz assessments.
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-600 font-medium">
                    {error}
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Attempts</p>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{totalQuizzesTaken}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Score</p>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {totalScoreEarned} / {totalPossibleScore}
                        </h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                        <Award size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Accuracy</p>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{overallPercentage}%</h3>
                    </div>
                </div>
            </div>

            {/* Quiz Attempts List */}
            {results.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
                    <Award className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">No Quiz Attempts Found</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            You haven't completed any quizzes yet.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/my-courses"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
                    >
                        Browse Courses
                    </Link>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Attempt History</h2>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {results.map((item) => {
                            const quizTitle = item.quiz?.title || 'Untitled Quiz';
                            const quizDocId = item.quiz?.documentId || item.quiz?.id;
                            const totalQ = item.totalQuestions || 0;
                            const percentage = totalQ > 0 ? Math.round((item.score / totalQ) * 100) : 0;
                            const attemptDate = item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })
                                : 'Recent';

                            return (
                                <div
                                    key={item.id}
                                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="space-y-1">
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                            {quizTitle}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} /> {attemptDate}
                                            </span>
                                            <span>•</span>
                                            <span>{totalQ} Questions</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6">
                                        {/* Score Badge */}
                                        <div className="text-right">
                                            <div className="text-base font-bold text-slate-900 dark:text-white">
                                                <span className="text-primary">{item.score}</span> / {totalQ}
                                            </div>
                                            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                {percentage}% Score
                                            </div>
                                        </div>

                                        {/* Review Link */}
                                        {quizDocId ? (
                                            <Link
                                                href={`/dashboard/quizzes/${quizDocId}`}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                                            >
                                                <span>Review</span>
                                                <ArrowRight size={14} />
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-slate-400">Unavailable</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}