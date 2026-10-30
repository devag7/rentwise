'use client'

import { useEffect } from 'react';
import Link from 'next/link';
import Container from '@/components/ui/Container';

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
        <div className="flex min-h-[80vh] items-center pt-28 pb-24 sm:pt-32">
            <Container narrow className="text-center">
                <h1 className="text-title-1 text-balance">Something went wrong.</h1>
                <p className="mx-auto mt-4 max-w-md text-lead text-label-2 text-balance">
                    This page hit an unexpected error. Try again, or head back to the listings.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                    <button type="button" onClick={reset} className="btn btn-primary">
                        Try again
                    </button>
                    <Link href="/properties" className="link link-chevron">Browse flats</Link>
                </div>
                {error.digest && (
                    <p className="mt-10 text-footnote text-label-2">
                        Reference: <span className="font-mono">{error.digest}</span>
                    </p>
                )}
            </Container>
        </div>
    );
}
