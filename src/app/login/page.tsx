"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SoftCard from '@/components/ui/SoftCard';
import SoftButton from '@/components/ui/SoftButton';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/admin');
            } else {
                setError(data.error || 'Login failed. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 rounded-full bg-nm-primary flex items-center justify-center text-white shadow-xl nm-flat-nm-primary-lg mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Admin Login</h1>
                    <p className="text-gray-400 font-medium">Please sign in to continue</p>
                </div>

                <SoftCard className="p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium animate-in fade-in zoom-in duration-300 text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    required
                                    className="w-full px-6 py-4 bg-white/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-nm-primary/20 transition-all placeholder:text-gray-300 font-medium text-foreground shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-6 py-4 bg-white/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-nm-primary/20 transition-all placeholder:text-gray-300 font-medium text-foreground shadow-inner"
                                />
                            </div>
                        </div>

                        <SoftButton
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 text-lg font-bold shadow-lg nm-flat-nm-primary hover:nm-convex-nm-primary transition-all active:nm-concave-nm-primary"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </SoftButton>
                    </form>
                </SoftCard>

                <p className="mt-8 text-center text-sm text-gray-300 font-medium">
                    &copy; 2026 Admin Dashboard
                </p>
            </div>
        </main>
    );
}
