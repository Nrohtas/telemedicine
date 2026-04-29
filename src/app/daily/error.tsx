'use client';

import { useEffect } from 'react';
import SoftCard from '@/components/ui/SoftCard';
import SoftButton from '@/components/ui/SoftButton';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Daily Dashboard Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <SoftCard className="max-w-md w-full p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">ขออภัย เกิดข้อผิดพลาด</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            ระบบไม่สามารถโหลดข้อมูลแดชบอร์ดได้ในขณะนี้
          </p>
        </div>

        {error.digest && (
          <div className="p-3 bg-slate-100 rounded-xl">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Error Digest</p>
            <p className="text-xs font-mono font-bold text-slate-600">{error.digest}</p>
          </div>
        )}

        <div className="pt-4 flex flex-col gap-3">
          <SoftButton
            variant="primary"
            onClick={() => reset()}
            className="w-full py-4 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>ลองใหม่อีกครั้ง</span>
          </SoftButton>
          
          <SoftButton
            variant="secondary"
            onClick={() => window.location.href = '/telemedicine'}
            className="w-full py-4"
          >
            กลับหน้าหลัก
          </SoftButton>
        </div>
      </SoftCard>
    </div>
  );
}
