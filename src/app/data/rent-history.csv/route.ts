import { createPublicClient } from '@/utils/supabase/public';
import { toCsv, csvResponse, getAreaNames } from '../_csv';

export const revalidate = 3600;

const HEADER = ['snapshot_date', 'area', 'area_id', 'bhk', 'median_rent_inr', 'p25', 'p75', 'listings'];
const FILENAME = 'bangalore-rent-history.csv';
const PAGE = 1000;
const MAX_ROWS = 500_000;

interface Row { snapshot_date: string; area_id: number; property_type: string; median: number; p25: number | null; p75: number | null; count: number }

export async function GET() {
    const supabase = createPublicClient();
    const names = await getAreaNames(supabase);

    const all: Row[] = [];
    for (let from = 0; from < MAX_ROWS; from += PAGE) {
        const { data, error } = await supabase
            .from('area_rent_history')
            .select('snapshot_date, area_id, property_type, median, p25, p75, count')
            .order('snapshot_date')
            .order('area_id')
            .order('property_type')
            .range(from, from + PAGE - 1);
        if (error || !data) {
            // Table missing (phase 15 not applied): honest empty file.
            if (from === 0) return csvResponse(toCsv(HEADER, []), FILENAME);
            // Failed mid-way: never serve (or cache) a silently truncated dataset.
            // Throwing keeps the previously cached version during ISR revalidation.
            throw new Error(`rent-history export failed at row ${from}`);
        }
        all.push(...(data as Row[]));
        if (data.length < PAGE) break;
    }

    const rows = all.map(r => [r.snapshot_date, names.get(r.area_id) ?? '', r.area_id, r.property_type, r.median, r.p25, r.p75, r.count]);
    return csvResponse(toCsv(HEADER, rows), FILENAME);
}
