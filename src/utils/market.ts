/**
 * Comps-based market statistics.
 * Median asking rent per (area, property_type) computed from live listings —
 * the honest version of a "fair value" verdict. No invented numbers:
 * verdicts only exist where enough real comparables exist.
 *
 * The heavy lifting happens in Postgres (`market_stats` view, phase 15).
 * `computeMarketStats` remains as a fallback for databases that haven't
 * applied the migration yet.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MarketStat {
    median: number;
    count: number;
    p25?: number;
    p75?: number;
}

export type MarketStatsMap = Record<string, MarketStat>;

/** Minimum comparables before we're willing to call a verdict. */
export const MIN_COMPS = 3;

/** Rent within ±5% of median counts as "at market". */
export const AT_MARKET_BAND = 0.05;

export const BHK_TYPES = ['1BHK', '2BHK', '3BHK'] as const;

export function marketKey(areaId: number | null | undefined, propertyType: string | null | undefined): string {
    return `${areaId ?? 'x'}|${propertyType ?? 'x'}`;
}

export function computeMarketStats(
    rows: Array<{ area_id: number | null; property_type: string | null; rent: number | null }>
): MarketStatsMap {
    const groups = new Map<string, number[]>();
    for (const r of rows) {
        if (!r.rent || r.rent <= 0 || r.area_id == null || !r.property_type) continue;
        const key = marketKey(r.area_id, r.property_type);
        const arr = groups.get(key);
        if (arr) arr.push(r.rent);
        else groups.set(key, [r.rent]);
    }

    const stats: MarketStatsMap = {};
    for (const [key, rents] of groups) {
        if (rents.length < MIN_COMPS) continue;
        rents.sort((a, b) => a - b);
        const mid = Math.floor(rents.length / 2);
        const median = rents.length % 2 ? rents[mid] : Math.round((rents[mid - 1] + rents[mid]) / 2);
        stats[key] = { median, count: rents.length };
    }
    return stats;
}

interface StatRow { area_id: number; property_type: string; median: number; p25: number | null; p75: number | null; count: number }

/** Page through a table so PostgREST's max-rows cap can't silently truncate it. */
async function fetchAllRows<T>(
    build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
    pageSize = 1000,
    maxRows = 20000
): Promise<T[]> {
    const out: T[] = [];
    for (let from = 0; from < maxRows; from += pageSize) {
        const { data, error } = await build(from, from + pageSize - 1);
        if (error || !data) break;
        out.push(...data);
        if (data.length < pageSize) break;
    }
    return out;
}

/**
 * Market stats for all markets (or one area/type). Uses the `market_stats`
 * view; falls back to computing from active rows if the view is missing.
 */
export async function getMarketStats(
    supabase: SupabaseClient,
    filter?: { areaId?: number; propertyType?: string }
): Promise<MarketStatsMap> {
    let q = supabase.from('market_stats').select('area_id, property_type, median, p25, p75, count');
    if (filter?.areaId != null) q = q.eq('area_id', filter.areaId);
    if (filter?.propertyType) q = q.eq('property_type', filter.propertyType);
    const { data, error } = await q;

    if (!error && data) {
        const stats: MarketStatsMap = {};
        for (const r of data as StatRow[]) {
            stats[marketKey(r.area_id, r.property_type)] = {
                median: r.median,
                count: r.count,
                p25: r.p25 ?? undefined,
                p75: r.p75 ?? undefined,
            };
        }
        return stats;
    }

    // Fallback (pre-migration): paginate raw rows and compute in JS.
    const rows = await fetchAllRows<{ area_id: number | null; property_type: string | null; rent: number | null }>(
        (from, to) => {
            let r = supabase.from('properties').select('area_id, property_type, rent');
            if (filter?.areaId != null) r = r.eq('area_id', filter.areaId);
            if (filter?.propertyType) r = r.eq('property_type', filter.propertyType);
            return r.range(from, to);
        }
    );
    return computeMarketStats(rows);
}

/** Count of active listings (cheap HEAD count). */
export async function getActiveListingCount(supabase: SupabaseClient): Promise<number> {
    const { count, error } = await supabase
        .from('properties')
        .select('property_id', { count: 'exact', head: true })
        .eq('is_active', true);
    if (!error) return count ?? 0;
    const { count: all } = await supabase.from('properties').select('property_id', { count: 'exact', head: true });
    return all ?? 0;
}

export interface Verdict {
    label: 'UNDER MARKET' | 'AT MARKET' | 'OVER MARKET';
    percent: number; // absolute deviation from median, rounded
    median: number;
    count: number;
}

export function getVerdict(rent: number, stat: MarketStat | undefined): Verdict | null {
    if (!stat || !rent || rent <= 0) return null;
    const deviation = (rent - stat.median) / stat.median;
    const percent = Math.round(Math.abs(deviation) * 100);
    const label: Verdict['label'] =
        Math.abs(deviation) <= AT_MARKET_BAND ? 'AT MARKET'
            : deviation < 0 ? 'UNDER MARKET'
                : 'OVER MARKET';
    return { label, percent, median: stat.median, count: stat.count };
}

export function formatINR(n: number): string {
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/** URL slug for an area name: "HSR Layout" → "hsr-layout". */
export function areaSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
