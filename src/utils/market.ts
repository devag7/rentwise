/**
 * Comps-based market statistics.
 * Median asking rent per (area, property_type) computed from live listings —
 * the honest version of a "fair value" verdict. No invented numbers:
 * verdicts only exist where enough real comparables exist.
 */

export interface MarketStat {
    median: number;
    count: number;
}

export type MarketStatsMap = Record<string, MarketStat>;

/** Minimum comparables before we're willing to call a verdict. */
export const MIN_COMPS = 3;

/** Rent within ±5% of median counts as "at market". */
export const AT_MARKET_BAND = 0.05;

export function marketKey(areaId: number | null | undefined, propertyType: string | null | undefined): string {
    return `${areaId ?? 'x'}|${propertyType ?? 'x'}`;
}

export function computeMarketStats(
    rows: Array<{ area_id: number | null; property_type: string | null; rent: number | null }>
): MarketStatsMap {
    const groups = new Map<string, number[]>();
    for (const r of rows) {
        if (!r.rent || r.rent <= 0) continue;
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
