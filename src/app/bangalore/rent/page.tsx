import type { Metadata } from 'next';
import Link from 'next/link';
import { createPublicClient } from '@/utils/supabase/public';
import { getMarketStats, marketKey, BHK_TYPES, areaSlug } from '@/utils/market';
import { getAreas } from '@/utils/listings';
import { BASE_URL, bhkSlug, formatINR, formatDate, todayIST } from './_lib';
import { JsonLd, Breadcrumbs, CheckCta, breadcrumbJsonLd } from './_ui';

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
        <div className="min-h-screen bg-[#0A0A0A] text-white pt-28 sm:pt-32 pb-24 px-4 sm:px-6 selection:bg-[#FF385C] selection:text-white overflow-x-hidden">
            <JsonLd data={breadcrumbJsonLd(BASE_URL, crumbs)} />
            {rows.length > 0 && <JsonLd data={itemList} />}
            <div className="max-w-5xl mx-auto">
                <Breadcrumbs crumbs={crumbs} />
                <p className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-4">Bangalore rent index</p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-6">Rent in Bangalore, by area</h1>
                <p className="text-gray-300 text-lg font-light max-w-2xl">
                    Median asking rent for {rows.length} {rows.length === 1 ? 'area' : 'areas'} with at least 3 active comparable listings, as of {asOf}.
                    Pick an area for ranges, trends and the cheapest live flats.
                </p>

                {rows.length === 0 ? (
                    <div className="mt-12 bg-[#111] border border-white/10 p-8 sm:p-12 text-center">
                        <p className="text-gray-400">No area has enough comparables yet. Check back after the next data sync.</p>
                    </div>
                ) : (
                    <ul className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {rows.map(r => (
                            <li key={r.area_id} className="bg-[#111] border border-white/10 p-5 min-w-0">
                                <Link href={`/bangalore/rent/${r.slug}`} className="text-lg font-black tracking-tight text-white hover:text-[#FF385C] transition-colors">
                                    Rent in {r.name}
                                </Link>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {r.cells.map(c =>
                                        c.stat ? (
                                            <Link
                                                key={c.bhk}
                                                href={`/bangalore/rent/${r.slug}/${bhkSlug(c.bhk)}`}
                                                className="px-3 py-1.5 border border-white/15 hover:border-white text-xs font-bold tracking-widest uppercase text-gray-300 hover:text-white transition-colors"
                                            >
                                                {c.bhk} <span className="font-mono normal-case tracking-normal text-white">{formatINR(c.stat.median)}</span>
                                            </Link>
                                        ) : (
                                            <span key={c.bhk} className="px-3 py-1.5 border border-white/5 text-xs font-bold tracking-widest uppercase text-gray-500">
                                                {c.bhk} —
                                            </span>
                                        )
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <p className="mt-6 text-[10px] font-mono text-gray-400 uppercase tracking-widest leading-relaxed">
                    — = fewer than 3 active listings, so no median is published.{' '}
                    <Link href="/data" className="underline hover:text-white">Download the data (CC BY 4.0)</Link> ·{' '}
                    <Link href="/insights" className="underline hover:text-white">Full rent index table</Link>
                </p>

                <CheckCta />
            </div>
        </div>
    );
}
