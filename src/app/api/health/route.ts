import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Lightweight liveness probe for Docker healthchecks and uptime monitors.
 * Returns 200 as long as the Next.js server is able to handle requests.
 */
export async function GET() {
    return NextResponse.json(
        {
            status: 'ok',
            // Git commit of this deployment (Vercel system env); lets CI wait for a deploy to go live.
            commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
