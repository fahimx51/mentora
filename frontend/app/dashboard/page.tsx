'use client';

import { useAuth } from "@/context/auth-context/AuthContext";



export default function DashboardPage() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <span>Loading dashboard...</span>
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-lg font-medium">Please log in to view your dashboard.</p>
                <a href="/login" className="btn btn-primary">
                    Go to Login
                </a>
            </div>
        );
    }

    

    return (
        <div>
            fjdl    
        </div>
    );

   
}