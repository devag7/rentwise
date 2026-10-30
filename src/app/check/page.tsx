import { Suspense } from 'react';
import type { Metadata } from 'next';
import RentChecker from './RentChecker';
import Container from '@/components/ui/Container';

const TITLE = 'Is my rent fair? — Bangalore rent checker';
const DESCRIPTION =
    'Paste a NoBroker, MagicBricks or 99acres link or type "2BHK HSR 42k". Get the market median from real comparable listings, the verdict, and cheaper flats nearby.';

// A shared /check?q=... link previews with that check's verdict card.
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }): Promise<Metadata> {
    const raw = (await searchParams).q;
    const q = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 300);
    const image = q ? `/check/og?q=${encodeURIComponent(q)}` : '/check/og';
    return {
        title: TITLE,
        description: DESCRIPTION,
        alternates: { canonical: '/check' },
        openGraph: { title: TITLE, description: DESCRIPTION, images: [{ url: image, width: 1200, height: 630 }] },
        twitter: { card: 'summary_large_image', images: [image] },
    };
}

export default function CheckPage() {
    return (
        <div className="pt-28 pb-24 sm:pt-32 sm:pb-32">
            <Container narrow>
                <p className="text-eyebrow mb-3">Fair-rent checker</p>
                <h1 className="text-title-1 text-balance">Is this rent fair?</h1>
                <p className="mt-4 max-w-2xl text-lead text-label-2 text-balance">
                    Paste a listing link or describe the flat. We compare it with live listings of the same size in the same area — real numbers only, no estimates.
                </p>
                <div className="mt-10">
                    <Suspense>
                        <RentChecker />
                    </Suspense>
                </div>
            </Container>
        </div>
    );
}
