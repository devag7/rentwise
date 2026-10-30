'use client'

import dynamic from 'next/dynamic';

const DashboardContent = dynamic(() => import('./DashboardContent'), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-dvh items-center justify-center bg-surface-2 pt-24" role="status" aria-label="Loading">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-fill-strong border-t-label-2" />
        </div>
    ),
});

export default function DashboardPage() {
    return <DashboardContent />;
}
