'use client'

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[APP ERROR]', error);
    }, [error]);

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
            <p className="text-[10px] font-mono font-bold text-[#FF385C] uppercase tracking-widest mb-4">
                System Fault
            </p>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-white mb-6">
                Something broke.
            </h1>
            <p className="text-gray-400 mb-10 max-w-md font-light">
                An unexpected error occurred. You can retry, or head back to the listings.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={reset}
                    className="bg-white text-black px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                    Retry
                </button>
                <Link
                    href="/properties"
                    className="border border-white/20 text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:border-white transition-colors"
                >
                    Browse Properties
                </Link>
            </div>
            {error.digest && (
                <p className="mt-10 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                    Ref: {error.digest}
                </p>
            )}
        </main>
    );
}
