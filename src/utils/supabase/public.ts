import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cookie-less client for public, cacheable reads (listings, index, area pages).
 * Pages that use it can be statically cached / ISR'd, unlike the cookie-bound
 * server client which forces every request to render dynamically.
 */
let client: SupabaseClient | null = null;

export function hasSupabaseEnv(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createPublicClient(): SupabaseClient {
    if (client) return client;
    client = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
        {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
                // Fail fast instead of hanging a page render when Supabase is unreachable.
                fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(8000) }),
            },
        }
    );
    return client;
}
