'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMeApi } from '@/lib/api';
import Cookies from 'js-cookie';

interface User {
    id: number;
    username: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    token: string | null;
    setToken: (token: string | null) => void;
    isLoading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const router = useRouter();

    const logout = () => {
        Cookies.remove('jwt', { path: '/' });
        setToken(null);
        setUser(null);
        setIsLoading(false);
        router.push('/login');
    };

    useEffect(() => {
        const savedToken = Cookies.get('jwt');

        if (!savedToken) {
            // Defer state update outside synchronous effect body to avoid cascading render warning
            queueMicrotask(() => {
                setIsLoading(false);
            });
            return;
        }

        let isMounted = true;

        // Defer initial token update to prevent synchronous setState lint warning
        queueMicrotask(() => {
            if (isMounted) setToken(savedToken);
        });

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
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, token, setToken, isLoading, logout }}>
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