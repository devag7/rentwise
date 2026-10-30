import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createPublicClient } from '@/utils/supabase/public';
import Container from '@/components/ui/Container';

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
        <div className="pt-32 pb-24 sm:pt-40 sm:pb-32">
            <Container narrow className="text-center">
                {status === 'done' ? (
                    <>
                        <h1 className="text-title-1 text-balance">You’re unsubscribed.</h1>
                        <p className="mt-4 text-lead text-label-2">You won&apos;t get alerts for that area any more.</p>
                    </>
                ) : valid ? (
                    <>
                        <h1 className="text-title-1 text-balance">Stop these alerts?</h1>
                        <p className="mt-4 text-lead text-label-2">You won&apos;t get emails about new flats in this area any more.</p>
                        <form action={unsubscribe} className="mt-8">
                            <input type="hidden" name="token" value={token} />
                            <button className="btn btn-primary btn-lg">Unsubscribe</button>
                        </form>
                    </>
                ) : (
                    <>
                        <h1 className="text-title-1 text-balance">This link doesn’t work</h1>
                        <p className="mt-4 text-lead text-label-2">The unsubscribe link is invalid or was already used.</p>
                    </>
                )}
                <div className="mt-10">
                    <Link href="/properties" className="link link-chevron">Browse flats</Link>
                </div>
            </Container>
        </div>
    );
}
