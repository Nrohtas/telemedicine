"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SoftButton from './ui/SoftButton';

const AdminSubNavbar = () => {
    const pathname = usePathname();

    return (
        <div className="flex items-center justify-center gap-3 mb-8">
            <Link href="/admin">
                <SoftButton
                    variant="nav"
                    active={pathname === '/admin'}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Upload & Updates</span>
                </SoftButton>
            </Link>
            <Link href="/admin/users">
                <SoftButton
                    variant="nav"
                    active={pathname === '/admin/users'}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>User Management</span>
                </SoftButton>
            </Link>
        </div>
    );
};

export default AdminSubNavbar;
