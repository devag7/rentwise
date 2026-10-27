import { Suspense } from 'react';
import RentChecker from './RentChecker';

export const metadata = {
    title: 'Is my rent fair? — Bangalore rent checker',
    description:
        'Paste a NoBroker, MagicBricks or 99acres link or type "2BHK HSR 42k". Get the market median from real comparable listings, the verdict, and cheaper flats nearby.',
    alternates: { canonical: '/check' },
};

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
