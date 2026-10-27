import { createPublicClient } from '@/utils/supabase/public';
import { toCsv, csvResponse, getAreaNames, todayIST } from '../_csv';

export const revalidate = 3600;

const HEADER = ['area', 'area_id', 'bhk', 'median_rent_inr', 'p25', 'p75', 'listings', 'as_of'];
const FILENAME = 'bangalore-rent-index.csv';

interface Row { area_id: number; property_type: string; median: number; p25: number | null; p75: number | null; count: number }

export async function GET() {
    const supabase = createPublicClient();
    const [{ data, error }, names] = await Promise.all([
        supabase
            .from('market_stats')
            .select('area_id, property_type, median, p25, p75, count')
            .order('area_id')
            .order('property_type'),
        getAreaNames(supabase),
    ]);

    // View missing (phase 15 not applied) or DB unreachable: headers only, never invented rows.
    if (error || !data) return csvResponse(toCsv(HEADER, []), FILENAME);

    const asOf = todayIST();
    const rows = (data as Row[])
        .map(r => [names.get(r.area_id) ?? '', r.area_id, r.property_type, r.median, r.p25, r.p75, r.count, asOf])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[2]).localeCompare(String(b[2])));

    return csvResponse(toCsv(HEADER, rows), FILENAME);
}
