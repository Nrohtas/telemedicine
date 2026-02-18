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
}

const Navbar = ({
    selectedAffiliation,
    onAffiliationChange,
    selectedDistrict,
    onDistrictChange,
    selectedStation,
    onStationChange,
    selectedType,
    onTypeChange
}: NavbarProps) => {
    const pathname = usePathname();
    const [fiscalYear, setFiscalYear] = useState('');
    const [month, setMonth] = useState('ทั้งหมด');

    // Internal state for backward compatibility
    const [internalDistrict, setInternalDistrict] = useState('6501');
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
        { label: 'ทั้งหมด', value: 'ทั้งหมด' },
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
                {/* Header Row */}
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-nm-primary flex items-center justify-center text-white shadow-lg nm-flat-nm-primary-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black text-foreground tracking-tight">สำนักงานสาธารณสุขจังหวัดพิษณุโลก</h1>
                        <p className="text-[14px] opacity-60 font-bold tracking-[0.14em] uppercase">Dashboard Telemedicine : การแพทย์ทางไกล</p>
                    </div>
                </div>

                {/* Navigation and Filters Row */}
                <div className="flex flex-wrap items-center justify-between gap-8">
                    {/* Left: Navigation */}
                    <div className="flex items-center gap-3">
                        <a href="/" className="hover:opacity-80 transition-opacity">
                            <SoftButton
                                variant="nav"
                                active={pathname === '/'}
                            >
                                Dashboard
                            </SoftButton>
                        </a>
                        <a href="/hospital" className="hover:opacity-80 transition-opacity">
                            <SoftButton
                                variant="nav"
                                active={pathname === '/hospital'}
                            >
                                รายชื่อหน่วยบริการ
                            </SoftButton>
                        </a>
                        <SoftButton active={false} className="opacity-40 cursor-not-allowed">สถิติรวม</SoftButton>
                    </div>

                    {/* Right: Filters */}
                    <div className="flex flex-wrap items-center gap-6 flex-1 justify-end">
                        {/* Fiscal Year Filter */}
                        <div className="min-w-[120px]">
                            <SoftSelect
                                label="ปีงบประมาณ"
                                options={fiscalYearOptions}
                                value={fiscalYear}
                                onChange={setFiscalYear}
                                className="w-full"
                            />
                        </div>

                        {/* Month Filter */}
                        <div className="min-w-[150px]">
                            <SoftSelect
                                label="เดือน"
                                options={monthOptions}
                                value={month}
                                onChange={setMonth}
                                className="w-full"
                            />
                        </div>

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

                        {/* Type Filter */}
                        <div className="min-w-[180px]">
                            <SoftSelect
                                label="ประเภท"
                                options={[
                                    { label: 'ทั้งหมด', value: 'ทั้งหมด' },
                                    ...(types || []).map(t => ({ label: t, value: t }))
                                ]}
                                value={selectedType || 'ทั้งหมด'}
                                onChange={onTypeChange || (() => { })}
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

                    </div>
                </div>
            </SoftCard>
        </nav>
    );
};

export default Navbar;
