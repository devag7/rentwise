import { cache } from 'react';
import { createPublicClient } from '@/utils/supabase/public';
import { getMarketStats, marketKey, areaSlug, BHK_TYPES, MIN_COMPS, formatINR, type MarketStat } from '@/utils/market';
import { CARD_COLUMNS, toProperty, queryActive, getAreas } from '@/utils/listings';
import { getHiddenPropertyIds } from '@/utils/reports';
import type { Property } from '@/components/PropertyCard';

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rentwise.devshipit.com';

export type Bhk = (typeof BHK_TYPES)[number];

export const HISTORY_DAYS = 180;
export const LISTING_LIMIT = 12;

/** "2bhk" → "2BHK"; anything else → null. */
export function bhkFromSlug(slug: string): Bhk | null {
    const upper = slug.toUpperCase();
    return (BHK_TYPES as readonly string[]).includes(upper) ? (upper as Bhk) : null;
}

export function bhkSlug(bhk: string): string {
    return bhk.toLowerCase();
}

export function areaPath(name: string): string {
    return `/bangalore/rent/${areaSlug(name)}`;
}

/** Today's date in IST as YYYY-MM-DD (data is read live at render time). */
export function todayIST(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

/** "2026-10-26" → "26 Oct 2026". */
export function formatDate(iso: string): string {
    const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function daysAgoISO(days: number): string {
    return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

/** Areas, deduped per request between generateMetadata and the page. */
export const getAllAreas = cache(async () => getAreas(createPublicClient()));

export const findAreaBySlug = cache(async (slug: string) => {
    const areas = await getAllAreas();
    return areas.find(a => areaSlug(a.name) === slug) ?? null;
});

/** Market stats for one area, keyed by property_type. */
export const getAreaStats = cache(async (areaId: number): Promise<Partial<Record<string, MarketStat>>> => {
    const all = await getMarketStats(createPublicClient(), { areaId });
    const out: Partial<Record<string, MarketStat>> = {};
    for (const [key, stat] of Object.entries(all)) {
        const type = key.slice(key.indexOf('|') + 1);
        if (key === marketKey(areaId, type) && stat.count >= MIN_COMPS) out[type] = stat;
    }
    return out;
});

export interface PaidStat {
    median: number;
    deposit_months: number | null;
    count: number;
}

/** Crowdsourced "actually paid" aggregates (k ≥ 3 enforced by the view). Empty if the view is missing. */
export const getPaidStats = cache(async (areaId: number): Promise<Partial<Record<string, PaidStat>>> => {
    const { data, error } = await createPublicClient()
        .from('paid_rent_stats')
        .select('property_type, median, deposit_months, count')
        .eq('area_id', areaId);
    if (error || !data) return {};
    const out: Partial<Record<string, PaidStat>> = {};
    for (const r of data as Array<{ property_type: string; median: number; deposit_months: number | string | null; count: number }>) {
        out[r.property_type] = {
            median: r.median,
            deposit_months: r.deposit_months == null ? null : Number(r.deposit_months),
            count: r.count,
        };
    }
    return out;
});

export interface HistoryPoint {
    date: string;
    value: number;
}

/** Daily median snapshots for the last HISTORY_DAYS days, keyed by property_type. */
export const getAreaHistory = cache(async (areaId: number, propertyType?: string): Promise<Partial<Record<string, HistoryPoint[]>>> => {
    let q = createPublicClient()
        .from('area_rent_history')
        .select('snapshot_date, property_type, median')
        .eq('area_id', areaId)
        .gte('snapshot_date', daysAgoISO(HISTORY_DAYS));
    if (propertyType) q = q.eq('property_type', propertyType);
    const { data, error } = await q.order('snapshot_date', { ascending: true }).limit(1000);
    if (error || !data) return {};
    const out: Partial<Record<string, HistoryPoint[]>> = {};
    for (const r of data as Array<{ snapshot_date: string; property_type: string; median: number }>) {
        (out[r.property_type] ??= []).push({ date: r.snapshot_date, value: r.median });
    }
    return out;
});

/** Cheapest active listings in an area (optionally one BHK), minus community-hidden ones. */
export async function getCheapestListings(areaId: number, propertyType?: string): Promise<Property[]> {
    const supabase = createPublicClient();
    const [{ data }, hidden] = await Promise.all([
        queryActive((activeOnly) => {
            let q = supabase.from('properties').select(CARD_COLUMNS).eq('area_id', areaId).gt('rent', 0);
            if (activeOnly) q = q.eq('is_active', true);
            if (propertyType) q = q.eq('property_type', propertyType);
            return q.order('rent', { ascending: true }).limit(LISTING_LIMIT + 12);
        }),
        getHiddenPropertyIds(supabase),
    ]);
    return ((data || []) as Record<string, unknown>[])
        .map(toProperty)
        .filter(p => !hidden.has(p.property_id))
        .slice(0, LISTING_LIMIT);
}

export function listingsHref(areaId: number, propertyType?: string): string {
    const qs = new URLSearchParams({ area_id: String(areaId) });
    if (propertyType) qs.set('property_type', propertyType);
    return `/properties?${qs.toString()}`;
}

export { formatINR };
