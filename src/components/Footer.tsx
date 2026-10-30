import Link from 'next/link';

const GROUPS = [
    {
        title: 'Renting',
        links: [
            { href: '/check', label: 'Check a rent' },
            { href: '/properties', label: 'Browse flats' },
            { href: '/bangalore/rent', label: 'Rent by area' },
        ],
    },
    {
        title: 'Data',
        links: [
            { href: '/insights', label: 'Rent index' },
            { href: '/data', label: 'Open data' },
            { href: 'https://github.com/devag7/rentwise', label: 'Source code' },
        ],
    },
    {
        title: 'Owners',
        links: [
            { href: '/register/landlord', label: 'List your flat' },
            { href: '/login/landlord', label: 'Owner sign in' },
            { href: 'mailto:rentwise@devshipit.com', label: 'Contact' },
        ],
    },
];

export default function Footer() {
    return (
        <footer className="border-t border-separator bg-surface-2 text-footnote text-label-2">
            <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
                <p className="max-w-2xl">
                    Rents are asking prices from live NoBroker and MagicBricks listings, refreshed daily.
                    A verdict needs at least three comparable flats — with fewer, RentWise says so instead of guessing.
                </p>
                <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3">
                    {GROUPS.map(g => (
                        <nav key={g.title} aria-label={g.title}>
                            <h2 className="mb-3 font-semibold text-label">{g.title}</h2>
                            <ul className="space-y-2.5">
                                {g.links.map(l => (
                                    <li key={l.href}>
                                        <Link href={l.href} className="hover:text-label hover:underline underline-offset-2">{l.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>
                <p className="mt-10 border-t border-separator pt-6">
                    RentWise · Bangalore · Data CC BY 4.0 · Code MIT
                </p>
            </div>
        </footer>
    );
}
