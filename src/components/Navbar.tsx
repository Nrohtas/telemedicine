"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import SoftSelect from './ui/SoftSelect';

interface District {
    amp_code: string;
    amp_name: string;
}

interface Hospital {
    hospcode: string;
    hospname: string;
}

interface NavbarProps {
    selectedAffiliation?: string;
    onAffiliationChange?: (value: string) => void;
    selectedDistrict?: string;
    onDistrictChange?: (value: string) => void;
    selectedStation?: string;
    onStationChange?: (value: string) => void;
    selectedType?: string;
    onTypeChange?: (value: string) => void;
    showAllDistrict?: boolean;
    showFilters?: boolean;
    showSignOut?: boolean;
    onSignOut?: () => void;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    selectedSort?: string;
    onSortChange?: (value: string) => void;
}

const Navbar = ({
    selectedAffiliation,
    onAffiliationChange,
    selectedDistrict,
    onDistrictChange,
    selectedStation,
    onStationChange,
    selectedType,
    onTypeChange,
    showAllDistrict = true,
    showFilters = true,
    showSignOut = false,
    onSignOut,
    searchValue,
    onSearchChange,
    selectedSort,
    onSortChange
}: NavbarProps) => {
    const pathname = usePathname();
    const [fiscalYear, setFiscalYear] = useState('');
    const [month, setMonth] = useState('ทั้งหมด');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Internal state for backward compatibility
    const [internalDistrict, setInternalDistrict] = useState('เลือกอำเภอ');
    const [internalStation, setInternalStation] = useState('ทั้งหมด');

    // Use props if available, otherwise internal state
    const district = selectedDistrict !== undefined ? selectedDistrict : internalDistrict;
    const setDistrict = (val: string) => {
        setInternalDistrict(val);
        if (onDistrictChange) onDistrictChange(val);
    };

    const station = selectedStation !== undefined ? selectedStation : internalStation;
    const setStation = (val: string) => {
        setInternalStation(val);
        if (onStationChange) onStationChange(val);
    };
    const [districts, setDistricts] = useState<District[]>([]);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [fiscalYears, setFiscalYears] = useState<any[]>([]);
    const [months, setMonths] = useState<any[]>([]);
    const [affiliations, setAffiliations] = useState<string[]>([]);
    const [types, setTypes] = useState<string[]>([]);

    // Fetch hospital types on mount
    useEffect(() => {
        fetch('/telemedicine/api/hospital-types')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTypes(data);
                }
            })
            .catch(err => console.error('Failed to fetch hospital types:', err));
    }, []);

    // Fetch affiliations on mount
    useEffect(() => {
        fetch('/telemedicine/api/affiliations')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAffiliations(data);
                }
            })
            .catch(err => console.error('Failed to fetch affiliations:', err));
    }, []);

    // Fetch fiscal years on mount
    useEffect(() => {
        fetch('/telemedicine/api/fiscal-years')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setFiscalYears(data);
                    if (data.length > 0) {
                        setFiscalYear(data[0].b_year);
                    }
                }
            })
            .catch(err => console.error('Failed to fetch fiscal years:', err));
    }, []);

    // Fetch months on mount
    useEffect(() => {
        fetch('/telemedicine/api/months')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setMonths(data);
                }
            })
            .catch(err => console.error('Failed to fetch months:', err));
    }, []);

    // Fetch districts on mount
    useEffect(() => {
        fetch('/telemedicine/api/districts')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setDistricts(data);
                }
            })
            .catch(err => console.error('Failed to fetch districts:', err));
    }, []);

    // Fetch hospitals when district changes
    useEffect(() => {
        const url = district === 'ทั้งหมด'
            ? '/telemedicine/api/hospitals'
            : `/telemedicine/api/hospitals?amp_code=${district}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setHospitals(data);
                    setStation('ทั้งหมด'); // Reset station when district changes
                }
            })
            .catch(err => console.error('Failed to fetch hospitals:', err));
    }, [district]);

    const fiscalYearOptions = fiscalYears.map(y => ({ label: y.b_year, value: y.b_year }));

    const monthOptions = [
        { label: 'ทั้งหมด', value: 'ทั้งหมด' },
        ...months.map(m => ({ label: m.month_name, value: m.month_no }))
    ];

    const districtOptions = [
        { label: 'เลือกอำเภอ', value: 'เลือกอำเภอ' },
        ...(showAllDistrict ? [{ label: 'ทั้งหมด', value: 'ทั้งหมด' }] : []),
        ...districts.map(d => ({ label: d.amp_name, value: d.amp_code }))
    ];

    // Abbreviate hospital names
    const abbreviateHospName = (name: string): string => {
        return name
            .replace(/โรงพยาบาลส่งเสริมสุขภาพตำบล/g, 'รพ.สต.')
            .replace(/ศูนย์สุขภาพชุมชน/g, 'ศสช.')
            .replace(/ศูนย์สุขภาพเมือง/g, 'ศสม.')
            .replace(/โรงพยาบาล/g, 'รพ.');
    };

    const stationOptions = [
        { label: 'ทั้งหมด', value: 'ทั้งหมด' },
        ...hospitals.map(h => ({ label: abbreviateHospName(h.hospname), value: h.hospcode }))
    ];

    return (
        <nav className="p-3 md:p-6">
            <SoftCard className="px-4 md:px-8 py-5 md:py-6 flex flex-col gap-4">
                {/* Header Row: Brand and Desktop Navigation */}
                <div className="flex items-center justify-between gap-4 md:gap-6 border-b border-gray-100 pb-5">
                    {/* Brand Section */}
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                                src="/telemedicine/logo-moph.png"
                                alt="Ministry of Public Health Logo"
                                className="w-full h-full object-contain p-0.5"
                            />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-base md:text-lg lg:text-xl font-black text-purple-950 tracking-tight truncate leading-tight">สำนักงานสาธารณสุขจังหวัดพิษณุโลก</h1>
                            <p className="text-[10px] md:text-[11px] lg:text-[12px] font-black uppercase mt-0.5 tracking-widest md:tracking-[0.12em] whitespace-normal md:whitespace-nowrap drop-shadow-sm leading-snug">
                                <span className="text-gray-500">Dashboard</span> <span className="text-[#006837]">Telemedicine</span> <span className="text-gray-400 mx-1">:</span> <span className="text-[#00ADEF]">การแพทย์ทางไกล</span>
                            </p>
                        </div>
                    </div>

                    {/* Desktop Navigation Menu */}
                    <div className="hidden lg:flex items-center justify-end gap-2 lg:gap-3 shrink-0">
                        <Link href="/" className="hover:opacity-80 transition-opacity">
                            <SoftButton
                                variant="nav"
                                active={pathname === '/'}
                                className="flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>Dashboard</span>
                            </SoftButton>
                        </Link>
                        <Link href="/daily" className="hover:opacity-80 transition-opacity">
                            <SoftButton
                                variant="nav"
                                active={pathname === '/daily'}
                                className="flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3v18h18M7 15l3-3 3 2 5-7" />
                                </svg>
                                <span>Daily</span>
                            </SoftButton>
                        </Link>
                        <Link href="/remed" className="hover:opacity-80 transition-opacity">
                            <SoftButton
                                variant="nav"
                                active={pathname === '/remed'}
                                className="flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 20.5l10-10a4.243 4.243 0 00-6-6l-10 10a4.243 4.243 0 006 6zM8 11l5 5" />
                                </svg>
                                <span>REMED</span>
                            </SoftButton>
                        </Link>

                        <Link
                            href={`/hospital${district !== 'เลือกอำเภอ' && district !== 'ทั้งหมด' ? `?amp_code=${district}` : ''}`}
                            className="hover:opacity-80 transition-opacity"
                        >
                            <SoftButton
                                variant="nav"
                                active={pathname === '/hospital'}
                                className="flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>หน่วยบริการ</span>
                            </SoftButton>
                        </Link>

                        <Link href="/admin" className="hover:opacity-80 transition-opacity">
                            <SoftButton
                                variant="nav"
                                active={pathname.startsWith('/admin')}
                                className="flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>Admin</span>
                            </SoftButton>
                        </Link>

                        {showSignOut && (
                            <button
                                onClick={onSignOut}
                                className="group px-4 py-2 bg-indigo-50 text-indigo-400 hover:text-rose-500 hover:bg-rose-50 border border-indigo-100 hover:border-rose-100 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                Sign Out
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 group-hover:translate-x-1 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Toggle (Hamburger) */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2.5 nm-card rounded-xl text-nm-primary active:nm-inset transition-all"
                        aria-label="Toggle Menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu Content (Dropdown) */}
                {isMenuOpen && (
                    <div className="lg:hidden flex flex-col gap-3 py-4 border-b border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">
                        <Link href="/" onClick={() => setIsMenuOpen(false)}>
                            <SoftButton
                                variant="nav"
                                active={pathname === '/'}
                                className="flex items-center justify-center gap-3 w-full py-3"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span className="text-xs font-black uppercase tracking-widest">Dashboard</span>
                            </SoftButton>
                        </Link>
                        <Link href="/daily" onClick={() => setIsMenuOpen(false)}>
                            <SoftButton
                                variant="nav"
                                active={pathname === '/daily'}
                                className="flex items-center justify-center gap-3 w-full py-3"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3v18h18M7 15l3-3 3 2 5-7" />
                                </svg>
                                <span className="text-xs font-black uppercase tracking-widest">Daily</span>
                            </SoftButton>
                        </Link>
                        <Link href="/remed" onClick={() => setIsMenuOpen(false)}>
                            <SoftButton
                                variant="nav"
                                active={pathname === '/remed'}
                                className="flex items-center justify-center gap-3 w-full py-3"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 20.5l10-10a4.243 4.243 0 00-6-6l-10 10a4.243 4.243 0 006 6zM8 11l5 5" />
                                </svg>
                                <span className="text-xs font-black uppercase tracking-widest">REMED</span>
                            </SoftButton>
                        </Link>
                        <Link
                            href={`/hospital${district !== 'เลือกอำเภอ' && district !== 'ทั้งหมด' ? `?amp_code=${district}` : ''}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <SoftButton
                                variant="nav"
                                active={pathname === '/hospital'}
                                className="flex items-center justify-center gap-3 w-full py-3"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span className="text-xs font-black uppercase tracking-widest">หน่วยบริการ</span>
                            </SoftButton>
                        </Link>
                        <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                            <SoftButton
                                variant="nav"
                                active={pathname.startsWith('/admin')}
                                className="flex items-center justify-center gap-3 w-full py-3"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className="text-xs font-black uppercase tracking-widest">Admin</span>
                            </SoftButton>
                        </Link>
                        {showSignOut && (
                            <button
                                onClick={() => { onSignOut?.(); setIsMenuOpen(false); }}
                                className="flex items-center justify-center gap-3 w-full py-3 nm-card rounded-xl text-rose-500 font-black uppercase tracking-widest text-[10px] active:nm-inset transition-all mt-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out Account
                            </button>
                        )}
                    </div>
                )}

                {/* Filters Row */}
                {showFilters && (
                    <div className="flex flex-wrap items-center gap-3 md:gap-6 justify-center md:justify-end pt-4 border-t border-gray-100">
                        {/* Filters Group */}
                        <div className="flex flex-wrap items-center gap-2 md:gap-6 justify-center md:justify-end flex-1">
                            {/* Filter Groups Segmented into 2-Column Rows on Mobile */}
                            {pathname !== '/' && pathname !== '/kpi' && (
                                <div className="flex flex-col gap-4 w-full md:flex-row md:items-center md:gap-6 md:justify-end">
                                    {/* Group 1: Year & District */}
                                    <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto md:gap-6">
                                        {/* Fiscal Year Filter */}
                                        <div className="min-w-0 md:min-w-[140px]">
                                            <SoftSelect
                                                label={
                                                    <div className="flex items-center gap-1.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>ปีงบประมาณ</span>
                                                    </div>
                                                }
                                                options={fiscalYearOptions}
                                                value={fiscalYear}
                                                onChange={setFiscalYear}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* District Filter */}
                                        <div className="min-w-0 md:min-w-[180px]">
                                            <SoftSelect
                                                label={
                                                    <div className="flex items-center gap-1.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span>อำเภอ</span>
                                                    </div>
                                                }
                                                options={districtOptions}
                                                value={district}
                                                onChange={setDistrict}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Group 2: Type & Affiliation */}
                                    <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto md:gap-6">
                                        {/* Type Filter */}
                                        <div className="min-w-0 md:min-w-[180px]">
                                            <SoftSelect
                                                label={
                                                    <div className="flex items-center gap-1.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                        </svg>
                                                        <span>ประเภท</span>
                                                    </div>
                                                }
                                                options={[
                                                    { label: 'ทั้งหมด', value: 'ทั้งหมด' },
                                                    ...types.map(t => ({ label: t, value: t }))
                                                ]}
                                                value={selectedType || 'ทั้งหมด'}
                                                onChange={onTypeChange || (() => { })}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Affiliation Filter */}
                                        <div className="min-w-0 md:min-w-[180px]">
                                            <SoftSelect
                                                label={
                                                    <div className="flex items-center gap-1.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        <span>สังกัด</span>
                                                    </div>
                                                }
                                                options={[
                                                    { label: 'ทั้งหมด', value: 'ทั้งหมด' },
                                                    ...affiliations.map(a => ({ label: a, value: a }))
                                                ]}
                                                value={selectedAffiliation || 'ทั้งหมด'}
                                                onChange={onAffiliationChange || (() => { })}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Group 3: Sort & Search */}
                                    <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto md:gap-6">
                                        {/* Sort Filter */}
                                        <div className="min-w-0 md:min-w-[150px]">
                                            <SoftSelect
                                                label={
                                                    <div className="flex items-center gap-1.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                                        </svg>
                                                        <span>เรียงลำดับ</span>
                                                    </div>
                                                }
                                                options={[
                                                    { label: 'รหัสหน่วยบริการ', value: 'hospcode' },
                                                    { label: 'เป้าหมาย', value: 'target' },
                                                    { label: 'ยอดรวม', value: 'total' },
                                                    { label: '% (ผลงาน)', value: 'percent' },
                                                    { label: 'ขาดอีก', value: 'gap' },
                                                ]}
                                                value={selectedSort || 'percent'}
                                                onChange={onSortChange || (() => { })}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Search Box */}
                                        <div className="flex flex-col gap-1 relative group w-full md:w-28">
                                            <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 px-2 transition-opacity group-focus-within:opacity-80 flex items-center gap-1.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <span>ค้นหา</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="ค้นหา..."
                                                    value={searchValue || ''}
                                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                                    className="w-full px-4 py-2 bg-transparent nm-card rounded-xl text-sm font-bold text-nm-primary placeholder:text-nm-primary/20 outline-none transition-all focus:nm-inset h-[38px]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </SoftCard>
        </nav>
    );
};

export default Navbar;
