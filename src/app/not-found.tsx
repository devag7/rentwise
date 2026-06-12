import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
            <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-4">
                Error 404
            </p>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-white mb-6">
                This page does not exist.
            </h1>
            <p className="text-gray-400 mb-10 max-w-md font-light">
                The listing may have been removed, or the address was mistyped.
            </p>
            <Link
                href="/properties"
                className="bg-white text-black px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
            >
                Browse Properties
            </Link>
        </main>
    );
}
