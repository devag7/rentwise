import type { SupabaseClient } from '@supabase/supabase-js';

/** Listings with >= this many community reports are hidden from browse. */
export const REPORT_HIDE_THRESHOLD = 3;

/**
 * Returns the set of property_ids that have accumulated enough community
 * reports to be hidden. Cheap: one grouped select over a small table.
 */
export async function getHiddenPropertyIds(supabase: SupabaseClient): Promise<Set<number>> {
    const { data, error } = await supabase
        .from('listing_reports')
        .select('property_id');

    if (error || !data) return new Set();

    const counts = new Map<number, number>();
    for (const row of data as { property_id: number }[]) {
        counts.set(row.property_id, (counts.get(row.property_id) || 0) + 1);
    }
    const hidden = new Set<number>();
    for (const [id, n] of counts) {
        if (n >= REPORT_HIDE_THRESHOLD) hidden.add(id);
    }
    return hidden;
}
