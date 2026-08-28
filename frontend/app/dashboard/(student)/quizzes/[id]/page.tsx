'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, CheckCircle2, HelpCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';

interface Question {
    id: number;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: 'A' | 'B' | 'C' | 'D' | string;
}

interface QuizDetails {
    id: number;
    documentId: string;
    title: string;
    questions?: Question[];
}

interface QuizResult {
    id: number;
    documentId?: string;
    score: number;
    totalQuestions?: number;
    answer?: Record<string | number, string>;
    quiz?: {
        id: number;
        documentId?: string;
        title?: string;
    } | string;
    student?: any;
}

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const quizId = resolvedParams.id;

    const { user } = useAuth();
    const [quiz, setQuiz] = useState<QuizDetails | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [previousResult, setPreviousResult] = useState<QuizResult | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

    useEffect(() => {
        const fetchQuizAndResult = async () => {
            if (!user || !quizId) return;

            try {
                setIsLoading(true);

                // 1. Fetch Quiz details and questions
                const quizRes = await api.get(`/quizzes/${quizId}`, {
                    params: {
                        'populate[questions]': '*',
                    },
                });
                const quizData: QuizDetails = quizRes?.data?.data || quizRes?.data;
                setQuiz(quizData);

                // 2. Fetch QuizResults with specific populate fields to prevent nested invalid key errors
                const resultRes = await api.get('/quiz-results', {
                    params: {
                        'populate[quiz][fields][0]': 'documentId',
                        'populate[quiz][fields][1]': 'id',
                        'populate[quiz][fields][2]': 'title',
                        'populate[student][fields][0]': 'id',
                        'populate[student][fields][1]': 'documentId',
                    },
                });

                const rawList = resultRes?.data?.data || resultRes?.data || [];
                const resultList: QuizResult[] = Array.isArray(rawList) ? rawList : [];

                // 3. Find matching quiz result for current quiz ID
                const matchedResult = resultList.find((res) => {
                    const resQuizDocId = typeof res.quiz === 'object' ? res.quiz?.documentId : res.quiz;
                    const resQuizId = typeof res.quiz === 'object' ? res.quiz?.id : res.quiz;

                    const isQuizMatch =
                        String(resQuizDocId) === String(quizId) ||
                        String(resQuizId) === String(quizId);

                    if (res.student) {
                        const resStudentId = typeof res.student === 'object' ? res.student.id : res.student;
                        const resStudentDocId = typeof res.student === 'object' ? res.student.documentId : res.student;

                        const isStudentMatch =
                            String(resStudentId) === String(user.id) ||
                            (user.documentId && String(resStudentDocId) === String(user.documentId));

                        return isQuizMatch && isStudentMatch;
                    }

                    return isQuizMatch;
                });

                if (matchedResult) {
                    setPreviousResult(matchedResult);
                }
            } catch (err: unknown) {
                console.error('Failed to load quiz data:', err);
                setError('Could not load quiz details. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizAndResult();
    }, [user, quizId]);

    const handleSelectOption = (questionIndex: number, optionKey: string) => {
        if (previousResult) return;
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionIndex]: optionKey,
        }));
    };

    const handleSubmitQuiz = async () => {
        if (!quiz?.questions || !user || previousResult) return;

        try {
            setIsSubmitting(true);
            setError('');

            let calculatedScore = 0;
            quiz.questions.forEach((q, idx) => {
                const selected = selectedAnswers[idx];
                if (selected && selected.toUpperCase() === q.correctOption?.toUpperCase()) {
                    calculatedScore += 1;
                }
            });

            const payload = {
                data: {
                    score: calculatedScore,
                    totalQuestions: quiz.questions.length,
                    answer: selectedAnswers,
                    quiz: quiz.documentId || quiz.id,
                    student: user.id,
                },
            };

            const response = await api.post('/quiz-results', payload);
            const newResultData = response?.data?.data || response?.data || {
                score: calculatedScore,
                totalQuestions: quiz.questions.length,
                answer: selectedAnswers,
            };

            setPreviousResult(newResultData);
        } catch (err: any) {
            console.error('Failed to save quiz result:', err);
            const serverMsg = err?.response?.data?.error?.message;
            setError(serverMsg || 'Could not save your quiz result. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading quiz content...</p>
            </div>
        );
    }

    if (error && !quiz) {
        return (
            <div className="space-y-4 text-center py-12">
                <p className="text-red-500 font-medium">{error}</p>
                <Link
                    href="/dashboard/my-courses"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                >
                    <ChevronLeft size={16} /> Back to Courses
                </Link>
            </div>
        );
    }

    const questions = quiz?.questions || [];
    const totalQuestions = questions.length;

    const activeAnswers: Record<string | number, string> = previousResult
        ? previousResult.answer || {}
        : selectedAnswers;

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <Link
                    href="/dashboard/my-courses"
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-medium"
                >
                    <ChevronLeft size={18} /> Back to Courses
                </Link>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-md">
                    {quiz?.title}
                </h1>
            </div>

            {/* Completed Banner */}
            {previousResult && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 size={22} />
                        <span>You have completed this quiz</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        Your Score: <span className="text-primary">{previousResult.score}</span> / {totalQuestions}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Review your answers and correct options below.
                    </p>
                </div>
            )}

            {/* Error Message */}
            {error && quiz && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center text-sm text-red-600 font-medium">
                    {error}
                </div>
            )}

            {totalQuestions === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
                    <HelpCircle className="mx-auto h-12 w-12 text-slate-400" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Questions Found</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        This quiz currently has no questions available.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {questions.map((q, qIdx) => {
                        const options = [
                            { key: 'A', text: q.optionA },
                            { key: 'B', text: q.optionB },
                            { key: 'C', text: q.optionC },
                            { key: 'D', text: q.optionD },
                        ].filter((opt) => Boolean(opt.text));

                        const studentSelection = (
                            activeAnswers[qIdx] ??
                            activeAnswers[String(qIdx)] ??
                            ''
                        ).toString().toUpperCase();

                        const correctKey = (q.correctOption || '').toUpperCase();
                        const isCorrect = studentSelection === correctKey;

                        return (
                            <div
                                key={q.id || qIdx}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                        <span className="text-primary mr-2">{qIdx + 1}.</span> {q.question}
                                    </h2>

                                    {previousResult && (
                                        isCorrect ? (
                                            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                                                Correct
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2.5 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-semibold shrink-0">
                                                Incorrect
                                            </span>
                                        )
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    {options.map((option) => {
                                        const optionKey = option.key.toUpperCase();
                                        const isSelected = studentSelection === optionKey;
                                        const isCorrectOption = optionKey === correctKey;

                                        let styleClasses = 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';

                                        if (previousResult) {
                                            if (isCorrectOption) {
                                                styleClasses = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold';
                                            } else if (isSelected && !isCorrectOption) {
                                                styleClasses = 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300 font-semibold';
                                            }
                                        } else if (isSelected) {
                                            styleClasses = 'border-primary bg-primary/5 text-primary dark:bg-primary/10 font-semibold';
                                        }

                                        return (
                                            <div
                                                key={option.key}
                                                onClick={() => handleSelectOption(qIdx, option.key)}
                                                className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between ${previousResult
                                                        ? 'cursor-default'
                                                        : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                    } ${styleClasses}`}
                                            >
                                                <span>
                                                    <strong className="mr-2">{option.key}.</strong>
                                                    {option.text}
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    {previousResult && isCorrectOption && (
                                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                            Correct Answer
                                                        </span>
                                                    )}
                                                    {previousResult && isSelected && !isCorrectOption && (
                                                        <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                                            Your Answer
                                                        </span>
                                                    )}

                                                    <span
                                                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${isSelected
                                                                ? previousResult && !isCorrectOption
                                                                    ? 'border-red-500 bg-red-500 text-white'
                                                                    : 'border-emerald-500 bg-emerald-500 text-white'
                                                                : 'border-slate-300 dark:border-slate-600'
                                                            }`}
                                                    >
                                                        {isSelected && (previousResult && !isCorrectOption ? '✕' : '✓')}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {!previousResult && (
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSubmitQuiz}
                                disabled={isSubmitting || Object.keys(selectedAnswers).length < totalQuestions}
                                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold disabled:opacity-50 shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                <span>{isSubmitting ? 'Submitting...' : 'Submit Quiz'}</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}