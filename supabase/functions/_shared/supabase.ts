import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

let admin: SupabaseClient | null = null;

/**
 * Service-role client. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected
 * into every Edge Function by Supabase; no secret needs to be set for them.
 * Bypasses RLS — only use for server-side work with fixed, validated filters.
 */
export function adminClient(): SupabaseClient {
    if (admin) return admin;
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
    admin = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    return admin;
}

/**
 * Pipeline functions (which spend Apify credits / send email) are deployed
 * with verify_jwt = false and gate themselves here: the caller must present
 * the shared CRON_SECRET (pg_cron) or the exact service role key. JWT claims
 * are NOT trusted on their own, since the gateway doesn't verify them.
 * Returns null when allowed, or a 401 Response.
 */
export function requireServiceRole(req: Request): Response | null {
    // pg_cron calls pass a shared secret (stored in Vault + Edge Function
    // secrets) so the service role key never has to leave Supabase.
    const cronSecret = Deno.env.get('CRON_SECRET') ?? '';
    const given = req.headers.get('x-cron-secret') ?? '';
    if (cronSecret.length >= 32 && given.length === cronSecret.length) {
        let diff = 0;
        for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ cronSecret.charCodeAt(i);
        if (diff === 0) return null;
    }

    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (token && serviceKey && token === serviceKey) return null;

    return new Response(JSON.stringify({ error: 'service role required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
    });
}
