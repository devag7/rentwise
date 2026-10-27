import type { SupabaseClient } from '@supabase/supabase-js';

/** Listings with >= this many community reports are hidden from browse. */
export const REPORT_HIDE_THRESHOLD = 3;

/**
 * Returns the set of property_ids that have accumulated enough community
 * reports to be hidden. Uses the `listing_report_counts` view (phase 15);
 * falls back to counting raw rows on older databases.
 */
export async function getHiddenPropertyIds(supabase: SupabaseClient): Promise<Set<number>> {
    const { data, error } = await supabase
        .from('listing_report_counts')
        .select('property_id, reports')
        .gte('reports', REPORT_HIDE_THRESHOLD);

    if (!error && data) {
        return new Set((data as { property_id: number }[]).map(r => r.property_id));
    }

    const { data: raw } = await supabase.from('listing_reports').select('property_id').limit(10000);
    const counts = new Map<number, number>();
    for (const row of (raw || []) as { property_id: number }[]) {
        counts.set(row.property_id, (counts.get(row.property_id) || 0) + 1);
    }
    const hidden = new Set<number>();
    for (const [id, n] of counts) if (n >= REPORT_HIDE_THRESHOLD) hidden.add(id);
    return hidden;
}
