"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
    onSearchChange
}: NavbarProps) => {
    const pathname = usePathname();
    const [fiscalYear, setFiscalYear] = useState('');
    const [month, setMonth] = useState('ทั้งหมด');

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
        fetch('/api/hospital-types')
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
        fetch('/api/affiliations')
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
        fetch('/api/fiscal-years')
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
        fetch('/api/months')
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
        fetch('/api/districts')
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
            ? '/api/hospitals'
            : `/api/hospitals?amp_code=${district}`;

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
        <nav className="p-6">
            <SoftCard className="px-8 py-6 flex flex-col gap-8">
                {/* Header and Navigation Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
                    {/* Brand Section */}
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg shrink-0 overflow-hidden border-2 border-green-700/20">
                            <img
                                src="/logo-moph.png"
                                alt="Ministry of Public Health Logo"
                                className="w-full h-full object-contain p-0.5"
                            />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black text-purple-950 tracking-tight">สำนักงานสาธารณสุขจังหวัดพิษณุโลก</h1>
                            <p className="text-[13px] font-black uppercase mt-1 tracking-[0.12em] whitespace-nowrap drop-shadow-sm">
                                <span className="text-gray-500">Dashboard</span> <span className="text-[#006837]">Telemedicine</span> <span className="text-gray-400 mx-1">:</span> <span className="text-[#00ADEF]">การแพทย์ทางไกล</span>
                            </p>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <div className="flex flex-wrap items-center gap-3 ml-auto">
                        <a href="/" className="hover:opacity-80 transition-opacity">
                            <SoftButton
                                variant="nav"
                                active={pathname === '/'}
                            >
                                Dashboard
                            </SoftButton>
                        </a>
                        <a
                            href={`/hospital${district !== 'เลือกอำเภอ' && district !== 'ทั้งหมด' ? `?amp_code=${district}` : ''}`}
                            className="hover:opacity-80 transition-opacity"
                        >
                            <SoftButton
                                variant="nav"
                                active={pathname === '/hospital'}
                            >
                                หน่วยบริการ
                            </SoftButton>
                        </a>
                        <a href="/admin" className="hover:opacity-80 transition-opacity">
                            <SoftButton
                                variant="nav"
                                active={pathname.startsWith('/admin')}
                            >
                                Admin
                            </SoftButton>
                        </a>

                        {showSignOut && (
                            <button
                                onClick={onSignOut}
                                className="group px-4 py-2 bg-indigo-50 text-indigo-400 hover:text-rose-500 hover:bg-rose-50 border border-indigo-100 hover:border-rose-100 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] transition-all flex items-center gap-2 active:scale-95 ml-2"
                            >
                                Sign Out
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters Row */}
                {showFilters && (
                    <div className="flex flex-wrap items-center gap-6 justify-end">
                        {/* Fiscal Year Filter */}
                        <div className="min-w-[140px]">
                            <SoftSelect
                                label="ปีงบประมาณ"
                                options={fiscalYearOptions}
                                value={fiscalYear}
                                onChange={setFiscalYear}
                                className="w-full"
                            />
                        </div>

                        {/* Month Filter - Hide on / and /hospital */}
                        {pathname !== '/' && pathname !== '/hospital' && (
                            <div className="min-w-[150px]">
                                <SoftSelect
                                    label="เดือน"
                                    options={monthOptions}
                                    value={month}
                                    onChange={setMonth}
                                    className="w-full"
                                />
                            </div>
                        )}

                        {pathname !== '/' && (
                            <>
                                {/* District Filter */}
                                <div className="min-w-[180px]">
                                    <SoftSelect
                                        label="อำเภอ"
                                        options={districtOptions}
                                        value={district}
                                        onChange={setDistrict}
                                        className="w-full"
                                    />
                                </div>

                                {/* Type Filter */}
                                <div className="min-w-[180px]">
                                    <SoftSelect
                                        label="ประเภท"
                                        options={[
                                            { label: 'ทั้งหมด', value: 'ทั้งหมด' },
                                            ...types.map(t => ({ label: t, value: t }))
                                        ]}
                                        value={selectedType || 'ทั้งหมด'}
                                        onChange={onTypeChange || (() => { })}
                                        className="w-full"
                                    />
                                </div>

                                {/* Health Station Filter */}
                                <div className="min-w-[220px]">
                                    <SoftSelect
                                        label="หน่วยบริการ"
                                        options={stationOptions}
                                        value={station}
                                        onChange={setStation}
                                        className="w-full"
                                    />
                                </div>

                                {/* Affiliation Filter */}
                                <div className="min-w-[180px]">
                                    <SoftSelect
                                        label="สังกัด"
                                        options={[
                                            { label: 'ทั้งหมด', value: 'ทั้งหมด' },
                                            ...affiliations.map(a => ({ label: a, value: a }))
                                        ]}
                                        value={selectedAffiliation || 'ทั้งหมด'}
                                        onChange={onAffiliationChange || (() => { })}
                                        className="w-full"
                                    />
                                </div>

                                {/* Search Box */}
                                <div className="min-w-[120px] flex flex-col gap-1 relative group">
                                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-50 px-2 transition-opacity group-focus-within:opacity-80">ค้นหาหน่วยบริการ</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-nm-primary opacity-30 group-focus-within:opacity-60 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="ค้นหา..."
                                            value={searchValue || ''}
                                            onChange={(e) => onSearchChange?.(e.target.value)}
                                            className="w-full pl-11 pr-4 py-2 bg-transparent nm-card rounded-xl text-sm font-bold text-nm-primary placeholder:text-nm-primary/20 outline-none transition-all focus:nm-inset"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </SoftCard>
        </nav>
    );
};

export default Navbar;
