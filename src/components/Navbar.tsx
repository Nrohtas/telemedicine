"use client";

import React, { useState, useEffect } from 'react';
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

const Navbar = () => {
    const [fiscalYear, setFiscalYear] = useState('2568');
    const [district, setDistrict] = useState('6501');
    const [station, setStation] = useState('ทั้งหมด');
    const [districts, setDistricts] = useState<District[]>([]);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);

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

    const fiscalYearOptions = [
        { label: '2568', value: '2568' },
        { label: '2567', value: '2567' }
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
            <SoftCard className="px-8 py-4 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-nm-primary flex items-center justify-center text-white shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Telemedicine Dashboard</h1>
                        <p className="text-xs opacity-60">ระบบติดตามผลการดำเนินงาน Telemedicine</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Fiscal Year Filter */}
                    <SoftSelect
                        label="ปีงบประมาณ"
                        options={fiscalYearOptions}
                        value={fiscalYear}
                        onChange={setFiscalYear}
                        className="w-32"
                    />

                    {/* District Filter */}
                    <SoftSelect
                        label="อำเภอ"
                        options={districtOptions}
                        value={district}
                        onChange={setDistrict}
                        className="w-48"
                    />

                    {/* Health Station Filter */}
                    <SoftSelect
                        label="หน่วยบริการ"
                        options={stationOptions}
                        value={station}
                        onChange={setStation}
                        className="w-48"
                    />

                    <div className="mt-5">
                        <SoftButton variant="primary" className="px-6">
                            ค้นหา
                        </SoftButton>
                    </div>
                </div>
            </SoftCard>
        </nav>
    );
};

export default Navbar;
