import { createClient } from '@/utils/supabase/server';
import FilterBar from '@/components/FilterBar';
import PropertiesList from './PropertiesList';
import { computeMarketStats, marketKey, getVerdict } from '@/utils/market';
import { getHiddenPropertyIds } from '@/utils/reports';
import WatchArea from '@/components/WatchArea';

export const metadata = {
    title: 'Flats for rent in Bangalore with fair-rent verdicts',
    description:
        'Browse verified Bangalore rental listings priced against real market comparables. Filter by area, budget, BHK — no brokers, no login needed.',
    alternates: { canonical: '/properties' },
};

export default async function Properties({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const supabase = await createClient();

    let query = supabase.from('properties').select(`
        *,
        areas ( name )
    `);

    // Extract filters from URL searchParams
    const area_id = params.area_id as string;
    const property_type = params.property_type as string;
    const min_rent = params.min_rent as string;
    const max_rent = params.max_rent as string;
    const furnishing_status = params.furnishing_status as string;
    const parking = params.parking as string;
    const source = params.source as string;
    const sort_by = params.sort_by as string || 'newest';
    const verdict_filter = params.verdict as string;
    const posted_within = params.posted_within as string;

    if (area_id) query = query.eq('area_id', area_id);
    if (property_type) query = query.eq('property_type', property_type);
    if (min_rent) query = query.gte('rent', min_rent);
    if (max_rent) query = query.lte('rent', max_rent);
    if (furnishing_status) query = query.eq('furnishing_status', furnishing_status);
    if (parking === 'true') query = query.eq('parking', true);
    if (source) query = query.eq('source', source);
    if (posted_within && /^\d+$/.test(posted_within)) {
        // Server Component: runs once per request, not in a render loop —
        // Date.now() is safe here despite the react-hooks/purity rule.
        // eslint-disable-next-line react-hooks/purity
        const cutoff = new Date(Date.now() - parseInt(posted_within) * 86400000).toISOString();
        query = query.gte('scraped_at', cutoff);
    }

    // Sorting logic
    if (sort_by === 'price_asc') {
        query = query.order('rent', { ascending: true });
    } else if (sort_by === 'price_desc') {
        query = query.order('rent', { ascending: false });
    } else if (sort_by === 'size_desc') {
        query = query.order('size', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    // Market medians come from the FULL inventory (unfiltered) so verdicts
    // aren't distorted by whatever filters the user has applied.
    const [{ data, error }, { data: compRows }, hidden] = await Promise.all([
        query,
        supabase.from('properties').select('area_id, property_type, rent'),
        getHiddenPropertyIds(supabase),
    ]);

    const marketStats = computeMarketStats(compRows || []);

    let formattedData = data && !error
        ? data
            .filter(item => !hidden.has(item.property_id)) // drop community-flagged listings
            .map(item => ({
                ...item,
                area_name: item.areas?.name || 'Unknown Area'
            }))
        : [];

    // Verdict filter — RentWise's signature. Can't be a SQL filter because
    // the verdict is computed against per-(area,type) medians.
    if (verdict_filter) {
        const want = verdict_filter === 'under' ? 'UNDER MARKET'
            : verdict_filter === 'over' ? 'OVER MARKET'
                : verdict_filter === 'at' ? 'AT MARKET' : null;
        if (want) {
            formattedData = formattedData.filter(p => {
                const v = getVerdict(p.rent, marketStats[marketKey(p.area_id, p.property_type)]);
                return v?.label === want;
            });
        }
    }

    // Live social proof, computed from real verdicts (not a vanity counter).
    const totalAnalyzed = (compRows || []).length;
    const underMarketNow = formattedData.filter(p => {
        const v = getVerdict(p.rent, marketStats[marketKey(p.area_id, p.property_type)]);
        return v?.label === 'UNDER MARKET';
    }).length;

    return (
        <div className="w-full pt-32 pb-24 px-6 bg-[#0A0A0A] text-white min-h-screen selection:bg-[#FF385C] selection:text-white">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-sm font-bold tracking-widest text-[#FF385C] uppercase mb-4">Live Inventory</h2>
                    <h3 className="text-5xl font-black tracking-tighter text-white">Analyzed Properties.</h3>
                </div>

                {/* Social proof — computed live from real comps, not a vanity metric */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/10 border border-white/10 mb-12">
                    <div className="bg-[#0A0A0A] p-5">
                        <p className="text-3xl font-black text-white tracking-tighter">{totalAnalyzed.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Listings priced</p>
                    </div>
                    <div className="bg-[#0A0A0A] p-5">
                        <p className="text-3xl font-black text-[#00A699] tracking-tighter">{underMarketNow}</p>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Under market now</p>
                    </div>
                    <div className="bg-[#0A0A0A] p-5 col-span-2 sm:col-span-1">
                        <p className="text-3xl font-black text-white tracking-tighter">{Object.keys(marketStats).length}</p>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Area·BHK markets tracked</p>
                    </div>
                </div>

                <FilterBar />

                <PropertiesList properties={formattedData} marketStats={marketStats} />

                <WatchArea />
            </div>
        </div>
    );
}
