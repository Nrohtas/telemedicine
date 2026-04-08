"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SoftCard from '@/components/ui/SoftCard';
import SoftButton from '@/components/ui/SoftButton';

function LoginContent() {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginMethod, setLoginMethod] = useState<'moph' | 'local'>('moph');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const errorParam = searchParams.get('error');
        const messageParam = searchParams.get('message');
        if (errorParam === 'auth_failed') {
            setError(messageParam || 'การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง');
        }
    }, [searchParams]);

    const handleMophLogin = () => {
        setIsLoading(true);
        const clientId = process.env.NEXT_PUBLIC_HEALTH_CLIENT_ID;
        const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_HEALTH_REDIRECT_URI || '');

        if (!clientId || !redirectUri) {
            setError('System configuration error: Missing MOPH Client ID or Redirect URI');
            setIsLoading(false);
            return;
        }

        const url = `https://moph.id.th/oauth/redirect?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&is_auth=yes`;
        window.location.href = url;
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/telemedicine/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
                router.push('/admin');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 flex items-center justify-center mb-6 p-2">
                        <img
                            src="https://moph.id.th/img/logo-moph.png"
                            alt="MOPH Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight mb-1 text-center">Admin</h1>
                    <p className="text-slate-400 font-medium text-center text-sm italic">MOPH Telemedicine</p>
                </div>

                <SoftCard className="p-8 border-t-4 border-[#006837]">
                    <div className="space-y-6">
                        {/* Toggle Switches */}
                        <div className="flex p-1 bg-gray-100 rounded-2xl">
                            <button
                                onClick={() => setLoginMethod('moph')}
                                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${loginMethod === 'moph' ? 'bg-white shadow-md text-[#006837]' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                ProviderID
                            </button>
                            <button
                                onClick={() => setLoginMethod('local')}
                                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${loginMethod === 'local' ? 'bg-white shadow-md text-[#006837]' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Username
                            </button>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium animate-in fade-in zoom-in duration-300">
                                <p className="font-bold mb-1">เกิดข้อผิดพลาด</p>
                                {error}
                            </div>
                        )}

                        {loginMethod === 'moph' ? (
                            <div className="flex flex-col items-center justify-center pt-4 pb-2 space-y-5">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-[2.5rem] blur-sm opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                    <button
                                        onClick={handleMophLogin}
                                        disabled={isLoading}
                                        className="relative w-32 h-32 bg-white rounded-[2rem] shadow-xl transition-all duration-500 transform hover:scale-105 active:scale-95 flex items-center justify-center border border-slate-100 overflow-hidden"
                                    >
                                        {isLoading ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-3 border-emerald-50 border-t-emerald-600 rounded-full animate-spin" />
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Connect...</span>
                                            </div>
                                        ) : (
                                            <div className="relative flex flex-col items-center transition-all duration-500">
                                                <img
                                                    src="https://provider.id.th/assets/Plogo-f6506bc1.png"
                                                    alt="ProviderID Logo"
                                                    className="w-20 h-20 object-contain transition-transform duration-500 group-hover:scale-110"
                                                />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-500" />
                                    </button>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] opacity-80">
                                        Click logo to authorize
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordLogin} className="space-y-4 pt-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-50 transition-all font-medium text-slate-700"
                                        placeholder="Enter username"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-50 transition-all font-medium text-slate-700"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <SoftButton
                                    type="submit"
                                    disabled={isLoading}
                                    variant="none"
                                    className="w-full py-4 mt-4 bg-[#006837] hover:bg-[#00522c] text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-100"
                                >
                                    {isLoading ? 'Processing...' : 'Sign In'}
                                </SoftButton>
                            </form>
                        )}
                    </div>
                </SoftCard>

                <div className="mt-8 flex justify-center mb-6">
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="text-xs font-bold text-gray-400 hover:text-emerald-600 flex items-center gap-2 transition-colors uppercase tracking-widest"
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

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center p-6 italic text-slate-400 text-xs font-black uppercase tracking-widest">
                Loading Application...
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

