import Link from 'next/link';
import { createPublicClient } from '@/utils/supabase/public';
import { getMarketStats, marketKey, BHK_TYPES, formatINR, areaSlug, getActiveListingCount } from '@/utils/market';
import { getAreas } from '@/utils/listings';
import PaidRentForm from '@/components/PaidRentForm';

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
        <div className="min-h-screen bg-[#0A0A0A] text-white pt-32 pb-24 px-4 sm:px-6 selection:bg-[#FF385C] selection:text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <div className="max-w-5xl mx-auto">
                <p className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-4">Rent Index</p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-6">
                    What Bangalore actually rents for.
                </h1>
                <p className="text-gray-300 text-lg font-light max-w-2xl">
                    Median monthly asking rent by area and configuration — computed from {totalListings.toLocaleString('en-IN')} live
                    listings across {totalMarkets} area·BHK markets, refreshed twice a day. No estimates, no broker spin.
                </p>
                <p className="mt-4 text-sm text-gray-400">
                    Free to reuse: <Link href="/data" className="text-[#00A699] hover:underline">download the data (CC BY 4.0)</Link>
                </p>

                {areaRows.length === 0 ? (
                    <div className="mt-16 bg-[#111] border border-white/10 p-12 text-center">
                        <p className="text-gray-300">Index is warming up. Check back after the next data sync.</p>
                    </div>
                ) : (
                    <div className="mt-12 overflow-x-auto border border-white/10">
                        <table className="w-full text-left border-collapse min-w-[680px]">
                            <caption className="sr-only">Median monthly rent by area and BHK</caption>
                            <thead>
                                <tr className="bg-[#111] border-b border-white/10">
                                    <th scope="col" className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Area</th>
                                    {BHK_TYPES.map(b => (
                                        <th scope="col" key={b} className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">{b} median</th>
                                    ))}
                                    <th scope="col" className="p-4 text-[10px] font-bold text-[#00A699] uppercase tracking-widest text-right">2BHK paid*</th>
                                    <th scope="col" className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Listings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {areaRows.map(r => (
                                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <th scope="row" className="p-4 font-bold">
                                            <Link href={`/bangalore/rent/${areaSlug(r.name)}`} className="text-white hover:text-[#FF385C]">{r.name}</Link>
                                        </th>
                                        {r.cells.map((c, i) => (
                                            <td key={i} className="p-4 text-right font-mono">
                                                {c
                                                    ? <span className="text-white">{formatINR(c.median)}<span className="text-gray-500 text-[10px] ml-1">·{c.count}</span></span>
                                                    : <span className="text-gray-600">—</span>}
                                            </td>
                                        ))}
                                        <td className="p-4 text-right font-mono text-[#00A699]">{r.paid2 ? formatINR(r.paid2.median) : <span className="text-gray-600">—</span>}</td>
                                        <td className="p-4 text-right font-mono text-gray-400">{r.totalComps}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <p className="mt-6 text-[10px] font-mono text-gray-400 uppercase tracking-widest leading-relaxed">
                    Median = midpoint of active listing rents in that area + BHK · ·N = comparables · markets with fewer than 3 are hidden.
                    * Paid = median of anonymous tenant reports, shown once 3+ exist.
                </p>

                <div className="mt-16">
                    <PaidRentForm areas={areas} />
                </div>

                <div className="mt-12 flex flex-col sm:flex-row gap-4">
                    <Link href="/check" className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold tracking-widest uppercase bg-[#00A699] text-white hover:bg-white hover:text-black transition-colors">
                        Check a specific rent
                    </Link>
                    <Link href="/properties?verdict=under" className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold tracking-widest uppercase border border-white/20 text-white hover:border-white transition-colors">
                        Under-market listings
                    </Link>
                </div>
            </div>
        </div>
    );
}
