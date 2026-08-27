'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMeApi } from '@/lib/api';
import Cookies from 'js-cookie';

interface Role {
    id: number;
    name: string;
    type: string;
}

interface User {
    id: number;
    username: string;
    email: string;
    role?: Role;
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    accessToken: string | null;
    refreshToken: string | null;
    setAccessToken: (token: string | null) => void;
    setRefreshToken: (token: string | null) => void;
    isLoading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const router = useRouter();

    const logout = useCallback(() => {
        Cookies.remove('jwt', { path: '/' });
        Cookies.remove('refreshToken', { path: '/' });
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        setIsLoading(false);
        router.push('/login');
    }, [router]);

    useEffect(() => {
        const savedAccessToken = Cookies.get('jwt');
        const savedRefreshToken = Cookies.get('refreshToken');

        // Allow mount check if either access token OR refresh token exists
        if (!savedAccessToken && !savedRefreshToken) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        if (savedAccessToken) setAccessToken(savedAccessToken);
        if (savedRefreshToken) setRefreshToken(savedRefreshToken);

        getMeApi()
            .then((userData) => {
                if (isMounted) {
                    setUser(userData);
                    // Sync updated tokens from cookies if interceptor refreshed them
                    const freshJwt = Cookies.get('jwt');
                    if (freshJwt) setAccessToken(freshJwt);
                }
            })
            .catch((err) => {
                if (!isMounted) return;
                // ONLY trigger logout if backend explicitly rejects session (401/403)
                if (err?.response?.status === 401 || err?.response?.status === 403) {
                    logout();
                }
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [logout]);

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                accessToken,
                refreshToken,
                setAccessToken,
                setRefreshToken,
                isLoading,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}