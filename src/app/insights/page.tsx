import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { computeMarketStats, marketKey } from '@/utils/market';

export const metadata = {
    title: 'Bangalore Rent Index — median rent by area & BHK',
    description:
        'Live median rent for every Bangalore area, by configuration, computed from real listings. The only public rent index built on market comparables.',
    alternates: { canonical: '/insights' },
};

export const revalidate = 1800;

const BHKS = ['1BHK', '2BHK', '3BHK'];

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://157.245.110.163:3009';

export default async function Insights() {
    const supabase = await createClient();

    const [{ data: rows }, { data: areas }] = await Promise.all([
        supabase.from('properties').select('area_id, property_type, rent'),
        supabase.from('areas').select('area_id, name'),
    ]);

    const stats = computeMarketStats(rows || []);

    // Build one row per area that has at least one tracked market.
    const areaRows = (areas || [])
        .map(a => {
            const cells = BHKS.map(bhk => stats[marketKey(a.area_id, bhk)] || null);
            const totalComps = cells.reduce((s, c) => s + (c?.count || 0), 0);
            return { id: a.area_id, name: a.name, cells, totalComps };
        })
        .filter(r => r.totalComps > 0)
        // sort by 2BHK median desc, fallback total comps
        .sort((a, b) => (b.cells[1]?.median || 0) - (a.cells[1]?.median || 0));

    const totalListings = (rows || []).length;
    const totalMarkets = Object.keys(stats).length;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Bangalore Rent Index',
        description: 'Median monthly rent by area and configuration in Bengaluru, computed from real rental listings.',
        url: `${BASE_URL}/insights`,
        creator: { '@type': 'Organization', name: 'RentWise' },
        spatialCoverage: { '@type': 'Place', name: 'Bengaluru, Karnataka, India' },
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white pt-32 pb-24 px-6 selection:bg-[#FF385C] selection:text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <div className="max-w-5xl mx-auto">
                <div className="mb-4">
                    <h2 className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-4">Rent Index</h2>
                    <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-white mb-6">
                        What Bangalore actually rents for.
                    </h1>
                    <p className="text-gray-400 text-lg font-light max-w-2xl">
                        Median monthly rent by area and configuration — computed from {totalListings.toLocaleString('en-IN')} live
                        listings across {totalMarkets} area·BHK markets. Updated continuously. No estimates, no broker spin.
                    </p>
                </div>

                {areaRows.length === 0 ? (
                    <div className="mt-16 bg-[#111] border border-white/10 p-12 text-center">
                        <p className="text-gray-400">Index is warming up. Check back after the next data sync.</p>
                    </div>
                ) : (
                    <div className="mt-12 overflow-x-auto border border-white/10">
                        <table className="w-full text-left border-collapse min-w-[640px]">
                            <thead>
                                <tr className="bg-[#111] border-b border-white/10">
                                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Area</th>
                                    {BHKS.map(b => (
                                        <th key={b} className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">{b} median</th>
                                    ))}
                                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Listings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {areaRows.map(r => (
                                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <Link href={`/properties?area_id=${r.id}`} className="font-bold text-white hover:text-[#FF385C] transition-colors">
                                                {r.name}
                                            </Link>
                                        </td>
                                        {r.cells.map((c, i) => (
                                            <td key={i} className="p-4 text-right font-mono">
                                                {c
                                                    ? <span className="text-white">₹{c.median.toLocaleString('en-IN')}<span className="text-gray-600 text-[10px] ml-1">·{c.count}</span></span>
                                                    : <span className="text-gray-700">—</span>}
                                            </td>
                                        ))}
                                        <td className="p-4 text-right font-mono text-gray-400">{r.totalComps}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <p className="mt-6 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                    Median = midpoint of real listing rents in that area + configuration. ·N = number of comparables.
                    Markets with fewer than 3 comparables are not shown.
                </p>

                <div className="mt-16 flex flex-col sm:flex-row gap-4">
                    <Link href="/properties?verdict=under" className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold tracking-widest uppercase bg-[#00A699] text-white hover:bg-white hover:text-black transition-colors">
                        See under-market listings
                    </Link>
                    <Link href="/properties" className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold tracking-widest uppercase border border-white/20 text-white hover:border-white transition-colors">
                        Browse all
                    </Link>
                </div>
            </div>
        </div>
    );
}
