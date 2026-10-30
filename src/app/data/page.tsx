import type { Metadata } from 'next';
import Link from 'next/link';
import { createPublicClient } from '@/utils/supabase/public';
import Container from '@/components/ui/Container';

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
        <div className="pt-28 pb-24 sm:pt-32 sm:pb-32">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <Container narrow>
                <p className="text-eyebrow mb-3">Open data</p>
                <h1 className="text-title-1 text-balance">Bangalore rent data, free to use.</h1>
                <p className="mt-4 text-lead text-label-2">
                    The numbers behind the RentWise rent index, as plain CSV. Use them in research, journalism, apps or spreadsheets —
                    just credit <span className="font-semibold text-label">RentWise</span> with a link back.
                </p>

                {!available && (
                    <div className="card mt-10 p-6">
                        <p className="text-headline">The dataset isn’t published yet</p>
                        <p className="mt-1 text-callout text-label-2">
                            Market statistics haven’t been published on this deployment, so the downloads below contain column headers only for now.
                        </p>
                    </div>
                )}

                {available && (
                    <dl className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="card p-5">
                            <dt className="text-footnote text-label-2">Markets published</dt>
                            <dd className="mt-1 text-title-2 num">{s.markets}</dd>
                        </div>
                        <div className="card p-5">
                            <dt className="text-footnote text-label-2">History rows</dt>
                            <dd className="mt-1 text-title-2 num">{s.historyRows != null ? s.historyRows.toLocaleString('en-IN') : '—'}</dd>
                        </div>
                        <div className="card p-5">
                            <dt className="text-footnote text-label-2">History since</dt>
                            <dd className="mt-1 text-title-2 num">{s.firstSnapshot ? formatDate(s.firstSnapshot) : 'Not started'}</dd>
                        </div>
                    </dl>
                )}

                <section className="mt-16">
                    <h2 className="text-title-2">Downloads</h2>
                    <ul className="card mt-5 divide-y divide-separator overflow-hidden">
                        {FILES.map(f => (
                            <li key={f.path} className="flex flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-start sm:px-6">
                                <div className="min-w-0">
                                    <h3 className="text-headline">{f.name}</h3>
                                    <p className="mt-1 text-callout text-label-2">{f.description}</p>
                                    <p className="mt-3 break-words font-mono text-caption text-label-2">Columns: {f.columns}</p>
                                </div>
                                <a href={f.path} download={f.file} className="btn btn-secondary btn-sm shrink-0 self-start">
                                    Download CSV
                                </a>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 break-all font-mono text-caption text-label-2">
                        {BASE_URL}/data/rent-index.csv · {BASE_URL}/data/rent-history.csv
                    </p>
                </section>

                <section className="mt-16">
                    <h2 className="text-title-2">How the numbers are made</h2>
                    <ul className="mt-5 list-disc space-y-2 pl-5 text-label-2 marker:text-label-3">
                        <li>Each figure is the <strong className="font-semibold text-label">median asking rent</strong> (plus 25th and 75th percentiles) of <strong className="font-semibold text-label">active</strong> listings in one area and configuration.</li>
                        <li>A market is published only when it has <strong className="font-semibold text-label">at least 3 comparable listings</strong>. Thinner markets are left out, never estimated.</li>
                        <li>Listings come from public portals (NoBroker, MagicBricks) and landlords posting directly on RentWise, <strong className="font-semibold text-label">refreshed twice daily</strong> (06:00 and 18:00 IST). Portal listings not seen by any source for 14 days are marked inactive and drop out.</li>
                        <li>The history file adds one snapshot per market per day, so it starts on the day snapshots began and grows from there.</li>
                        <li>These are <em>asking</em> rents, not signed-lease rents.</li>
                    </ul>
                </section>

                <section className="mt-12">
                    <h2 className="text-title-2">What’s not in it</h2>
                    <p className="mt-4 text-label-2">
                        Aggregates only. The files contain <strong className="font-semibold text-label">no individual listings, addresses, contact details or any personal data</strong>.
                    </p>
                </section>

                <section className="mt-12">
                    <h2 className="text-title-2">License</h2>
                    <p className="mt-4 text-label-2">
                        Released under{' '}
                        <a href={LICENSE} className="link" rel="license">Creative Commons Attribution 4.0 (CC BY 4.0)</a>.
                        Credit: “Source: RentWise Bangalore Rent Index ({BASE_URL.replace(/^https?:\/\//, '')})”.
                    </p>
                </section>

                <div className="mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                    <Link href="/check" className="btn btn-primary">Check a rent</Link>
                    <Link href="/bangalore/rent" className="link link-chevron">Browse rent by area</Link>
                </div>
            </Container>
        </div>
    );
}
