"use client";

import React, { useState, useEffect, useRef } from 'react';
import SoftCard from '@/components/ui/SoftCard';
import SoftButton from '@/components/ui/SoftButton';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadHistory {
    file_id: number;
    file_name: string;
    file_size: number;
    file_time: string;
    username: string;
    file_log: string;
}

const TelemedicineUpload = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'Telemedicine');

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setStatus({ type: 'success', message: `นำเข้าข้อมูลสำเร็จ ${data.count} รายการ` });
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                onUploadSuccess();
            } else {
                setStatus({ type: 'error', message: data.error || 'การอัปโหลดล้มเหลว' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <SoftCard className="p-6 flex flex-col items-center text-center space-y-5 max-w-sm mx-auto border-none shadow-xl shadow-indigo-100/30 rounded-[2rem] bg-white relative overflow-hidden">
            {/* Background Decorative Blob */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />

            <div className="flex flex-col items-center space-y-4 w-full">
                <div className="flex items-center gap-4">
                    {/* Mohpromt Station Logo */}
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-12 h-12 flex items-center justify-center p-2 bg-white rounded-xl shadow-lg shadow-emerald-100 border border-emerald-50"
                    >
                        <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="22" r="14" fill="#006837" />
                            <path d="M25 40H75V75C75 80 71 84 66 84H34C29 84 25 80 25 75V40Z" stroke="#F6D76E" strokeWidth="10" />
                            <rect x="40" y="52" width="20" height="7" fill="#A5A7AA" />
                            <rect x="46.5" y="46" width="7" height="19" fill="#A5A7AA" />
                        </svg>
                    </motion.div>

                    <div className="w-px h-8 bg-slate-100" />

                    {/* SON.Buddy Logo */}
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        className="w-12 h-12 flex items-center justify-center p-2 bg-white rounded-xl shadow-lg shadow-sky-100 border border-sky-50"
                    >
                        <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 45L50 15L90 45" stroke="#00ADEF" strokeWidth="12" strokeLinecap="round" />
                            <rect x="40" y="32" width="20" height="7" fill="#A5A7AA" />
                            <rect x="46.5" y="26" width="7" height="19" fill="#A5A7AA" />
                            <path d="M25 55C25 55 25 85 50 85C75 85 75 60 75 60" stroke="#F6D76E" strokeWidth="10" fill="none" strokeLinecap="round" />
                            <circle cx="75" cy="62" r="8" fill="#0060A9" />
                        </svg>
                    </motion.div>
                </div>

                <div className="space-y-1">
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em]">Telemedicine Phitsanulok</p>
                </div>
            </div>

            <div className="w-full space-y-3 pt-2">
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative w-full py-4 px-6 border-2 border-dashed border-slate-100 rounded-[1.5rem] text-[10px] font-black flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all duration-300 min-h-[100px] shadow-sm hover:shadow-indigo-100`}
                >
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:text-indigo-500 shadow-inner overflow-hidden transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </div>
                    <span className="text-xs tracking-tight truncate max-w-full">{file ? file.name : 'เลือกไฟล์ข้อมูล .xlsx, .xls'}</span>
                </motion.button>
                <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />

                <SoftButton
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="w-full py-4 rounded-[1.5rem] text-white font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-indigo-100"
                >
                    <span className="flex items-center justify-center gap-2">
                        {isUploading ? (
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                        {isUploading ? 'ส่งข้อมูล...' : 'ยืนยันข้อมูล'}
                    </span>
                </SoftButton>
            </div>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`w-full p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md ${status.type === 'success'
                            ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100/50'
                            : 'bg-rose-50 text-rose-600 shadow-rose-100/50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {status.message}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </SoftCard>
    );
};

export default function AdminPage() {
    const [history, setHistory] = useState<UploadHistory[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/admin/history');
            const data = await res.json();
            if (data.success) {
                setHistory(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch history');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <main className="min-h-screen bg-background font-sans relative overflow-hidden pb-12">
            <Navbar
                showFilters={false}
                showSignOut={true}
                onSignOut={() => {
                    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                    window.location.href = '/login';
                }}
            />

            {/* Background Decorative Blobs to match main dashboard feel */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/30 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-50/30 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-4xl mx-auto space-y-24 relative z-10 pt-12">

                {/* Single Telemedicine Upload Card */}
                <TelemedicineUpload onUploadSuccess={fetchHistory} />

                {/* Activities / History Section */}
                <div className="space-y-12">
                    <div className="flex items-center gap-8">
                        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] shrink-0">Upload History</h3>
                        <div className="h-px w-full bg-slate-100"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {history.length > 0 ? (
                            history.map((item, idx) => (
                                <motion.div
                                    key={item.file_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center justify-between p-6 bg-white border border-slate-50 rounded-[2rem] hover:shadow-2xl hover:shadow-slate-100 transition-all group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center transition-all group-hover:bg-indigo-600 group-hover:text-white`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <p className="text-slate-900 font-black text-sm">{item.file_name}</p>
                                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-400 text-[8px] font-black uppercase tracking-widest">
                                                    {item.file_log || 'Telemedicine'}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">
                                                By {item.username} • {(item.file_size).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-900 font-bold text-sm tracking-tight">{formatDate(item.file_time)}</p>
                                        <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest mt-1 flex items-center justify-end gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Synced
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-20 text-center bg-slate-50/30 border-2 border-dashed border-slate-100 rounded-[3rem]">
                                <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[10px]">No recent data streams</p>
                            </div>
                        )}
                    </div>
                </div>

                <Footer />
            </div>
        </main>
    );
}
