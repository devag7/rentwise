'use client'

import dynamic from 'next/dynamic';

const DashboardContent = dynamic(() => import('./DashboardContent'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center pt-24">
            <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-[#FF385C]"></div>
        </div>
    ),
});

export default function DashboardPage() {
    return <DashboardContent />;
}
