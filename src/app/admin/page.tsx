"use client";

import React, { useState } from 'react';
import SoftCard from '@/components/ui/SoftCard';
import SoftButton from '@/components/ui/SoftButton';

export default function AdminPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setStatus({ type: 'error', message: 'Please select a file first.' });
            return;
        }

        setIsUploading(true);
        setStatus({ type: 'info', message: 'Uploading and processing...' });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', message: `Successfully imported ${data.count} records!` });
                setFile(null);
                // Reset file input
                const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            } else {
                setStatus({ type: 'error', message: data.error || 'Upload failed. Check file format.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'An error occurred during upload.' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background p-6 pt-12">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Admin Dashboard</h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Data Management & Excel Upload</p>
                    </div>
                    <SoftButton
                        variant="secondary"
                        onClick={() => {
                            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                            window.location.href = '/login';
                        }}
                        className="nm-flat-gray-100/50 text-gray-400 hover:text-red-500"
                    >
                        Sign Out
                    </SoftButton>
                </div>

                <div className="grid grid-cols-1 gap-10">
                    <SoftCard className="p-10 space-y-8">
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-nm-primary/10 flex items-center justify-center text-nm-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Upload Telemedicine Data</h2>
                                <p className="text-gray-400 text-sm font-medium">Supported formats: .xlsx, .xls</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <label
                                    htmlFor="excel-upload"
                                    className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${file
                                            ? 'border-nm-primary/40 bg-nm-primary/5'
                                            : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-nm-primary/20'
                                        }`}
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {file ? (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-nm-primary/20 flex items-center justify-center text-nm-primary mb-4 shadow-inner">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <p className="text-nm-primary font-bold text-lg">{file.name}</p>
                                                <p className="text-nm-primary/60 text-sm mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-gray-300 mb-4 group-hover:text-nm-primary/30 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="mb-2 text-gray-500 font-bold uppercase tracking-wide text-sm">Click to upload or drag and drop</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        id="excel-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>

                            {status && (
                                <div className={`p-5 rounded-2xl text-sm font-bold flex items-center gap-4 animate-in fade-in zoom-in duration-300 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                                        status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                                            'bg-blue-50 text-blue-700 border border-blue-100'
                                    }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${status.type === 'success' ? 'bg-green-100' :
                                            status.type === 'error' ? 'bg-red-100' :
                                                'bg-blue-100'
                                        }`}>
                                        {status.type === 'success' ? '✓' : status.type === 'error' ? '!' : 'i'}
                                    </div>
                                    {status.message}
                                </div>
                            )}

                            <SoftButton
                                onClick={handleUpload}
                                disabled={isUploading || !file}
                                className={`w-full py-5 text-lg font-black uppercase tracking-widest shadow-xl transition-all ${isUploading || !file
                                        ? 'opacity-50 cursor-not-allowed grayscale'
                                        : 'nm-flat-nm-primary hover:nm-convex-nm-primary active:nm-concave-nm-primary'
                                    }`}
                            >
                                {isUploading ? 'Processing File...' : 'Sync Database'}
                            </SoftButton>
                        </div>
                    </SoftCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SoftCard className="p-8 space-y-4 bg-white/30 backdrop-blur-sm border-white/40">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Required Columns</h3>
                            <ul className="space-y-3">
                                {['id', 'hospcode', 'b_year', 'moph', 'buddycare', 'result'].map(col => (
                                    <li key={col} className="flex items-center gap-3 text-foreground font-bold italic">
                                        <span className="w-2 h-2 rounded-full bg-nm-primary/30"></span>
                                        {col}
                                    </li>
                                ))}
                            </ul>
                        </SoftCard>
                        <SoftCard className="p-8 space-y-4 bg-white/30 backdrop-blur-sm border-white/40">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Upload Tips</h3>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                Ensure your Excel file contains headers that match the required column names exactly. System will automatically update existing records based on <strong>id</strong> and <strong>hospcode</strong>.
                            </p>
                        </SoftCard>
                    </div>
                </div>
            </div>
        </main>
    );
}
