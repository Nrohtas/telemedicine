"use client";

import React, { useState, useRef, useEffect } from 'react';

interface Option {
    label: string;
    value: string;
}

interface SoftSelectProps {
    label?: React.ReactNode;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SoftSelect({ label, options, value, onChange, placeholder = "เลือก...", className = "" }: SoftSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className={`flex flex-col gap-1 relative ${className}`} ref={dropdownRef}>
            {label && <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 px-2">{label}</label>}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`bg-transparent nm-card rounded-xl px-4 py-2 text-sm cursor-pointer flex items-center justify-between min-w-[140px] transition-all duration-300 ${isOpen ? 'nm-inset' : ''}`}
            >
                <span className={`truncate ${!selectedOption ? 'opacity-50' : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 opacity-50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* Dropdown Menu */}
            <div
                className={`absolute top-full left-0 w-full mt-2 bg-background nm-card rounded-xl z-50 overflow-hidden transition-all duration-300 origin-top ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}
            >
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors duration-200 ${option.value === value
                                ? 'bg-nm-primary text-white shadow-sm'
                                : 'hover:bg-nm-primary/10 text-foreground'
                                }`}
                        >
                            {option.label}
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className="px-3 py-2 text-xs opacity-50 text-center">ไม่มีข้อมูล</div>
                    )}
                </div>
            </div>

        </div>
    );
}
