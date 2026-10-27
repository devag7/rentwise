import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

/**
 * Shared listing pipeline helpers for the scraper Edge Functions.
 *
 * ZERO FAKE DATA: callers pass only values actually scraped. Unknown fields
 * stay null. Scraped contact names / phone numbers are personal data we never
 * verified, so they are never stored (always written as null).
 */

export interface ScrapedListing {
    external_id: string;
    area_name: string;
    address: string;
    property_type: string; // '1RK' | '1BHK' | '2BHK' | ... — required, never defaulted
    rent: number;
    size: number | null; // carpet / built-up sqft; null when not scraped
    bathrooms: number | null;
    parking: boolean | null;
    furnishing_status: string | null;
    deposit: number | null;
    description: string;
    source_url: string;
    image_url: string;
    google_maps_link: string;
    latitude: number | null;
    longitude: number | null;
}

export interface UpsertResult {
    inserted: number;
    updated: number;
    skipped: number;
}

/** Area key: case/space/punctuation-insensitive ("HSR layout" == "Hsr Layout" == "HSR-Layout").
 *  Matches the areas_name_key_uniq index (phase 17). */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Scraped "locality" fields are sometimes street addresses or landmarks. */
const looksLikeLocality = (s: string) => !/[0-9,]/.test(s) && s.trim().split(/\s+/).length <= 4 && s.trim().length >= 3;

/** All areas loaded once; missing ones are inserted in bulk. Case-insensitive. */
export class AreaIndex {
    private byName = new Map<string, number>();
    private names = new Map<number, string>();

    private constructor(private sb: SupabaseClient) {}

    static async load(sb: SupabaseClient): Promise<AreaIndex> {
        const idx = new AreaIndex(sb);
        await idx.reload();
        return idx;
    }

    async reload(): Promise<void> {
        const { data, error } = await this.sb.from('areas').select('area_id, name').order('area_id');
        if (error) throw new Error(`areas load failed: ${error.message}`);
        this.byName.clear();
        this.names.clear();
        for (const a of (data ?? []) as Array<{ area_id: number; name: string }>) {
            if (!a.name) continue;
            // Duplicates (pre-phase-17): keep the oldest, canonical row.
            if (!this.byName.has(norm(a.name))) this.byName.set(norm(a.name), a.area_id);
            this.names.set(a.area_id, a.name);
        }
    }

    get(name: string): number | null {
        return this.byName.get(norm(name)) ?? null;
    }

    /** Known area whose name appears inside free text (longest match), e.g. an address. */
    findIn(text: string): string | null {
        const t = norm(text);
        let best: string | null = null;
        for (const [key, id] of this.byName) {
            if (key.length >= 5 && t.includes(key) && (!best || key.length > norm(best).length)) best = this.names.get(id) ?? null;
        }
        return best;
    }

    /** Canonical area name for a scraped locality, or null if it can't be placed. */
    resolve(locality: string, address?: string | null): string | null {
        const known = this.get(locality);
        if (known != null) return this.names.get(known) ?? null;
        const inside = this.findIn(`${locality} ${address ?? ''}`);
        if (inside) return inside;
        return looksLikeLocality(locality) ? locality.trim().replace(/\s+/g, ' ') : null;
    }

    nameOf(id: number): string | null {
        return this.names.get(id) ?? null;
    }

    all(): Array<{ area_id: number; name: string }> {
        return [...this.names].map(([area_id, name]) => ({ area_id, name }));
    }

    /** Insert any names not yet in `areas`. */
    async ensure(names: string[]): Promise<void> {
        const missing = new Map<string, string>();
        for (const n of names) {
            const clean = n.trim().replace(/\s+/g, ' ');
            if (clean && !this.byName.has(norm(clean))) missing.set(norm(clean), clean);
        }
        if (!missing.size) return;
        const rows = [...missing.values()].map((name) => ({ name }));
        const { error } = await this.sb.from('areas').insert(rows);
        if (error) {
            // e.g. a concurrent insert hit a unique constraint — fall back to one by one.
            for (const r of rows) await this.sb.from('areas').insert(r);
        }
        await this.reload();
    }
}

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

/**
 * Upsert scraped listings by external_id.
 * - Existing rows: refresh rent / image / deposit / coords (when scraped),
 *   scraped_at, last_seen_at = now, is_active = true; clear contact fields.
 * - New rows: full insert with last_seen_at = now, is_active = true.
 * external_id is not assumed to be UNIQUE in the DB, so this does a lookup
 * instead of ON CONFLICT.
 */
export async function upsertListings(
    sb: SupabaseClient,
    listings: ScrapedListing[],
    areas: AreaIndex,
): Promise<UpsertResult> {
    const result: UpsertResult = { inserted: 0, updated: 0, skipped: 0 };
    const now = new Date().toISOString();

    // De-duplicate within the batch (last one wins).
    const byId = new Map<string, ScrapedListing>();
    for (const l of listings) byId.set(l.external_id, l);
    result.skipped += listings.length - byId.size;
    const rows = [...byId.values()];
    if (!rows.length) return result;

    // Map scraped localities onto canonical areas; skip ones that can't be placed
    // (street addresses with no known locality inside) instead of creating junk areas.
    for (const r of rows) {
        const resolved = areas.resolve(r.area_name, r.description);
        r.area_name = resolved ?? '';
    }
    await areas.ensure(rows.map((r) => r.area_name).filter(Boolean));

    const existing = new Set<string>();
    for (const ids of chunk(rows.map((r) => r.external_id), 150)) {
        const { data, error } = await sb.from('properties').select('external_id').in('external_id', ids);
        if (error) throw new Error(`properties lookup failed: ${error.message}`);
        for (const d of (data ?? []) as Array<{ external_id: string }>) existing.add(d.external_id);
    }

    const toInsert: Record<string, unknown>[] = [];
    const toUpdate: ScrapedListing[] = [];
    for (const l of rows) {
        const areaId = l.area_name ? areas.get(l.area_name) : null;
        if (!areaId) {
            result.skipped++;
            continue;
        }
        if (existing.has(l.external_id)) {
            toUpdate.push(l);
            continue;
        }
        toInsert.push({
            area_id: areaId,
            address: l.address,
            property_type: l.property_type,
            rent: l.rent,
            size: l.size,
            bathrooms: l.bathrooms,
            parking: l.parking,
            furnishing_status: l.furnishing_status,
            deposit: l.deposit,
            description: l.description,
            source: 'scraped',
            source_url: l.source_url,
            contact_name: null,
            contact_phone: null,
            external_id: l.external_id,
            scraped_at: now,
            image_url: l.image_url,
            google_maps_link: l.google_maps_link,
            latitude: l.latitude,
            longitude: l.longitude,
            landlord_id: null,
            last_seen_at: now,
            is_active: true,
        });
    }

    for (const batch of chunk(toInsert, 100)) {
        const { error } = await sb.from('properties').insert(batch);
        if (!error) {
            result.inserted += batch.length;
            continue;
        }
        console.warn(`[upsert] batch insert failed (${error.message}); retrying row by row`);
        for (const row of batch) {
            const { error: e } = await sb.from('properties').insert(row);
            if (e) {
                result.skipped++;
                console.warn(`[upsert] ${row.external_id}: ${e.message}`);
            } else result.inserted++;
        }
    }

    for (const batch of chunk(toUpdate, 10)) {
        await Promise.all(batch.map(async (l) => {
            const patch: Record<string, unknown> = {
                rent: l.rent,
                scraped_at: now,
                last_seen_at: now,
                is_active: true,
                contact_name: null,
                contact_phone: null,
            };
            if (l.image_url) patch.image_url = l.image_url;
            if (l.deposit != null) patch.deposit = l.deposit;
            if (l.latitude != null && l.longitude != null) {
                patch.latitude = l.latitude;
                patch.longitude = l.longitude;
            }
            const { error } = await sb.from('properties').update(patch).eq('external_id', l.external_id);
            if (error) {
                result.skipped++;
                console.warn(`[upsert] update ${l.external_id}: ${error.message}`);
            } else result.updated++;
        }));
    }

    return result;
}

/** Single-listing convenience wrapper around upsertListings. */
export function upsertListing(sb: SupabaseClient, listing: ScrapedListing, areas: AreaIndex): Promise<UpsertResult> {
    return upsertListings(sb, [listing], areas);
}
