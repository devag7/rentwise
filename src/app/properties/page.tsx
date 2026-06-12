import { createClient } from '@/utils/supabase/server';
import FilterBar from '@/components/FilterBar';
import PropertiesList from './PropertiesList';
import { computeMarketStats } from '@/utils/market';
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

    if (area_id) query = query.eq('area_id', area_id);
    if (property_type) query = query.eq('property_type', property_type);
    if (min_rent) query = query.gte('rent', min_rent);
    if (max_rent) query = query.lte('rent', max_rent);
    if (furnishing_status) query = query.eq('furnishing_status', furnishing_status);
    if (parking === 'true') query = query.eq('parking', true);
    if (source) query = query.eq('source', source);

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
    const [{ data, error }, { data: compRows }] = await Promise.all([
        query,
        supabase.from('properties').select('area_id, property_type, rent'),
    ]);

    const marketStats = computeMarketStats(compRows || []);

    const formattedData = data && !error ? data.map(item => ({
        ...item,
        area_name: item.areas?.name || 'Unknown Area'
    })) : [];

    return (
        <div className="w-full pt-32 pb-24 px-6 bg-[#0A0A0A] text-white min-h-screen selection:bg-[#FF385C] selection:text-white">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <h2 className="text-sm font-bold tracking-widest text-[#FF385C] uppercase mb-4">Live Inventory</h2>
                    <h3 className="text-5xl font-black tracking-tighter text-white">Analyzed Properties.</h3>
                </div>

                <FilterBar />

                <PropertiesList properties={formattedData} marketStats={marketStats} />

                <WatchArea />
            </div>
        </div>
    );
}
