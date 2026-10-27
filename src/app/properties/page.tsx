import Link from 'next/link';
import FilterBar from '@/components/FilterBar';
import PropertiesList from './PropertiesList';
import WatchArea from '@/components/WatchArea';
import { createPublicClient } from '@/utils/supabase/public';
import { getMarketStats, marketKey, getVerdict, getActiveListingCount } from '@/utils/market';
import { getHiddenPropertyIds } from '@/utils/reports';
import { CARD_COLUMNS, toProperty, queryActive, getAreas } from '@/utils/listings';

export const metadata = {
    title: 'Flats for rent in Bangalore with fair-rent verdicts',
    description:
        'Browse Bangalore rental listings priced against real market comparables. Filter by area, budget, BHK and market verdict — no brokers, no login needed.',
    alternates: { canonical: '/properties' },
};

const PAGE_SIZE = 48;
// Verdict filtering happens after the SQL query, so fetch a bounded window.
const FETCH_WINDOW = 400;

type Params = { [key: string]: string | string[] | undefined };
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';

export default async function Properties({ searchParams }: { searchParams: Promise<Params> }) {
    const params = await searchParams;
    const supabase = createPublicClient();

    const area_id = str(params.area_id);
    const property_type = str(params.property_type);
    const min_rent = str(params.min_rent);
    const max_rent = str(params.max_rent);
    const furnishing_status = str(params.furnishing_status);
    const parking = str(params.parking);
    const source = str(params.source);
    const sort_by = str(params.sort_by) || 'newest';
    const verdict_filter = str(params.verdict);
    const posted_within = str(params.posted_within);
    const page = Math.max(1, parseInt(str(params.page) || '1') || 1);

    // Server Component: runs once per request, not in a render loop.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();

    const listingsPromise = queryActive((activeOnly) => {
        let q = supabase.from('properties').select(CARD_COLUMNS);
        if (activeOnly) q = q.eq('is_active', true);
        if (/^\d+$/.test(area_id)) q = q.eq('area_id', area_id);
        if (property_type) q = q.eq('property_type', property_type);
        if (/^\d+$/.test(min_rent)) q = q.gte('rent', min_rent);
        if (/^\d+$/.test(max_rent)) q = q.lte('rent', max_rent);
        if (furnishing_status) q = q.eq('furnishing_status', furnishing_status);
        if (parking === 'true') q = q.eq('parking', true);
        if (source) q = q.eq('source', source);
        if (/^\d+$/.test(posted_within)) {
            q = q.gte('created_at', new Date(now - parseInt(posted_within) * 86400000).toISOString());
        }
        if (sort_by === 'price_asc') q = q.order('rent', { ascending: true });
        else if (sort_by === 'price_desc') q = q.order('rent', { ascending: false });
        else if (sort_by === 'size_desc') q = q.order('size', { ascending: false, nullsFirst: false });
        else q = q.order('created_at', { ascending: false });
        return q.limit(FETCH_WINDOW);
    });

    // Medians come from the full active inventory (a DB view), so verdicts
    // aren't distorted by whatever filters the user applied.
    const [{ data }, marketStats, hidden, areas, totalActive] = await Promise.all([
        listingsPromise,
        getMarketStats(supabase),
        getHiddenPropertyIds(supabase),
        getAreas(supabase),
        getActiveListingCount(supabase),
    ]);

    let listings = ((data || []) as Record<string, unknown>[])
        .map(toProperty)
        .filter(p => !hidden.has(p.property_id));

    const want = { under: 'UNDER MARKET', over: 'OVER MARKET', at: 'AT MARKET' }[verdict_filter];
    if (want) {
        listings = listings.filter(p =>
            getVerdict(p.rent, marketStats[marketKey(p.area_id, p.property_type)])?.label === want
        );
    }

    const underMarketNow = listings.filter(p =>
        getVerdict(p.rent, marketStats[marketKey(p.area_id, p.property_type)])?.label === 'UNDER MARKET'
    ).length;

    const shown = listings.slice(0, page * PAGE_SIZE);
    const hasMore = listings.length > shown.length;
    const nextParams = new URLSearchParams(
        Object.entries(params).flatMap(([k, v]) => (v ? [[k, str(v)]] : []))
    );
    nextParams.set('page', String(page + 1));

    return (
        <div className="w-full pt-28 pb-24 px-4 sm:px-6 bg-[#0A0A0A] text-white min-h-screen selection:bg-[#FF385C] selection:text-white">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <p className="text-sm font-bold tracking-widest text-[#FF385C] uppercase mb-4">Live inventory</p>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white">Flats for rent in Bangalore, priced against real comps.</h1>
                </div>

                <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 mb-10">
                    <div className="bg-[#0A0A0A] p-4 sm:p-5">
                        <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{totalActive.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Active listings</p>
                    </div>
                    <div className="bg-[#0A0A0A] p-4 sm:p-5">
                        <p className="text-2xl sm:text-3xl font-black text-[#00A699] tracking-tighter">{underMarketNow}</p>
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Under market here</p>
                    </div>
                    <div className="bg-[#0A0A0A] p-4 sm:p-5">
                        <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{Object.keys(marketStats).length}</p>
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Markets tracked</p>
                    </div>
                </div>

                <FilterBar areas={areas} />

                <PropertiesList properties={shown} total={listings.length} marketStats={marketStats} />

                {hasMore && (
                    <div className="mt-12 flex justify-center">
                        <Link
                            href={`/properties?${nextParams.toString()}`}
                            scroll={false}
                            className="px-8 py-4 border border-white/20 text-white text-xs font-bold tracking-widest uppercase hover:border-white transition-colors"
                        >
                            Show more flats
                        </Link>
                    </div>
                )}

                <WatchArea areas={areas} />
            </div>
        </div>
    );
}
