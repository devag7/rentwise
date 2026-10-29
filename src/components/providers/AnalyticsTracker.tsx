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
        if (!pathname) return;
        // Campaign tags (e.g. ?utm_source=alert from alert emails) so clicks can be attributed.
        const params = new URLSearchParams(window.location.search);
        const props: Record<string, string> = { pathname };
        for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
            const v = params.get(key);
            if (v) props[key] = v.slice(0, 64);
        }
        track('page_view', props);
    }, [pathname]);

    return null;
}
