"use client";

import React, { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface MonthOption {
  value: string;
  label: string;
}

interface RemedMonthFilterProps {
  months: MonthOption[];
  activeMonth: string;
}

export default function RemedMonthFilter({ months, activeMonth }: RemedMonthFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'ทั้งหมด') {
        params.delete('month');
        params.set('all', 'true');
      } else if (value === 'ล่าสุด') {
        params.delete('month');
        params.delete('all');
      } else {
        params.delete('all');
        params.set('month', value);
      }
      
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className={`rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition-opacity duration-300 ${isPending ? 'opacity-60' : 'opacity-100'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-nm-primary border border-purple-100/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 leading-tight">ตัวเลือกกรองรายเดือน</h2>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">เลือกช่วงเวลาเพื่อแสดงผลข้อมูลรายวัน</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/50 self-start sm:self-auto">
          {months.map((m) => {
            const isActive = activeMonth === m.value;
            return (
              <button
                key={m.value}
                onClick={() => handleSelect(m.value)}
                disabled={isPending}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-nm-primary text-white shadow-sm scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 disabled:opacity-50'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
