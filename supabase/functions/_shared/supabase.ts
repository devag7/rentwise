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
 * verify_jwt = true only proves the bearer is *a* valid project JWT — the
 * public anon key passes that check too. Pipeline functions (which spend
 * Apify credits / send email) additionally require the service_role claim.
 * Returns null when allowed, or a 401 Response.
 */
export function requireServiceRole(req: Request): Response | null {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (token && serviceKey && token === serviceKey) return null;

    // Gateway has already verified the signature (verify_jwt = true); read the role claim.
    const parts = token.split('.');
    if (parts.length === 3) {
        try {
            const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
            if (payload?.role === 'service_role') return null;
        } catch {
            // fall through
        }
    }
    return new Response(JSON.stringify({ error: 'service role required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
    });
}
