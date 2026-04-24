"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SoftCard from '@/components/ui/SoftCard';

interface UploadHistory {
    file_id: number;
    file_name: string;
    file_log: string;
    file_type: string;
    file_size: number;
    file_time: string;
    username: string;
}

export default function Upload43FilePage() {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [history, setHistory] = useState<UploadHistory[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [user, setUser] = useState<{ role: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch('/telemedicine/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            }
        } catch (e) {}
    }, []);

    const fetchHistory = useCallback(async (p: number = 1) => {
        try {
            const res = await fetch(`/telemedicine/api/hdc/history?page=${p}`);
            if (res.ok) {
                const result = await res.json();
                setHistory(Array.isArray(result.data) ? result.data : []);
                setTotal(result.total || 0);
                setPage(result.page || 1);
            }
        } catch (e) {}
    }, []);

    useEffect(() => { 
        fetchUser();
        fetchHistory(1); 
    }, [fetchUser, fetchHistory]);

    const isValidFile = (f: File) => /^f43_.+\.zip$/i.test(f.name);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (!dropped) return;
        if (isValidFile(dropped)) {
            setFile(dropped);
            setResult(null);
        } else {
            setResult({ success: false, message: `ชื่อไฟล์ไม่ถูกต้อง: "${dropped.name}" — ต้องเป็น F43_XXX.ZIP` });
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        if (isValidFile(selected)) {
            setFile(selected);
            setResult(null);
        } else {
            setResult({ success: false, message: `ชื่อไฟล์ไม่ถูกต้อง: "${selected.name}" — ต้องเป็น F43_XXX.ZIP` });
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/telemedicine/api/hdc/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            setResult({ success: res.ok, message: data.message || data.error || 'เกิดข้อผิดพลาด' });
            if (res.ok) {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchHistory(1);
            }
        } catch (e: any) {
            setResult({ success: false, message: e.message || 'เกิดข้อผิดพลาด' });
        } finally {
            setUploading(false);
        }
    };

    const formatSize = (kb: number) => kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
    const formatDate = (dt: string) => new Date(dt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

    return (
        <div className="min-h-screen nm-bg">
            <Navbar showFilters={false} />

            <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
                {/* Header */}
                <SoftCard className="p-6 md:p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">ส่งข้อมูล 43 แฟ้ม</h1>
                            <p className="text-sm text-slate-500 mt-0.5">อัปโหลดไฟล์ ZIP</p>
                        </div>
                    </div>
                </SoftCard>

                {/* Drop Zone */}
                <SoftCard className="p-6 md:p-8">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-10 md:p-16 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 ${
                            isDragging
                                ? 'border-indigo-400 bg-indigo-50/60 scale-[1.01]'
                                : file
                                ? 'border-emerald-300 bg-emerald-50/40'
                                : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".zip"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {file ? (
                            <>
                                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-slate-800 text-lg">{file.name}</p>
                                    <p className="text-sm text-slate-500 mt-1">{formatSize(file.size / 1024)}</p>
                                </div>
                                <p className="text-xs text-slate-400">คลิกเพื่อเลือกไฟล์ใหม่</p>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-slate-700 text-lg">ลากไฟล์มาวางที่นี่</p>
                                    <p className="text-sm text-slate-400 mt-1">หรือคลิกเพื่อเลือกไฟล์ <span className="font-bold text-indigo-500">.zip</span></p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Result */}
                    {result && (
                        <div className={`mt-4 px-5 py-4 rounded-2xl flex items-center gap-3 ${result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {result.success
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                }
                            </svg>
                            <p className="font-bold text-sm">{result.message}</p>
                        </div>
                    )}

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className={`mt-5 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-3 ${
                            !file || uploading
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 active:scale-[0.98]'
                        }`}
                    >
                        {uploading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                กำลังประมวลผล...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                นำเข้าข้อมูล
                            </>
                        )}
                    </button>
                </SoftCard>

                {/* Upload History - Admin Only */}
                {user?.role === 'admin' && history.length > 0 && (
                    <SoftCard className="p-6 md:p-8">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ประวัติการอัปโหลด
                            </h2>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                ทั้งหมด {total} รายการ
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            {history.map((h) => (
                                <div key={h.file_id} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-50 hover:bg-indigo-50/40 transition-colors">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-slate-700 truncate">{h.file_name}</p>
                                        <p className="text-xs text-slate-400">{h.username} · {formatDate(h.file_time)}</p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 shrink-0">{formatSize(h.file_size)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {total > 10 && (
                            <div className="mt-6 flex items-center justify-center gap-4">
                                <button
                                    onClick={() => fetchHistory(page - 1)}
                                    disabled={page === 1}
                                    className={`p-2 rounded-xl transition-all ${page === 1 ? 'text-slate-200' : 'text-indigo-600 hover:bg-indigo-50 active:scale-95'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                    Page {page} of {Math.ceil(total / 10)}
                                </span>
                                <button
                                    onClick={() => fetchHistory(page + 1)}
                                    disabled={page * 10 >= total}
                                    className={`p-2 rounded-xl transition-all ${page * 10 >= total ? 'text-slate-200' : 'text-indigo-600 hover:bg-indigo-50 active:scale-95'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </SoftCard>
                )}
            </main>
        </div>
    );
}
