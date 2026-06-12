'use client'

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/utils/analytics';

/**
 * Tracks a page_view event on every route change.
 * Renders nothing; mounted once in the root layout.
 */
export default function AnalyticsTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname) track('page_view', { pathname });
    }, [pathname]);

    return null;
}
