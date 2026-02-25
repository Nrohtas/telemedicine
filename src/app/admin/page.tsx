"use client";

import React, { useState, useEffect, useRef } from 'react';
import SoftCard from '@/components/ui/SoftCard';
import SoftButton from '@/components/ui/SoftButton';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatThaiDate, formatThaiDateOnly, formatThaiDateNumeric } from '@/utils/date';
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
            const res = await fetch('/telemedicine/api/admin/upload', {
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
                    <p className="text-slate-600 text-[11px] font-bold uppercase tracking-[0.3em]">Telemedicine Phitsanulok</p>
                </div>
            </div>

            <div className="w-full space-y-3 pt-2">
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative w-full py-4 px-6 border-2 border-dashed border-slate-300 rounded-[1.5rem] text-[10px] font-black flex flex-col items-center justify-center gap-2 text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all duration-300 min-h-[100px] shadow-sm hover:shadow-indigo-100`}
                >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-indigo-600 shadow-inner overflow-hidden transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </div>
                    <span className="text-xs tracking-tight truncate max-w-full">{file ? file.name : 'เลือกไฟล์ข้อมูล .xlsx, .xls'}</span>
                </motion.button>
                <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />

                <SoftButton
                    variant="none"
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="w-full py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 shadow-lg shadow-indigo-100/50 transition-all duration-300 disabled:bg-slate-50 disabled:text-slate-300 disabled:shadow-none border border-indigo-200/50"
                >
                    {isUploading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span>Upload Confirm</span>
                        </>
                    )}
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
            const res = await fetch('/telemedicine/api/admin/history');
            const data = await res.json();
            if (data.success) {
                setHistory(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch history');
        }
    };


    return (
        <main className="min-h-screen bg-background font-sans relative overflow-hidden pb-12">
            <Navbar
                showFilters={false}
                showSignOut={true}
                onSignOut={() => {
                    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                    window.location.href = '/telemedicine/login';
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
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] shrink-0">Upload History</h3>
                        <div className="h-px w-full bg-slate-200"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {history.length > 0 ? (
                            history.slice(0, 5).map((item, idx) => (
                                <motion.div
                                    key={item.file_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center justify-between p-6 bg-white border border-slate-50 rounded-[2rem] hover:shadow-2xl hover:shadow-slate-100 transition-all group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center transition-all group-hover:bg-emerald-500 group-hover:text-white shadow-sm`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <path d="M8 13h2" />
                                                <path d="M8 17h2" />
                                                <path d="M14 13h2" />
                                                <path d="M14 17h2" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <p className="text-slate-900 font-black text-sm">{item.file_name}</p>
                                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest">
                                                    {item.file_log || 'Telemedicine'}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-widest">
                                                By {item.username} &gt; {(item.file_size).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-900 font-bold text-sm tracking-tight">{formatThaiDate(item.file_time)}</p>
                                        <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest mt-1 flex items-center justify-end gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Synced
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-20 text-center bg-slate-50/50 border-2 border-dashed border-slate-300 rounded-[3rem]">
                                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">No recent data streams</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Updates Manager Section */}
                <SystemUpdatesManager />

                <Footer />
            </div>
        </main>
    );
}

// SystemUpdatesManager Component
const SystemUpdatesManager = () => {
    const [updates, setUpdates] = useState<any[]>([]);
    const [date, setDate] = useState('');
    const dateInputRef = useRef<HTMLInputElement>(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchUpdates = async () => {
        try {
            const res = await fetch('/telemedicine/api/updates');
            const data = await res.json();
            if (Array.isArray(data)) {
                setUpdates(data);
            }
        } catch (error) {
            console.error('Failed to fetch updates:', error);
        }
    };

    useEffect(() => {
        fetchUpdates();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            // Generate version from date: "2026-02-22" -> "V20260222"
            const version = `V${date.replace(/-/g, '')}`;

            const res = await fetch('/telemedicine/api/updates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, description, version })
            });
            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', text: 'บันทึกรายการอัปเดตเรียบร้อยแล้ว' });
                setDate('');
                setDescription('');
                fetchUpdates();
            } else {
                setStatus({ type: 'error', text: data.error || 'Failed to save update' });
            }
        } catch (error) {
            setStatus({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) return;

        try {
            const res = await fetch(`/telemedicine/api/updates?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchUpdates();
            } else {
                alert('เกิดข้อผิดพลาดในการลบรายการ');
            }
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    return (
        <SoftCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 7v6m-3-3h6" />
                </svg>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">System Update</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {status && (
                    <div className={`p-4 rounded-xl text-sm font-bold ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {status.text}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Date (วัน/เดือน/ปี)</label>
                    <div className="relative">
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none z-[-1]"
                        />
                        <div
                            onClick={() => {
                                try {
                                    dateInputRef.current?.showPicker();
                                } catch (err) {
                                    dateInputRef.current?.focus();
                                }
                            }}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-sm flex items-center justify-between cursor-pointer hover:border-purple-500 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all"
                        >
                            <span className={date ? 'text-slate-700' : 'text-slate-400'}>
                                {date ? date.split('-').reverse().join('/') : 'DD / MM / YYYY'}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={3}
                        placeholder="Update description..."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-700 shadow-sm resize-y"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-400 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    {isSubmitting ? 'Saving...' : 'Save Update'}
                </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-800 tracking-tight mb-4">Update List</h3>

                <div className="space-y-3">
                    {updates.length > 0 ? (
                        updates.slice(0, 5).map((upd) => (
                            <div key={upd.update_id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-purple-800">{formatThaiDateNumeric(upd.update_date)}</p>
                                        {upd.update_version && (
                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                                                {upd.update_version}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">{upd.update_description}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(upd.update_id)}
                                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-4 shrink-0"
                                    title="Delete update"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-xl">ไม่มีรายการอัปเดต</p>
                    )}
                </div>
            </div>
        </SoftCard>
    );
};
