"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SoftCard from '@/components/ui/SoftCard';

export default function PendingPage() {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Use a prefix if applicable, here assuming standard /api path
                const res = await fetch('/telemedicine/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setIsLoading(false);
                    
                    if (data.status === 'active') {
                        // Success! redirect to admin
                        router.push('/admin');
                    }
                } else if (res.status === 401) {
                    // Session expired or not logged in properly
                    router.push('/login');
                }
            } catch (err) {
                console.error('Status check failed:', err);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [router]);

    const handleLogout = async () => {
        try {
            await fetch('/telemedicine/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (err) {
            window.location.href = '/login';
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-nm-primary/20 border-t-nm-primary rounded-full animate-spin" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">กำลังตรวจสอบชื่อตัวตน...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
            <div className="w-full max-w-lg animate-in fade-in zoom-in duration-700">
                <SoftCard className="p-12 relative overflow-hidden ring-4 ring-amber-50">
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 sm:block hidden" />
                    
                    <div className="relative z-10 space-y-10">
                        <div className="mx-auto w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 animate-pulse-slow">
                            <div className="p-4 bg-white rounded-full shadow-lg nm-flat-white text-amber-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">อยู่ระหว่างการตรวจสอบ</h1>
                            <div className="space-y-2">
                                <p className="text-lg font-bold text-slate-600">
                                    สวัสดีคุณ {user?.name || 'Loading...'}
                                </p>
                                <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium">
                                    บัญชีของคุณเข้าสู่ระบบสำเร็จแล้ว แต่ยังไม่ได้รับการอนุมัติสิทธิ์การเข้าถึงจากผู้ดูแลระบบหลัก (Super Admin)
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col gap-4 shadow-inner">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-4 px-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">หน่วยงานต้นสังกัด</span>
                                <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{user?.hname || 'ไม่พบข้อมูล'}</span>
                            </div>
                            <div className="h-px w-full bg-slate-100" />
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-4 px-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">สถานะสิทธิ์ปัจจุบัน</span>
                                <span className="px-5 py-1.5 bg-amber-500/10 text-amber-600 rounded-full font-black text-[10px] uppercase tracking-widest border border-amber-500/20">
                                    Pending Approval
                                </span>
                            </div>
                        </div>

                        <div className="pt-2 space-y-6">
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                                <p className="text-xs text-amber-600 font-black uppercase tracking-widest">
                                    ระบบจะนำคุณเข้าสู่ Dashboard ทันทีที่อนุมัติ
                                </p>
                            </div>
                            
                            <hr className="w-12 mx-auto border-slate-100" />

                            <button
                                onClick={handleLogout}
                                className="px-8 py-3 rounded-xl hover:bg-rose-50 text-rose-400 hover:text-rose-500 font-black text-xs transition-all uppercase tracking-[0.2em] border border-transparent hover:border-rose-100"
                            >
                                ออกจากระบบ
                            </button>
                        </div>
                    </div>
                </SoftCard>
                
                <p className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                    Provincial Public Health Office Dashboard
                </p>
            </div>
        </main>
    );
}
