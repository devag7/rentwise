import type { SupabaseClient } from '@supabase/supabase-js';
import type { Property } from '@/components/PropertyCard';

/**
 * Columns a listing card needs. Deliberately excludes `image_data`
 * (legacy base64 blobs that made list payloads huge) and contact fields.
 */
export const CARD_COLUMNS =
    'property_id, area_id, address, property_type, rent, size, image_url, bathrooms, deposit, parking, furnishing_status, latitude, longitude, source, source_url, scraped_at, created_at, areas ( name )';

type Row = Record<string, unknown> & { areas?: { name: string } | { name: string }[] | null };

export function toProperty(row: Row): Property {
    const areas = Array.isArray(row.areas) ? row.areas[0] : row.areas;
    return { ...(row as unknown as Property), area_name: areas?.name || 'Bangalore' };
}

/** Postgres "undefined column" — the phase 15 migration hasn't been applied yet. */
export function isMissingColumn(error: unknown): boolean {
    return !!error && typeof error === 'object' && (error as { code?: string }).code === '42703';
}

/**
 * Runs a listings query restricted to active listings, retrying without the
 * `is_active` filter on databases that predate phase 15.
 */
export async function queryActive<T>(
    build: (activeOnly: boolean) => PromiseLike<{ data: T | null; error: unknown }>
): Promise<{ data: T | null; error: unknown }> {
    const res = await build(true);
    if (isMissingColumn(res.error)) return build(false);
    return res;
}

export async function getAreas(supabase: SupabaseClient): Promise<{ area_id: number; name: string }[]> {
    const { data } = await supabase.from('areas').select('area_id, name').order('name');
    return (data || []) as { area_id: number; name: string }[];
}
