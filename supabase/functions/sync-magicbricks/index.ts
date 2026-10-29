/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />
/**
 * sync-magicbricks — MagicBricks rentals via the Apify actor thirdwatch/magicbricks-scraper.
 * MagicBricks returns 403 to cloud IPs, so the old direct (cheerio) scraper never
 * got data from Supabase. Invoked once a day by pg_cron (phase 19).
 *
 * Secrets: APIFY_API_TOKEN (shared with sync-nobroker).
 * Cost: the actor bills ~$0.003 per listing, so MAX_RESULTS caps each run.
 *
 * ZERO FAKE DATA:
 *   - property_type from bhk only; listings without it are skipped
 *   - size null when no carpet/super area; parking null unless stated
 *   - contact_name / phone are never stored
 */
import { adminClient, requireServiceRole } from '../_shared/supabase.ts';
import { json } from '../_shared/cors.ts';
import { AreaIndex, upsertListings, type ScrapedListing } from '../_shared/listings.ts';

const ACTOR = 'thirdwatch~magicbricks-scraper';
const MAX_RESULTS = 60;

const BANGALORE_LOCALITIES = [
    'HSR Layout', 'Koramangala', 'Indiranagar', 'Whitefield',
    'Marathahalli', 'Bellandur', 'BTM Layout', 'Electronic City',
    'JP Nagar', 'Jayanagar', 'Hebbal', 'Sarjapur Road',
    'Yelahanka', 'Banashankari', 'Kalyan Nagar', 'Brookefield',
];

// One run a day, 4 localities each → all 16 every 4 days. POST {"slot": n} overrides.
const PER_RUN = 4;
function localitiesForSlot(override?: number): string[] {
    const slots = Math.ceil(BANGALORE_LOCALITIES.length / PER_RUN);
    const slot = Number.isInteger(override) && override! >= 0 && override! < slots
        ? override!
        : Math.floor(Date.now() / 86_400_000) % slots;
    return BANGALORE_LOCALITIES.slice(slot * PER_RUN, (slot + 1) * PER_RUN);
}

interface ApifyItem {
    listing_id?: string | number;
    title?: string;
    propertyType?: string;
    bhk?: number | string;
    bathrooms?: number | string;
    carpet_area_sqft?: number;
    super_area_sqft?: number;
    price_inr?: number;
    deposit_inr?: number;
    furnishing?: string;
    locality?: string;
    project_name?: string;
    latitude?: number;
    longitude?: number;
    parking?: string | boolean;
    images?: string[];
    url?: string;
}

const num = (v: unknown): number | null => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

function propertyType(item: ApifyItem): string | null {
    if (item.propertyType === 'studio' || (item.title && /\b1\s*-?\s*RK\b/i.test(item.title))) return '1RK';
    const n = num(item.bhk);
    if (n != null && Number.isInteger(n) && n >= 1 && n <= 9) return `${n}BHK`;
    return null;
}

function furnishing(f?: string): string | null {
    if (!f) return null;
    const s = f.toLowerCase();
    if (s.startsWith('semi')) return 'Semi-Furnished';
    if (s.startsWith('full') || s === 'furnished') return 'Furnished';
    if (s.startsWith('un')) return 'Unfurnished';
    return null;
}

function parking(p: ApifyItem['parking']): boolean | null {
    if (typeof p === 'boolean') return p;
    if (!p) return null;
    const s = p.toLowerCase();
    if (/\b(no|none|not available)\b/.test(s)) return false;
    if (/\d|covered|open|yes|available/.test(s)) return true;
    return null;
}

const validCoord = (lat?: number, lng?: number) =>
    typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) &&
    lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

function toListing(item: ApifyItem): ScrapedListing | null {
    if (!item.listing_id || !item.title || !item.price_inr || !item.url) return null;
    const rent = Math.round(item.price_inr);
    if (rent < 3000 || rent > 1000000) return null;
    const type = propertyType(item);
    if (!type) return null;
    const areaName = (item.locality || '').trim();
    if (!areaName) return null;

    const area = num(item.carpet_area_sqft) ?? num(item.super_area_sqft);
    const baths = num(item.bathrooms);
    const deposit = num(item.deposit_inr);
    const hasCoords = validCoord(item.latitude, item.longitude);
    const thumb = (item.images ?? []).find((u) => typeof u === 'string' && u.startsWith('https://')) ?? '';
    // The actor returns 180px thumbnails; the same photo is served at 470px.
    const image = thumb.replace('/Photo_h180_w240/', '/Photo_h470_w1080/').replace(/_180_240\.(\w+)$/, '_470_1080.$1');

    return {
        external_id: `magicbricks-${item.listing_id}`,
        area_name: areaName,
        address: item.title,
        property_type: type,
        rent,
        size: area && area > 50 ? Math.round(area) : null,
        bathrooms: baths && baths > 0 && baths < 10 ? baths : null,
        parking: parking(item.parking),
        furnishing_status: furnishing(item.furnishing),
        deposit: deposit && deposit > 0 ? Math.round(deposit) : null,
        // Short and factual: upsertListings searches this text for a known area name.
        description: [item.project_name, areaName].filter(Boolean).join(', '),
        source_url: item.url,
        image_url: image,
        google_maps_link: hasCoords ? `https://www.google.com/maps?q=${item.latitude},${item.longitude}` : '',
        latitude: hasCoords ? item.latitude! : null,
        longitude: hasCoords ? item.longitude! : null,
    };
}

Deno.serve(async (req) => {
    const denied = requireServiceRole(req);
    if (denied) return denied;

    const token = Deno.env.get('APIFY_API_TOKEN');
    if (!token) return json({ error: 'APIFY_API_TOKEN not set' }, 500);

    let slotOverride: number | undefined;
    try {
        const b = await req.json();
        if (Number.isInteger(b?.slot)) slotOverride = b.slot;
    } catch {
        // no body
    }
    const localities = localitiesForSlot(slotOverride);

    let items: ApifyItem[];
    try {
        const res = await fetch(
            `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?timeout=140`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ searchMode: 'rent', city: 'Bangalore', localities, maxResults: MAX_RESULTS }),
                signal: AbortSignal.timeout(145_000),
            },
        );
        if (!res.ok) {
            const text = await res.text();
            return json({ error: `Apify ${res.status}`, detail: text.slice(0, 500) }, 502);
        }
        const body = await res.json();
        items = Array.isArray(body) ? body : [];
    } catch (e) {
        return json({ error: 'Apify request failed', detail: (e as Error).message }, 502);
    }

    const listings: ScrapedListing[] = [];
    let skipped = 0;
    for (const item of items) {
        const l = toListing(item);
        if (l) listings.push(l);
        else skipped++;
    }

    try {
        const sb = adminClient();
        const areas = await AreaIndex.load(sb);
        const r = await upsertListings(sb, listings, areas);
        const out = { localities, fetched: items.length, inserted: r.inserted, updated: r.updated, skipped: skipped + r.skipped };
        console.log('[sync-magicbricks]', JSON.stringify(out));
        return json(out);
    } catch (e) {
        return json({ error: (e as Error).message }, 500);
    }
});
