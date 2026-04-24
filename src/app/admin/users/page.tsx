"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AdminSubNavbar from '@/components/AdminSubNavbar';
import Footer from '@/components/Footer';
import SoftCard from '@/components/ui/SoftCard';
import SoftButton from '@/components/ui/SoftButton';
import SoftSelect from '@/components/ui/SoftSelect';
import { formatThaiDate } from '@/utils/date';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: number | string;
    username: string;
    name_th: string;
    hname: string;
    role: string;
    status: 'pending' | 'active' | 'disabled';
    createdAt: string;
    email: string;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/telemedicine/api/admin/users');
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdate = async (id: number | string, status: string, role: string) => {
        try {
            const res = await fetch('/telemedicine/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, role })
            });

            if (res.ok) {
                setStatusMsg({ type: 'success', text: 'User updated successfully' });
                fetchUsers();
            } else {
                setStatusMsg({ type: 'error', text: 'Failed to update user' });
            }
        } catch (error) {
            setStatusMsg({ type: 'error', text: 'Error connecting to server' });
        }
    };

    const handleDelete = async (id: number | string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const res = await fetch(`/telemedicine/api/admin/users?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setStatusMsg({ type: 'success', text: 'User deleted successfully' });
                fetchUsers();
            } else {
                setStatusMsg({ type: 'error', text: 'Failed to delete user' });
            }
        } catch (error) {
            setStatusMsg({ type: 'error', text: 'Error connecting to server' });
        }
    };

    return (
        <main className="min-h-screen bg-background font-sans relative overflow-hidden pb-12">
            <Navbar showFilters={false} showSignOut={true} />

            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/30 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-50/30 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto px-6 relative z-10 pt-12 space-y-10">
                
                {/* Admin Sub Navigation */}
                <AdminSubNavbar />
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">User Management</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Manage access and permissions</p>
                    </div>
                    
                    <AnimatePresence>
                        {statusMsg && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg ${
                                    statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}
                            >
                                {statusMsg.text}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Users List Card */}
                <SoftCard className="overflow-hidden border-none shadow-2xl shadow-indigo-100/20 rounded-[2.5rem]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">User Info</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Organization</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Role</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Registered</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-100 border-t-indigo-600" />
                                            <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Loading Users...</p>
                                        </td>
                                    </tr>
                                ) : users.length > 0 ? (
                                    users.map((user, idx) => (
                                        <motion.tr 
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-slate-50/30 transition-colors"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-black text-sm">
                                                        {user.name_th?.charAt(0) || user.username?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{user.name_th || 'N/A'}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight">{user.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-black text-slate-600 leading-relaxed max-w-[200px]">{user.hname || '-'}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <SoftSelect 
                                                    options={[
                                                        { label: 'Admin', value: 'admin' },
                                                        { label: 'User', value: 'user' }
                                                    ]}
                                                    value={user.role}
                                                    onChange={(val) => handleUpdate(user.id, user.status, val)}
                                                    className="w-32"
                                                />
                                            </td>
                                            <td className="px-8 py-6">
                                                <SoftSelect 
                                                    options={[
                                                        { label: 'Pending', value: 'pending' },
                                                        { label: 'Active', value: 'active' },
                                                        { label: 'Disabled', value: 'disabled' }
                                                    ]}
                                                    value={user.status}
                                                    onChange={(val) => handleUpdate(user.id, val, user.role)}
                                                    className="w-32"
                                                />
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                                    {formatThaiDate(user.createdAt)}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button 
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Delete user"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </SoftCard>

                <Footer />
            </div>
        </main>
    );
}
