export default function DashboardSkeleton() {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 animate-pulse">
            {/* Sidebar skeleton */}
            <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
                <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
                        <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-800" />
                </div>

                <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-2">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
                </div>

                <nav className="flex-1 p-2 space-y-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2">
                            <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-800" />
                            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main content skeleton */}
            <main className="flex-1 p-6 space-y-6">
                <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-28 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 space-y-3"
                        >
                            <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                            <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-800" />
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-20 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}