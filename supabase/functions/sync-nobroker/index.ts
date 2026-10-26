/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />
/**
 * sync-nobroker — NoBroker listings via the Apify actor thirdwatch/nobroker-scraper.
 * Port of scripts/apify_sync.ts. Invoked by pg_cron (phase 16) with the service role key.
 *
 * Secrets: APIFY_API_TOKEN.
 *
 * ZERO FAKE DATA (stricter than the old script):
 *   - property_type null when bhk unknown → row skipped (no '2BHK' default)
 *   - size null when carpet area unknown (no 500 default)
 *   - contact_phone / contact_name never stored
 */
import { adminClient, requireServiceRole } from '../_shared/supabase.ts';
import { json } from '../_shared/cors.ts';
import { AreaIndex, upsertListings, type ScrapedListing } from '../_shared/listings.ts';

const ACTOR = 'thirdwatch~nobroker-scraper';

const BANGALORE_LOCALITIES = [
    'Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Marathahalli',
    'Bellandur', 'Jayanagar', 'BTM Layout', 'Electronic City', 'Banashankari',
];

interface ApifyItem {
    listing_id?: string;
    title?: string;
    bhk?: number | string;
    bathrooms?: number;
    carpet_area_sqft?: number;
    price_inr?: number;
    furnishing?: string;
    deposit_inr?: number;
    locality?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    thumbnail?: string;
    url?: string;
}

function propertyType(item: ApifyItem): string | null {
    if (item.title && /\b1\s*-?\s*RK\b/i.test(item.title)) return '1RK';
    const n = typeof item.bhk === 'string' ? parseInt(item.bhk, 10) : item.bhk;
    if (typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 9) return `${n}BHK`;
    return null;
}

function furnishing(f?: string): string | null {
    if (!f) return null;
    const s = f.toLowerCase();
    if (s.startsWith('semi')) return 'Semi-Furnished';
    if (s.startsWith('full')) return 'Furnished';
    if (s.startsWith('un')) return 'Unfurnished';
    return f;
}

const validCoord = (lat?: number, lng?: number) =>
    typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) &&
    lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

function toListing(item: ApifyItem): ScrapedListing | null {
    if (!item.title || !item.price_inr || !item.url) return null;
    const rent = Math.round(item.price_inr);
    if (rent < 3000 || rent > 1000000) return null;
    const type = propertyType(item);
    if (!type) return null;

    const hasCoords = validCoord(item.latitude, item.longitude);
    const areaName = (item.locality || '').trim();
    if (!areaName) return null; // no area → can't be placed in a market

    return {
        external_id: `nobroker-${item.listing_id || item.title.replace(/\s+/g, '').slice(0, 15)}`,
        area_name: areaName,
        address: item.title,
        property_type: type,
        rent,
        size: item.carpet_area_sqft && item.carpet_area_sqft > 50 ? Math.round(item.carpet_area_sqft) : null,
        bathrooms: item.bathrooms && item.bathrooms > 0 && item.bathrooms < 10 ? item.bathrooms : null,
        parking: null, // actor doesn't expose parking; never invent it
        furnishing_status: furnishing(item.furnishing),
        deposit: item.deposit_inr && item.deposit_inr > 0 ? Math.round(item.deposit_inr) : null,
        description: item.address || `Property in ${areaName}`,
        source_url: item.url,
        // NoBroker only serves the assets.nobroker.in "medium" thumbnail publicly;
        // the images[] array (original size) returns 404.
        image_url: item.thumbnail || '',
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

    const input = {
        searchMode: 'rent',
        city: 'Bangalore',
        localities: BANGALORE_LOCALITIES,
        ownerOnly: false,
        maxResults: 80,
    };

    let items: ApifyItem[];
    try {
        // Token sent as a header rather than ?token= so it never lands in URL logs.
        const res = await fetch(
            `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?timeout=140`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(input),
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
        const out = { fetched: items.length, inserted: r.inserted, updated: r.updated, skipped: skipped + r.skipped };
        console.log('[sync-nobroker]', JSON.stringify(out));
        return json(out);
    } catch (e) {
        return json({ error: (e as Error).message }, 500);
    }
});
