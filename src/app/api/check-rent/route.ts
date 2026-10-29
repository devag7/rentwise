import { NextResponse } from 'next/server';
import { checkRent, type CheckRentInput } from '@/utils/checkRent';

/**
 * Fallback for the `check-rent` Supabase Edge Function (same contract), so
 * /check works even before the function is deployed.
 */
export async function POST(req: Request) {
    let body: CheckRentInput;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
    }
    const out = await checkRent(body);
    return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
