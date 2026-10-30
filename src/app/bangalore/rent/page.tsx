import type { Metadata } from 'next';
import Link from 'next/link';
import { createPublicClient } from '@/utils/supabase/public';
import { getMarketStats, marketKey, BHK_TYPES, areaSlug } from '@/utils/market';
import { getAreas } from '@/utils/listings';
import { BASE_URL, bhkSlug, formatINR, formatDate, todayIST } from './_lib';
import { JsonLd, Breadcrumbs, CheckCta, breadcrumbJsonLd } from './_ui';
import Container from '@/components/ui/Container';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Rent in Bangalore by area — median 1BHK, 2BHK, 3BHK rent',
    description:
        'Median asking rent for every Bangalore area with enough live listings, by configuration. Built from real listings with at least 3 comparables — no estimates.',
    alternates: { canonical: '/bangalore/rent' },
};

export default async function BangaloreRentIndex() {
    const supabase = createPublicClient();
    const [stats, areas] = await Promise.all([getMarketStats(supabase), getAreas(supabase)]);
    const asOf = formatDate(todayIST());

    const rows = areas
        .map(a => ({
            ...a,
            slug: areaSlug(a.name),
            cells: BHK_TYPES.map(t => ({ bhk: t, stat: stats[marketKey(a.area_id, t)] })),
        }))
        .filter(r => r.slug && r.cells.some(c => c.stat));

    const crumbs = [
        { name: 'Home', path: '/' },
        { name: 'Bangalore rent', path: '/bangalore/rent' },
    ];

    const itemList = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Rent in Bangalore by area',
        itemListElement: rows.map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: `Rent in ${r.name}`,
            url: `${BASE_URL}/bangalore/rent/${r.slug}`,
        })),
    };

    return (
        <div className="pt-28 pb-24 sm:pt-32 sm:pb-32">
            <JsonLd data={breadcrumbJsonLd(BASE_URL, crumbs)} />
            {rows.length > 0 && <JsonLd data={itemList} />}
            <Container>
                <Breadcrumbs crumbs={crumbs} />
                <h1 className="text-title-1 text-balance">Rent in Bangalore, by area</h1>
                <p className="mt-4 max-w-2xl text-lead text-label-2 text-balance">
                    Median asking rent for <span className="num">{rows.length}</span> {rows.length === 1 ? 'area' : 'areas'} with at least 3 live comparable listings, as of {asOf}.
                    Pick an area for ranges, trends and the cheapest flats available now.
                </p>

                {rows.length === 0 ? (
                    <div className="card mt-12 px-6 py-16 text-center">
                        <p className="text-title-3">No area has enough listings yet</p>
                        <p className="mt-2 text-label-2">We publish a median once an area has 3 live comparables. Check back after the next data sync.</p>
                        <Link href="/properties" className="btn btn-secondary mt-6">Browse flats</Link>
                    </div>
                ) : (
                    <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {rows.map(r => (
                            <li key={r.area_id} className="card min-w-0 overflow-hidden">
                                <Link
                                    href={`/bangalore/rent/${r.slug}`}
                                    className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 transition-colors hover:text-accent"
                                >
                                    <h2 className="text-title-3 truncate">{r.name}</h2>
                                    <span aria-hidden className="text-label-3">›</span>
                                </Link>
                                <ul className="divide-y divide-separator border-t border-separator">
                                    {r.cells.map(c => (
                                        <li key={c.bhk}>
                                            {c.stat ? (
                                                <Link
                                                    href={`/bangalore/rent/${r.slug}/${bhkSlug(c.bhk)}`}
                                                    className="flex items-baseline justify-between gap-3 px-5 py-2.5 text-callout transition-colors hover:bg-fill"
                                                >
                                                    <span className="text-label-2">{c.bhk}</span>
                                                    <span className="font-semibold num">{formatINR(c.stat.median)}</span>
                                                </Link>
                                            ) : (
                                                <div className="flex items-baseline justify-between gap-3 px-5 py-2.5 text-callout">
                                                    <span className="text-label-2">{c.bhk}</span>
                                                    <span className="text-footnote text-label-3">Too few listings</span>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                )}

                <p className="mt-6 text-footnote text-label-2">
                    Figures are median asking rent per month. “Too few listings” means fewer than 3 live comparables, so no median is published.
                </p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-footnote">
                    <Link href="/insights" className="link link-chevron">Full rent index table</Link>
                    <Link href="/data" className="link link-chevron">Download the data</Link>
                </div>

                <CheckCta />
            </Container>
        </div>
    );
}
