import Link from 'next/link';
import FilterBar from '@/components/FilterBar';
import PropertiesList from './PropertiesList';
import WatchArea from '@/components/WatchArea';
import Container from '@/components/ui/Container';
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
        <div className="pt-28 pb-24 sm:pt-32">
            <Container>
                <header className="max-w-3xl">
                    <h1 className="text-title-1 text-balance">Flats for rent in Bangalore</h1>
                    <p className="mt-3 text-lead text-label-2 text-balance">
                        Every rent is compared with real flats of the same size in the same area.
                    </p>
                </header>

                <dl className="card mt-8 grid grid-cols-3 divide-x divide-separator">
                    <div className="min-w-0 px-4 py-4 sm:px-6 sm:py-5">
                        <dt className="text-footnote text-label-2">Live listings</dt>
                        <dd className="mt-1 text-title-2 num">{totalActive.toLocaleString('en-IN')}</dd>
                    </div>
                    <div className="min-w-0 px-4 py-4 sm:px-6 sm:py-5">
                        <dt className="text-footnote text-label-2">Under market in these results</dt>
                        <dd className="mt-1 text-title-2 text-good num">{underMarketNow.toLocaleString('en-IN')}</dd>
                    </div>
                    <div className="min-w-0 px-4 py-4 sm:px-6 sm:py-5">
                        <dt className="text-footnote text-label-2">Markets with enough data</dt>
                        <dd className="mt-1 text-title-2 num">{Object.keys(marketStats).length.toLocaleString('en-IN')}</dd>
                    </div>
                </dl>

                <div className="mt-8">
                    <FilterBar areas={areas} />
                </div>

                <PropertiesList properties={shown} total={listings.length} marketStats={marketStats} />

                {hasMore && (
                    <div className="mt-12 flex justify-center">
                        <Link href={`/properties?${nextParams.toString()}`} scroll={false} className="btn btn-secondary">
                            Show more flats
                        </Link>
                    </div>
                )}

                <WatchArea areas={areas} />
            </Container>
        </div>
    );
}
