'use client'

import { createClient } from '@/utils/supabase/client';

/**
 * First-party event tracking into Supabase (analytics_events table).
 * Fire-and-forget: failures must never break the user experience,
 * so every error is swallowed (including the table not existing yet).
 */

const SESSION_KEY = 'rw_session_id';

function getSessionId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        let id = window.sessionStorage.getItem(SESSION_KEY);
        if (!id) {
            id = crypto.randomUUID();
            window.sessionStorage.setItem(SESSION_KEY, id);
        }
        return id;
    } catch {
        return null;
    }
}

export function track(
    eventName: string,
    properties: Record<string, string | number | boolean | null> = {}
): void {
    if (typeof window === 'undefined') return;
    try {
        const supabase = createClient();
        void supabase.auth.getUser().then(({ data }) =>
            supabase.from('analytics_events').insert({
                event_name: eventName,
                user_id: data.user?.id ?? null,
                session_id: getSessionId(),
                path: window.location.pathname,
                properties,
            })
        ).then(({ error }) => {
            if (error && process.env.NODE_ENV !== 'production') {
                console.warn('[analytics]', error.message);
            }
        });
    } catch {
        // Analytics must never throw into app code.
    }
}
