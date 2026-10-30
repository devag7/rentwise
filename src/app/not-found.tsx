import Link from 'next/link';
import Container from '@/components/ui/Container';

export default function NotFound() {
    return (
        <div className="flex min-h-[80vh] items-center pt-28 pb-24 sm:pt-32">
            <Container narrow className="text-center">
                <p className="text-eyebrow mb-3 num">Error 404</p>
                <h1 className="text-title-1 text-balance">This page does not exist.</h1>
                <p className="mx-auto mt-4 max-w-md text-lead text-label-2 text-balance">
                    The listing may have been removed, or the address was mistyped.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                    <Link href="/properties" className="btn btn-primary">Browse flats</Link>
                    <Link href="/" className="link link-chevron">Go to the home page</Link>
                </div>
            </Container>
        </div>
    );
}
