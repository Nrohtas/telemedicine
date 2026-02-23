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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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

                <p className="mt-8 text-center text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] max-w-[280px] leading-relaxed mx-auto">
                    Copyright © Telemedicine of Phitsanulok Provincial Public Health Office
                </p>

                <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="text-xs font-bold text-nm-primary/70 hover:text-nm-primary flex items-center gap-2 transition-colors uppercase tracking-widest"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </main>
    );
}
