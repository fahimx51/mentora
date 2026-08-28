'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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

    const logout = () => {
        Cookies.remove('jwt', { path: '/' });
        Cookies.remove('refreshToken', { path: '/' });
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        setIsLoading(false);
        router.push('/login');
    };

    useEffect(() => {
        const savedAccessToken = Cookies.get('jwt');
        const savedRefreshToken = Cookies.get('refreshToken');

        if (!savedAccessToken) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        setAccessToken(savedAccessToken);
        if (savedRefreshToken) {
            setRefreshToken(savedRefreshToken);
        }

        getMeApi()
            .then((userData) => {
                if (isMounted) setUser(userData);
            })
            .catch(() => {
                if (isMounted) logout();
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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