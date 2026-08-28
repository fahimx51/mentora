'use client';

import React, { useEffect, useState } from 'react';
import {
    Loader2,
    Trash2,
    Search,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Mail,
    Shield,
    Users,
    ShieldCheck,
    GraduationCap,
    FileEdit,
    UserCheck,
    Filter
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context/AuthContext';

interface Role {
    id: number;
    name: string;
    type: string;
}

interface UserData {
    id: number;
    documentId?: string;
    username: string;
    email: string;
    confirmed: boolean;
    blocked: boolean;
    createdAt: string;
    role?: Role;
}

export default function AdminUsersPage() {
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState<UserData[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

    const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

    const [error, setError] = useState<string>('');
    const [successMsg, setSuccessMsg] = useState<string>('');

    useEffect(() => {
        fetchUsersAndRoles();
    }, []);

    const fetchUsersAndRoles = async () => {
        try {
            setIsLoading(true);
            setError('');

            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users?populate=role'),
                api.get('/users-permissions/roles'),
            ]);

            setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            setRoles(rolesRes.data?.roles || []);
        } catch (err: any) {
            console.error('Failed to load users or roles:', err);
            setError('Could not fetch user management data. Ensure admin permissions are enabled.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (targetUserId: number, newRoleId: number) => {
        try {
            setUpdatingUserId(targetUserId);
            setError('');
            setSuccessMsg('');

            await api.put(`/users/${targetUserId}`, {
                role: newRoleId,
            });

            const updatedRoleObj = roles.find((r) => r.id === newRoleId);
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === targetUserId ? { ...u, role: updatedRoleObj } : u
                )
            );

            setSuccessMsg('User role updated successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: any) {
            console.error('Failed to update user role:', err);
            setError('Failed to update role. Please check backend API permissions.');
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleDeleteUser = async (targetUserId: number) => {
        if (targetUserId === currentUser?.id) {
            setError('You cannot delete your own admin account.');
            return;
        }

        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            setDeletingUserId(targetUserId);
            setError('');
            setSuccessMsg('');

            await api.delete(`/users/${targetUserId}`);

            setUsers((prev) => prev.filter((u) => u.id !== targetUserId));
            setSuccessMsg('User account deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: any) {
            console.error('Failed to delete user:', err);
            setError('Failed to delete user. Ensure backend delete permissions are enabled.');
        } finally {
            setDeletingUserId(null);
        }
    };

    // Role helper to match role names flexibly
    const countByRole = (roleKeyword: string) => {
        return users.filter((u) =>
            u.role?.name?.toLowerCase().includes(roleKeyword.toLowerCase()) ||
            u.role?.type?.toLowerCase().includes(roleKeyword.toLowerCase())
        ).length;
    };

    // Filter logic for Search + Role filter
    const filteredUsers = users.filter((u) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            u.username?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.role?.name?.toLowerCase().includes(query);

        const matchesRole =
            selectedRoleFilter === 'all' ||
            String(u.role?.id) === selectedRoleFilter;

        return matchesSearch && matchesRole;
    });

    const getRoleBadgeStyle = (roleName?: string) => {
        const lower = roleName?.toLowerCase() || '';
        if (lower.includes('admin')) {
            return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
        }
        if (lower.includes('instructor') || lower.includes('teacher')) {
            return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        }
        if (lower.includes('content') || lower.includes('manager')) {
            return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
        }
        // Student / Authenticated default
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Loading users directory...
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 pb-12">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        User Directory
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage user roles, monitor registrations, and control permissions.
                    </p>
                </div>
            </div>

            {/* Quick Stats Summary for 4 Roles + Total */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                {/* Total Users */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm col-span-2 sm:col-span-1">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                        <Users size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Users</p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{users.length}</h3>
                    </div>
                </div>

                {/* Students */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                        <GraduationCap size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Students</p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {countByRole('student') || countByRole('authenticated')}
                        </h3>
                    </div>
                </div>

                {/* Instructors */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                        <UserCheck size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Instructors</p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {countByRole('instructor')}
                        </h3>
                    </div>
                </div>

                {/* Content Managers */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                        <FileEdit size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Content Mgrs</p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {countByRole('content')}
                        </h3>
                    </div>
                </div>

                {/* Admins */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Admins</p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {countByRole('admin')}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                    <select
                        value={selectedRoleFilter}
                        onChange={(e) => setSelectedRoleFilter(e.target.value)}
                        className="w-full sm:w-48 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                        <option value="all">All Roles</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm text-red-600 font-medium">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 size={18} className="shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Mobile Card Layout */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredUsers.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                        No users found matching your filters.
                    </div>
                ) : (
                    filteredUsers.map((item) => {
                        const isSelf = item.id === currentUser?.id;
                        const createdDate = item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })
                            : 'N/A';

                        return (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                                            {item.username?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                <span>{item.username}</span>
                                                {isSelf && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                <Mail size={12} />
                                                <span className="truncate max-w-[180px]">{item.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteUser(item.id)}
                                        disabled={deletingUserId === item.id || isSelf}
                                        title={isSelf ? "You cannot delete your own account" : "Delete User"}
                                        className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-20 rounded-lg hover:bg-red-500/10 shrink-0"
                                    >
                                        {deletingUserId === item.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                    </button>
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-3 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <Calendar size={13} /> Joined {createdDate}
                                        </span>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${getRoleBadgeStyle(
                                                item.role?.name
                                            )}`}
                                        >
                                            {item.role?.name || 'No Role'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <Shield size={14} className="text-slate-400 shrink-0" />
                                        <select
                                            disabled={updatingUserId === item.id || isSelf}
                                            value={item.role?.id || ''}
                                            onChange={(e) =>
                                                handleRoleChange(item.id, Number(e.target.value))
                                            }
                                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all cursor-pointer"
                                        >
                                            {roles.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    Change to: {r.name}
                                                </option>
                                            ))}
                                        </select>
                                        {updatingUserId === item.id && (
                                            <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">User</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Joined Date</th>
                                <th className="p-4">Role Badge</th>
                                <th className="p-4">Change Role</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        No users found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((item) => {
                                    const isSelf = item.id === currentUser?.id;
                                    const createdDate = item.createdAt
                                        ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })
                                        : 'N/A';

                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                                        >
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                                                        {item.username?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                            <span>{item.username}</span>
                                                            {isSelf && (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                                                {item.email}
                                            </td>

                                            <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                                                {createdDate}
                                            </td>

                                            <td className="p-4">
                                                <span
                                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getRoleBadgeStyle(
                                                        item.role?.name
                                                    )}`}
                                                >
                                                    {item.role?.name || 'No Role'}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        disabled={updatingUserId === item.id || isSelf}
                                                        value={item.role?.id || ''}
                                                        onChange={(e) =>
                                                            handleRoleChange(item.id, Number(e.target.value))
                                                        }
                                                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all cursor-pointer"
                                                    >
                                                        {roles.map((r) => (
                                                            <option key={r.id} value={r.id}>
                                                                {r.name}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    {updatingUserId === item.id && (
                                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-4 pr-6 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser(item.id)}
                                                    disabled={deletingUserId === item.id || isSelf}
                                                    title={isSelf ? "You cannot delete your own account" : "Delete User"}
                                                    className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-20 rounded-lg hover:bg-red-500/10"
                                                >
                                                    {deletingUserId === item.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}