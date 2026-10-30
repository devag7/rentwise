import Link from 'next/link';
import { createPublicClient } from '@/utils/supabase/public';
import { getMarketStats, marketKey, BHK_TYPES, formatINR, areaSlug, getActiveListingCount } from '@/utils/market';
import { getAreas } from '@/utils/listings';
import PaidRentForm from '@/components/PaidRentForm';
import Container from '@/components/ui/Container';

export const metadata = {
    title: 'Bangalore Rent Index — median rent by area & BHK',
    description:
        'Live median rent for every Bangalore area, by configuration, computed from real listings — plus what tenants report actually paying. Free to download.',
    alternates: { canonical: '/insights' },
};

// Public data, cookie-less client → statically cached, refreshed every 30 min.
export const revalidate = 1800;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rentwise.devshipit.com';

export default async function Insights() {
    const supabase = createPublicClient();

    const [stats, areas, totalListings, { data: paidRows }] = await Promise.all([
        getMarketStats(supabase),
        getAreas(supabase),
        getActiveListingCount(supabase),
        supabase.from('paid_rent_stats').select('area_id, property_type, median, count'),
    ]);

    const paid = new Map(
        ((paidRows || []) as { area_id: number; property_type: string; median: number; count: number }[])
            .map(p => [marketKey(p.area_id, p.property_type), p])
    );

    const areaRows = areas
        .map(a => {
            const cells = BHK_TYPES.map(bhk => stats[marketKey(a.area_id, bhk)] || null);
            const totalComps = cells.reduce((s, c) => s + (c?.count || 0), 0);
            const paid2 = paid.get(marketKey(a.area_id, '2BHK'));
            return { id: a.area_id, name: a.name, cells, totalComps, paid2 };
        })
        .filter(r => r.totalComps > 0)
        .sort((a, b) => (b.cells[1]?.median || 0) - (a.cells[1]?.median || 0));

    const totalMarkets = Object.keys(stats).length;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Bangalore Rent Index',
        description: 'Median monthly asking rent by area and configuration in Bengaluru, computed from real rental listings.',
        url: `${BASE_URL}/insights`,
        license: 'https://creativecommons.org/licenses/by/4.0/',
        creator: { '@type': 'Organization', name: 'RentWise' },
        spatialCoverage: { '@type': 'Place', name: 'Bengaluru, Karnataka, India' },
        distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${BASE_URL}/data/rent-index.csv` }],
    };

    return (
        <div className="pt-28 pb-24 sm:pt-32 sm:pb-32">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <Container>
                <p className="text-eyebrow mb-3">Rent index</p>
                <h1 className="text-title-1 max-w-3xl text-balance">What Bangalore actually rents for.</h1>
                <p className="mt-4 max-w-2xl text-lead text-label-2 text-balance">
                    Median monthly asking rent by area and size, from <span className="num">{totalListings.toLocaleString('en-IN')}</span> live
                    listings across <span className="num">{totalMarkets}</span> area and BHK markets. Refreshed twice a day. No estimates.
                </p>
                <p className="mt-4 text-callout text-label-2">
                    Free to reuse under CC BY 4.0. <Link href="/data" className="link link-chevron">Download the data</Link>
                </p>

                {areaRows.length === 0 ? (
                    <div className="card mt-12 px-6 py-16 text-center">
                        <p className="text-title-3">No numbers yet</p>
                        <p className="mt-2 text-label-2">The index fills in after the next data sync. Check back in a few hours.</p>
                    </div>
                ) : (
                    <div className="card mt-12 overflow-x-auto">
                        <table className="w-full min-w-[680px] border-collapse text-left">
                            <caption className="sr-only">Median monthly rent by area and BHK</caption>
                            <thead>
                                <tr className="border-b border-separator text-footnote text-label-2">
                                    <th scope="col" className="px-5 py-3 font-medium">Area</th>
                                    {BHK_TYPES.map(b => (
                                        <th scope="col" key={b} className="px-5 py-3 text-right font-medium">{b} median</th>
                                    ))}
                                    <th scope="col" className="px-5 py-3 text-right font-medium">2BHK paid*</th>
                                    <th scope="col" className="px-5 py-3 text-right font-medium">Listings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-separator">
                                {areaRows.map(r => (
                                    <tr key={r.id} className="transition-colors hover:bg-fill">
                                        <th scope="row" className="px-5 py-3.5 font-semibold">
                                            <Link href={`/bangalore/rent/${areaSlug(r.name)}`} className="hover:text-accent">{r.name}</Link>
                                        </th>
                                        {r.cells.map((c, i) => (
                                            <td key={i} className="px-5 py-3.5 text-right num">
                                                {c
                                                    ? <>{formatINR(c.median)}<span className="ml-1.5 text-caption text-label-2">{c.count}</span></>
                                                    : <span className="text-label-3">—</span>}
                                            </td>
                                        ))}
                                        <td className="px-5 py-3.5 text-right num">{r.paid2 ? formatINR(r.paid2.median) : <span className="text-label-3">—</span>}</td>
                                        <td className="px-5 py-3.5 text-right text-label-2 num">{r.totalComps}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <p className="mt-4 max-w-3xl text-footnote text-label-2">
                    Median is the middle asking rent of active listings for that area and BHK; the small number beside it is how many listings it comes from.
                    Markets with fewer than 3 listings are hidden. *Paid is the median of anonymous tenant reports, shown once 3 or more exist.
                </p>

                <div className="mt-16">
                    <PaidRentForm areas={areas} />
                </div>

                <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                    <Link href="/check" className="btn btn-primary">Check a specific rent</Link>
                    <Link href="/properties?verdict=under" className="link link-chevron">Flats under market</Link>
                </div>
            </Container>
        </div>
    );
}
