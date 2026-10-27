import type { Metadata } from 'next';
import Link from 'next/link';
import { createPublicClient } from '@/utils/supabase/public';

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rentwise.devshipit.com';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';

export const metadata: Metadata = {
    title: 'Open data — Bangalore rent index & rent history (CSV, CC BY 4.0)',
    description:
        'Download median rent by area and BHK for Bangalore, plus daily history, as CSV under CC BY 4.0. Aggregates of real active listings only — no individual listings or personal data.',
    alternates: { canonical: '/data' },
};

function formatDate(iso: string): string {
    const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

async function getSummary() {
    const supabase = createPublicClient();
    const [markets, historyCount, first, last] = await Promise.all([
        supabase.from('market_stats').select('area_id', { count: 'exact', head: true }),
        supabase.from('area_rent_history').select('area_id', { count: 'exact', head: true }),
        supabase.from('area_rent_history').select('snapshot_date').order('snapshot_date', { ascending: true }).limit(1),
        supabase.from('area_rent_history').select('snapshot_date').order('snapshot_date', { ascending: false }).limit(1),
    ]);
    return {
        markets: markets.error ? null : markets.count ?? 0,
        historyRows: historyCount.error ? null : historyCount.count ?? 0,
        firstSnapshot: (first.data?.[0] as { snapshot_date?: string } | undefined)?.snapshot_date ?? null,
        lastSnapshot: (last.data?.[0] as { snapshot_date?: string } | undefined)?.snapshot_date ?? null,
    };
}

const FILES = [
    {
        name: 'Bangalore rent index',
        path: '/data/rent-index.csv',
        file: 'bangalore-rent-index.csv',
        description: 'Current median, 25th and 75th percentile asking rent per area and configuration, with the number of active listings behind each figure.',
        columns: 'area, area_id, bhk, median_rent_inr, p25, p75, listings, as_of',
    },
    {
        name: 'Bangalore rent history',
        path: '/data/rent-history.csv',
        file: 'bangalore-rent-history.csv',
        description: 'One row per day per area·configuration market: the same statistics, snapshotted daily, so you can track how rents move.',
        columns: 'snapshot_date, area, area_id, bhk, median_rent_inr, p25, p75, listings',
    },
];

export default async function DataPage() {
    const s = await getSummary();
    const available = s.markets != null;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Bangalore Rent Index (RentWise)',
        description:
            'Median, 25th and 75th percentile monthly asking rent by area and configuration (1BHK/2BHK/3BHK, etc.) in Bengaluru, computed from active rental listings with at least 3 comparables, plus a daily history of the same statistics.',
        url: `${BASE_URL}/data`,
        license: LICENSE,
        isAccessibleForFree: true,
        creator: { '@type': 'Organization', name: 'RentWise', url: BASE_URL },
        spatialCoverage: { '@type': 'Place', name: 'Bengaluru, Karnataka, India' },
        ...(s.firstSnapshot && s.lastSnapshot ? { temporalCoverage: `${s.firstSnapshot}/${s.lastSnapshot}` } : {}),
        keywords: ['Bangalore rent', 'Bengaluru rent index', 'median rent', 'rental market', 'India housing'],
        variableMeasured: ['median_rent_inr', 'p25', 'p75', 'listings'],
        distribution: FILES.map(f => ({
            '@type': 'DataDownload',
            name: f.name,
            encodingFormat: 'text/csv',
            contentUrl: `${BASE_URL}${f.path}`,
        })),
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white pt-28 sm:pt-32 pb-24 px-4 sm:px-6 selection:bg-[#FF385C] selection:text-white overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <div className="max-w-3xl mx-auto">
                <p className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-4">Open data</p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-6">Bangalore rent data, free to use.</h1>
                <p className="text-gray-300 text-lg font-light">
                    The numbers behind the RentWise rent index, as plain CSV. Use them in research, journalism, apps or spreadsheets —
                    just credit <span className="text-white font-medium">RentWise</span> with a link back.
                </p>

                {!available && (
                    <div className="mt-10 border border-white/10 bg-[#111] p-6">
                        <p className="text-gray-300">
                            The dataset isn’t available yet — the market statistics haven’t been published on this deployment.
                            The download links below will return CSV headers only until it is.
                        </p>
                    </div>
                )}

                {available && (
                    <dl className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-[#111] border border-white/10 p-5">
                            <dt className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Markets published</dt>
                            <dd className="text-3xl font-black tracking-tighter">{s.markets}</dd>
                        </div>
                        <div className="bg-[#111] border border-white/10 p-5">
                            <dt className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">History rows</dt>
                            <dd className="text-3xl font-black tracking-tighter">{s.historyRows != null ? s.historyRows.toLocaleString('en-IN') : '—'}</dd>
                        </div>
                        <div className="bg-[#111] border border-white/10 p-5">
                            <dt className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">History since</dt>
                            <dd className="text-xl font-black tracking-tight mt-2">{s.firstSnapshot ? formatDate(s.firstSnapshot) : 'Not started'}</dd>
                        </div>
                    </dl>
                )}

                <section className="mt-16">
                    <h2 className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-6">Downloads</h2>
                    <div className="space-y-3">
                        {FILES.map(f => (
                            <div key={f.path} className="bg-[#111] border border-white/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className="text-lg font-black tracking-tight">{f.name}</h3>
                                    <p className="text-gray-400 text-sm mt-1">{f.description}</p>
                                    <p className="text-gray-400 text-xs font-mono mt-3 break-words">Columns: {f.columns}</p>
                                </div>
                                <a
                                    href={f.path}
                                    download={f.file}
                                    className="shrink-0 inline-flex justify-center items-center px-6 py-3 text-xs font-bold tracking-widest uppercase bg-[#00A699] text-white hover:bg-white hover:text-black transition-colors"
                                >
                                    Download CSV
                                </a>
                            </div>
                        ))}
                    </div>
                    <p className="mt-4 text-xs text-gray-400 font-mono break-all">
                        {BASE_URL}/data/rent-index.csv · {BASE_URL}/data/rent-history.csv
                    </p>
                </section>

                <section className="mt-16 space-y-8 text-gray-300 leading-relaxed">
                    <div>
                        <h2 className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-4">Methodology</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Each figure is the <strong className="text-white">median asking rent</strong> (plus 25th and 75th percentiles) of <strong className="text-white">active</strong> listings in one area and configuration.</li>
                            <li>A market is published only when it has <strong className="text-white">at least 3 comparable listings</strong>. Thinner markets are left out, never estimated.</li>
                            <li>Listings come from public portals (NoBroker, MagicBricks) and landlords posting directly on RentWise, <strong className="text-white">refreshed twice daily</strong> (06:00 and 18:00 IST). Portal listings not seen by any source for 14 days are marked inactive and drop out.</li>
                            <li>The history file adds one snapshot per market per day, so it starts on the day snapshots began and grows from there.</li>
                            <li>These are <em>asking</em> rents, not signed-lease rents.</li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-4">What’s not in it</h2>
                        <p>
                            Aggregates only. The files contain <strong className="text-white">no individual listings, addresses, contact details or any personal data</strong>.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-4">License</h2>
                        <p>
                            Released under{' '}
                            <a href={LICENSE} className="text-white underline hover:text-[#00A699]" rel="license">Creative Commons Attribution 4.0 (CC BY 4.0)</a>.
                            Credit: “Source: RentWise Bangalore Rent Index ({BASE_URL.replace(/^https?:\/\//, '')})”.
                        </p>
                    </div>
                </section>

                <div className="mt-16 flex flex-col sm:flex-row gap-3">
                    <Link href="/bangalore/rent" className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold tracking-widest uppercase border border-white/20 text-white hover:border-white transition-colors">
                        Browse rent by area
                    </Link>
                    <Link href="/check" className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold tracking-widest uppercase bg-[#FF385C] text-white hover:bg-white hover:text-black transition-colors">
                        Check a rent
                    </Link>
                </div>
            </div>
        </div>
    );
}
