import { NextResponse } from 'next/server';
import { createPublicClient, hasSupabaseEnv } from '@/utils/supabase/public';

export const dynamic = 'force-dynamic';

/** Syncs run every 12 hours; past this, a sync has failed at least twice in a row. */
const STALE_AFTER_HOURS = 36;

/** When the newest listing was last seen by a sync. Never throws. */
async function listingFreshness() {
    if (!hasSupabaseEnv()) return null;
    try {
        const { data, error } = await createPublicClient()
            .from('properties')
            .select('scraped_at')
            .not('scraped_at', 'is', null)
            .order('scraped_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error || !data?.scraped_at) return null;
        const hours = (Date.now() - new Date(data.scraped_at).getTime()) / 3_600_000;
        return { last_seen: data.scraped_at as string, hours_ago: Math.round(hours), fresh: hours <= STALE_AFTER_HOURS };
    } catch {
        return null;
    }
}

/**
 * Liveness probe for uptime monitors. `status` stays "ok" while the server can
 * handle requests; `listings.fresh` says whether the listing syncs still work.
 */
export async function GET() {
    return NextResponse.json(
        {
            status: 'ok',
            // Git commit of this deployment (Vercel system env); lets CI wait for a deploy to go live.
            commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
            listings: await listingFreshness(),
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
