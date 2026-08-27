'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';
import Logo from '@/components/shared/Logo';
import { getMeApi, loginUserApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });

    const router = useRouter();
    const { setAccessToken, setRefreshToken, setUser } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await loginUserApi(formData);
            console.log(result);

            // 1. Save tokens to cookies
            Cookies.set('jwt', result.jwt, { expires: 7, path: '/', sameSite: 'lax' });
            Cookies.set('refreshToken', result.refreshToken, { expires: 30, path: '/', sameSite: 'lax' });

            // 2. Update React Context state
            setAccessToken(result.jwt);
            setRefreshToken(result.refreshToken);
            
            const fullUserData = await getMeApi();
            setUser(fullUserData);
            // console.log("full user",fullUserData);

            // 3. Redirect home
            router.push('/');

        } catch (err: unknown) {
            console.error('Login failed:', err);
            setError(
                (err as { response?: { data?: { error?: { message?: string } } } })
                    .response?.data?.error?.message || 'Login failed. Please check your credentials.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">

            {/* Brand Header */}
            <div className="mb-8 text-center flex flex-col items-center">
                <Logo />
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    Welcome back
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Sign in to access your learning dashboard
                </p>
            </div>

            {/* Form Card */}
            <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors duration-200">

                {/* Error Alert */}
                {error && (
                    <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Email / Username Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Email or Username
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Mail className="h-5 w-5" />
                            </div>
                            <input
                                type="text"
                                name="identifier"
                                required
                                value={formData.identifier}
                                onChange={handleChange}
                                placeholder="name@example.com"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Password
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-xs font-semibold text-primary hover:underline transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99] transition-all duration-200 text-sm cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer Links */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/register"
                        className="font-semibold text-primary hover:underline transition-colors"
                    >
                        Create an account
                    </Link>
                </div>
            </div>
        </div>
    );
}