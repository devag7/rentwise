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
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
