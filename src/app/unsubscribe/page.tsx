import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createPublicClient } from '@/utils/supabase/public';

export const metadata = { title: 'Unsubscribe', robots: { index: false } };
export const dynamic = 'force-dynamic';

const TOKEN_RE = /^[0-9a-f-]{36}$/i;

async function unsubscribe(formData: FormData) {
    'use server';
    const token = String(formData.get('token') || '');
    if (!TOKEN_RE.test(token)) redirect('/unsubscribe?status=invalid');
    const { data } = await createPublicClient().rpc('unsubscribe_watch', { token });
    redirect(`/unsubscribe?status=${data === true ? 'done' : 'invalid'}`);
}

// Confirm with a button (POST) — email link scanners prefetch GET URLs
// and would otherwise unsubscribe people silently.
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ token?: string; status?: string }> }) {
    const { token, status } = await searchParams;
    const valid = !!token && TOKEN_RE.test(token);

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white pt-40 px-4 sm:px-6">
            <div className="max-w-xl mx-auto text-center">
                {status === 'done' ? (
                    <>
                        <h1 className="text-4xl font-black tracking-tighter mb-4">Unsubscribed.</h1>
                        <p className="text-gray-300 mb-10">You won&apos;t get alerts for that area any more.</p>
                    </>
                ) : valid ? (
                    <>
                        <h1 className="text-4xl font-black tracking-tighter mb-4">Stop these alerts?</h1>
                        <form action={unsubscribe} className="mb-10">
                            <input type="hidden" name="token" value={token} />
                            <button className="px-8 py-4 bg-[#FF385C] text-white text-xs font-bold uppercase tracking-widest">Unsubscribe</button>
                        </form>
                    </>
                ) : (
                    <>
                        <h1 className="text-4xl font-black tracking-tighter mb-4">Link not valid</h1>
                        <p className="text-gray-300 mb-10">This unsubscribe link is invalid or was already used.</p>
                    </>
                )}
                <Link href="/properties" className="px-8 py-4 border border-white/20 text-xs font-bold uppercase tracking-widest hover:border-white">Browse flats</Link>
            </div>
        </div>
    );
}
