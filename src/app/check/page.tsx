import { Suspense } from 'react';
import type { Metadata } from 'next';
import RentChecker from './RentChecker';

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
        <div className="min-h-screen bg-[#0A0A0A] text-white pt-32 pb-24 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                <p className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-4">Fair-rent checker</p>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-6">Is this rent fair?</h1>
                <p className="text-gray-300 text-lg font-light mb-10 max-w-2xl">
                    Paste a listing link or describe the flat. We compare it with live listings of the same BHK in the same area — real numbers only, no estimates.
                </p>
                <Suspense>
                    <RentChecker />
                </Suspense>
            </div>
        </div>
    );
}
