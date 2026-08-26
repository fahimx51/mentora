'use client';

import React, { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

// Helper to check if we are mounted on the client
const emptySubscribe = () => () => { };
function useIsMounted() {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,  // Client value
        () => false  // Server value
    );
}

function ToggleMode() {
    const { theme, setTheme } = useTheme();
    const isMounted = useIsMounted();

    if (!isMounted) {
        return (
            <button
                className="p-2 border rounded-md dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-0"
                aria-label="Toggle Mode"
            >
                <Sun className="h-5 w-5" />
            </button>
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500 transition-transform duration-200 hover:rotate-45" />
            ) : (
                <Moon className="h-5 w-5 text-slate-600 transition-transform duration-200 hover:-rotate-12" />
            )}
        </button>
    );
}

export default ToggleMode;