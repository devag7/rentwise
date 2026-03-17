/**
 * RentWise Apify Scraper v6 — NoBroker via Apify
 *
 * Calls the NoBroker Property Search Scraper on Apify for rental listings
 * across 50+ Bangalore localities, then normalizes and inserts into Supabase.
 *
 * Designed to run as a cron job (6 AM + 6 PM IST daily) via cron.ts.
 *
 * Sources:
 *   🔵 NoBroker — Direct owner listings with contacts, real coords, photos
 *
 * Requirements:
 *   APIFY_API_TOKEN — from Apify Console > Settings > Integrations
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

// ================================================================
// CONFIG
// ================================================================
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!APIFY_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[SCRAPER] Missing environment variables: APIFY_API_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// NoBroker image base URL
const NB_IMG_BASE = 'https://assets.nobroker.in/images/';
const NB_IMG_FALLBACK_BASE = 'https://assets.nobroker.in/';

// ================================================================
// BANGALORE AREAS — 50+ localities with real coords + placeIds
// ================================================================
interface Area {
    name: string;
    lat: number;
    lon: number;
    placeId: string;
}

const BLR_AREAS: Area[] = [
    { name: 'Koramangala', lat: 12.9352, lon: 77.6245, placeId: 'ChIJbYUDxb4WujsRZ7T9Uffa-5Q' },
    { name: 'Indiranagar', lat: 12.9784, lon: 77.6408, placeId: 'ChIJbZd-qQWrjsRe7G5a9GUZ9U' },
    { name: 'Whitefield', lat: 12.9698, lon: 77.7500, placeId: 'ChIJ2SxkNcWOrjsRa6-j5DGdw-0' },
    { name: 'HSR Layout', lat: 12.9081, lon: 77.6476, placeId: 'ChIJN0na0b0WrjsRe1dBR1mHYC0' },
    { name: 'Marathahalli', lat: 12.9591, lon: 77.6974, placeId: 'ChIJE6PElb8XrjsReJVMYm1g8HE' },
    { name: 'Bellandur', lat: 12.9258, lon: 77.6773, placeId: 'ChIJd8BlQ2BZrjsRa8GQtEBl_JA' },
    { name: 'Jayanagar', lat: 12.9250, lon: 77.5938, placeId: 'ChIJmwmASf0VrjsRtCYGXhH-xXo' },
    { name: 'BTM Layout', lat: 12.9166, lon: 77.6101, placeId: 'ChIJRQ8InBsVrjsRXFd1nR35NiM' },
    { name: 'Electronic City', lat: 12.8399, lon: 77.6770, placeId: 'ChIJR5-LW5QUrjsR6FpGA0FhLs8' },
    { name: 'Banashankari', lat: 12.9256, lon: 77.5468, placeId: 'ChIJvT9xJpMVrjsRnizjhz0D23Q' },
    { name: 'Rajajinagar', lat: 12.9916, lon: 77.5560, placeId: 'ChIJ1WklIqAVrjsRjW7rrDGlCGQ' },
    { name: 'Malleshwaram', lat: 13.0035, lon: 77.5681, placeId: 'ChIJrY_vFUMVrjsRFI-k8mowvJA' },
    { name: 'Hebbal', lat: 13.0358, lon: 77.5970, placeId: 'ChIJf_p7RwsWrjsRNyqP97Q9bKY' },
    { name: 'Yelahanka', lat: 13.1005, lon: 77.5963, placeId: 'ChIJH3UWyqoXrjsRmL8E4X6DKPI' },
    { name: 'Sarjapur Road', lat: 12.9121, lon: 77.6848, placeId: 'ChIJq4kfr3EarjsR9MJt6w2HHd8' },
    { name: 'JP Nagar', lat: 12.9063, lon: 77.5857, placeId: 'ChIJhSF03OgVrjsRQLc_zFYg1dA' },
    { name: 'Hennur', lat: 13.0391, lon: 77.6473, placeId: 'ChIJU7-GDXwWrjsRA7hVGxAYuNQ' },
    { name: 'Thanisandra', lat: 13.0592, lon: 77.6256, placeId: 'ChIJD00R5H0WrjsRxq1ANjuNjZ4' },
    { name: 'Brookefield', lat: 12.9755, lon: 77.7140, placeId: 'ChIJd8BlQ2BZrjsRa8GQtEBl_JA' },
    { name: 'KR Puram', lat: 13.0003, lon: 77.6956, placeId: 'ChIJEysz2EkXrjsR2RkHt3UaIOA' },
    { name: 'Kalyan Nagar', lat: 13.0228, lon: 77.6382, placeId: 'ChIJ-5u6mXkWrjsRqZ5J_Y9w4C0' },
    { name: 'Kammanahalli', lat: 13.0151, lon: 77.6454, placeId: 'ChIJSTbj7HgWrjsRjrYpZ3AvbCI' },
    { name: 'Old Airport Road', lat: 12.9568, lon: 77.6596, placeId: 'ChIJayDGwMATrjsR3ceXkcPU2BI' },
    { name: 'Basavanagudi', lat: 12.9430, lon: 77.5754, placeId: 'ChIJ40UWCcAVrjsRmjSZzXRGhb8' },
    { name: 'Sadashivanagar', lat: 13.0050, lon: 77.5791, placeId: 'ChIJ_-7qVUMVrjsRluMp-97C7Ww' },
    { name: 'Yeshwanthpur', lat: 13.0225, lon: 77.5467, placeId: 'ChIJFY7A5jgVrjsRKjFXsZ5bEUU' },
    { name: 'Bannerghatta Road', lat: 12.8976, lon: 77.5972, placeId: 'ChIJx3u7M3QVrjsR-4yHTLFf8LY' },
    { name: 'Kanakapura Road', lat: 12.8834, lon: 77.5745, placeId: 'ChIJh2KuSroVrjsRVYkEzjBU6ac' },
    { name: 'Bommanahalli', lat: 12.8964, lon: 77.6337, placeId: 'ChIJzSOiqsQUrjsRMuvqCEiVkAk' },
    { name: 'Mahadevapura', lat: 12.9937, lon: 77.6983, placeId: 'ChIJsyRiXCkXrjsRzZCGfEb4CxI' },
    { name: 'Domlur', lat: 12.9619, lon: 77.6394, placeId: 'ChIJRxE8vBMWrjsRr1GhQHNlOeY' },
    { name: 'Frazer Town', lat: 12.9856, lon: 77.6125, placeId: 'ChIJ4YRhqLcWrjsRT-nj6Jgt_Gs' },
    { name: 'RT Nagar', lat: 13.0226, lon: 77.5940, placeId: 'ChIJc_c0mXcWrjsRSLKVVb5HBfk' },
    { name: 'Vijayanagar', lat: 12.9784, lon: 77.5395, placeId: 'ChIJadKSYKAVrjsR0cRJP1tFqak' },
    { name: 'Nagarbhavi', lat: 12.9677, lon: 77.5101, placeId: 'ChIJ42j_WcYVrjsRDr_yx4VXB8g' },
    { name: 'Uttarahalli', lat: 12.8961, lon: 77.5386, placeId: 'ChIJDXCVLJcVrjsRR7oe05J5EMk' },
    { name: 'Ramamurthy Nagar', lat: 13.0118, lon: 77.6632, placeId: 'ChIJm7wL53oWrjsRPxvkLnxG7-Q' },
    { name: 'Horamavu', lat: 13.0252, lon: 77.6605, placeId: 'ChIJzb0HXXsWrjsRLDPrmGlyGiI' },
    { name: 'Varthur', lat: 12.9389, lon: 77.7463, placeId: 'ChIJ2ZieFUxZrjsRtBn_jI6zJpI' },
    { name: 'Kasavanahalli', lat: 12.9160, lon: 77.7019, placeId: 'ChIJreFJEWlZrjsRSIVi9V9k1MY' },
    { name: 'Panathur', lat: 12.9351, lon: 77.7147, placeId: 'ChIJQ8L4f2xZrjsR0HjZ-b-bAZ0' },
    { name: 'CV Raman Nagar', lat: 12.9864, lon: 77.6701, placeId: 'ChIJX7xfuCgXrjsRJpbJi2bbnj8' },
    { name: 'Begur', lat: 12.8737, lon: 77.6152, placeId: 'ChIJO35JvFsUrjsRW8QpF_AW-u8' },
    { name: 'Wilson Garden', lat: 12.9527, lon: 77.5975, placeId: 'ChIJyYoLYdkVrjsRIjJiAGouVn0' },
    { name: 'Richmond Town', lat: 12.9608, lon: 77.6006, placeId: 'ChIJq2fKkdQVrjsRh7HZGYkHBvo' },
    { name: 'Hulimavu', lat: 12.8868, lon: 77.6162, placeId: 'ChIJ9UbLbkQUrjsRCuoH81VPvMc' },
    { name: 'Kadugodi', lat: 12.9883, lon: 77.7549, placeId: 'ChIJ6fBMqpFZrjsRJXORE8i6ioA' },
    { name: 'Harlur', lat: 12.9111, lon: 77.6952, placeId: 'ChIJmZ87WmpZrjsRrmgolITaSJY' },
    { name: 'Kundalahalli', lat: 12.9742, lon: 77.7099, placeId: 'ChIJd8BlQ2BZrjsRa8GQtEBl_JA' },
    { name: 'Arekere', lat: 12.8822, lon: 77.6197, placeId: 'ChIJjVQaHkQUrjsR3D7YhT5z9V8' },
];

// ================================================================
// HELPERS
// ================================================================
function buildNoBrokerUrl(area: Area): string {
    const searchParam = Buffer.from(JSON.stringify([{
        lat: area.lat,
        lon: area.lon,
        placeId: area.placeId,
        placeName: area.name,
        showMap: false,
    }])).toString('base64');

    return `https://www.nobroker.in/property/rent/bangalore/${encodeURIComponent(area.name)}` +
        `?searchParam=${searchParam}&radius=2.0&city=bangalore&locality=${encodeURIComponent(area.name)}`;
}

function buildPhoto(item: Record<string, unknown>): string[] {
    const imgs: string[] = [];

    // 1) Use pre-built thumbnail_image (already full URL from NoBroker actor)
    const thumb = String(item.thumbnail_image || '');
    if (thumb.startsWith('http') || thumb.startsWith('//')) {
        imgs.push(thumb.startsWith('//') ? `https:${thumb}` : thumb);
    }

    // 2) Use original_image_url as second image
    const orig = String(item.original_image_url || '');
    if (orig && (orig.startsWith('http') || orig.startsWith('//'))) {
        const url = orig.startsWith('//') ? `https:${orig}` : orig;
        if (!imgs.includes(url)) imgs.push(url);
    }

    // 3) Build URLs from photos array for up to 4 total
    const photos = (item.photos as Array<Record<string, unknown>>) || [];
    const imgId = String(item.id || '');
    for (const photo of photos) {
        if (imgs.length >= 4) break;
        const map = photo.images_map as Record<string, string> | undefined;
        if (!map) continue;
        // Use medium quality; fall back to large or original
        const filename = map.medium || map.large || map.original || '';
        if (!filename) continue;
        let url: string;
        if (filename.startsWith('http')) {
            url = filename;
        } else if (imgId) {
            url = `${NB_IMG_BASE}${imgId}/${filename}`;
        } else {
            url = `${NB_IMG_FALLBACK_BASE}${filename}`;
        }
        if (!imgs.includes(url)) imgs.push(url);
    }

    return imgs.filter(u => u && u.startsWith('https'));
}

function isValidBangalore(lat: number, lng: number): boolean {
    return lat >= 12.7 && lat <= 13.2 && lng >= 77.3 && lng <= 77.9;
}

function cleanPhone(input: string): string {
    const digits = input.replace(/\D/g, '');
    if (digits.length >= 10) return `+91 ${digits.slice(-10)}`;
    return '';
}

function parseBhk(type: string): string {
    if (!type) return '2BHK';
    if (type.includes('4PLUS') || type.includes('4+')) return '4+BHK';
    const m = type.match(/(\d)/);
    if (m) return `${m[1]}BHK`;
    return '2BHK';
}

// ================================================================
// CALL APIFY ACTOR
// ================================================================
async function callNoBrokerActor(urls: string[], maxItems: number): Promise<{
    runId: string;
    datasetId: string;
    success: boolean;
}> {
    const actorId = 'cwk6KCUCDc1iM1gUS'; // NoBroker Property Search Scraper

    const resp = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            max_items_per_url: maxItems,
            max_retries_per_url: 2,
            proxy: {
                useApifyProxy: true,
                apifyProxyGroups: ['RESIDENTIAL'],
                apifyProxyCountry: 'IN',
            },
            urls,
        }),
    });

    if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Apify actor call failed: ${resp.status} ${err}`);
    }

    const data = await resp.json() as {
        data: { id: string; defaultDatasetId: string; status: string };
    };
    const runId = data.data.id;
    const datasetId = data.data.defaultDatasetId;

    console.log(`  [Apify] Run started: ${runId}, dataset: ${datasetId}`);

    // Poll for completion
    let status = data.data.status;
    let attempts = 0;
    while (status !== 'SUCCEEDED' && status !== 'FAILED' && status !== 'ABORTED' && attempts < 60) {
        await new Promise(r => setTimeout(r, 5000));
        const pollResp = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
        const pollData = await pollResp.json() as { data: { status: string } };
        status = pollData.data.status;
        attempts++;
        if (attempts % 6 === 0) process.stdout.write(`.`);
    }

    return { runId, datasetId, success: status === 'SUCCEEDED' };
}

// ================================================================
// FETCH DATASET ITEMS
// ================================================================
async function fetchDataset(datasetId: string, limit: number = 200): Promise<Record<string, unknown>[]> {
    const resp = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=${limit}`,
    );
    if (!resp.ok) return [];
    return resp.json() as Promise<Record<string, unknown>[]>;
}

// ================================================================
// NORMALIZE NOBROKER ITEM → SUPABASE ROW
// ================================================================
function normalizeNoBroker(item: Record<string, unknown>, areaName: string) {
    const lat = parseFloat(String(item.latitude || '0'));
    const lng = parseFloat(String(item.longitude || '0'));

    // NoBroker actor always returns property_type:'BUY' — expected_rent is the actual monthly rent
    const rent = Math.round(parseFloat(String(item.expected_rent || item.rent || '0')));

    if (!isValidBangalore(lat, lng)) return null;
    if (!rent || rent < 3000 || rent > 300000) return null;

    const ownerName = String(item.owner_name || '');
    if (!ownerName || ownerName.length < 2) return null;

    const photos = buildPhoto(item);
    if (photos.length === 0) return null;

    const bhk = parseBhk(String(item.type || item.type_desc || ''));
    const society = String(item.society || '');
    const locality = String(item.locality || item.nb_locality || areaName);
    const street = String(item.street || item.complete_street_name || '');
    const sqft = parseInt(String(item.property_size || '0'));
    const bath = parseInt(String(item.bathroom || '1'));
    const parking = String(item.parking || 'NONE') !== 'NONE';
    const furn = String(item.furnishing || 'SEMI_FURNISHED')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
    const id = String(item.id || '');
    const detailUrl = String(item.detail_url || '');
    const sourceUrl = id
        ? `https://www.nobroker.in${detailUrl || '/property/rent/bangalore/' + encodeURIComponent(locality) + '/' + id + '/detail'}`
        : `https://www.nobroker.in/property/rent/bangalore/${encodeURIComponent(locality)}`;

    const address = society
        ? `${bhk} in ${society}, ${locality}`
        : street
        ? `${bhk} at ${street.substring(0, 60)}, ${locality}`
        : `${bhk} in ${locality}, Bangalore`;

    const description = [
        `${bhk} ${furn.toLowerCase()} apartment in ${locality}, Bangalore.`,
        sqft > 0 ? `${sqft} sq.ft.` : null,
        `${bath} bath.`,
        parking ? 'Parking available.' : null,
        `Direct owner: ${ownerName}. No brokerage.`,
    ].filter(Boolean).join(' ');

    return {
        area_name: areaName,
        address,
        property_type: bhk,
        rent,
        size: sqft || 800,
        bathrooms: bath,
        parking,
        furnishing_status: furn,
        description,
        source: 'scraped',
        source_url: sourceUrl,
        contact_name: ownerName,
        contact_phone: '', // NoBroker requires login for phone — we use owner name
        external_id: `nb-${id || `${areaName.replace(/\s+/g, '')}-${Date.now()}`}`,
        scraped_at: new Date().toISOString(),
        image_url: photos.join(','),
        google_maps_link: `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`,
        landlord_id: null,
        lat,
        lng,
    };
}

// ================================================================
// INSERT TO SUPABASE
// ================================================================
async function getOrCreateArea(name: string): Promise<number | null> {
    const { data: existing } = await supabase
        .from('areas')
        .select('area_id')
        .eq('name', name)
        .single();
    if (existing?.area_id) return existing.area_id;

    const { data: newArea } = await supabase
        .from('areas')
        .insert({ name })
        .select('area_id')
        .single();
    return newArea?.area_id ?? null;
}

async function insertToSupabase(rows: ReturnType<typeof normalizeNoBroker>[]): Promise<number> {
    let count = 0;
    for (const row of rows) {
        if (!row) continue;
        const { area_name, lat, lng, ...rest } = row;
        const areaId = await getOrCreateArea(area_name);
        if (!areaId) continue;

        const dbRow = { ...rest, area_id: areaId };

        const { error } = await supabase
            .from('properties')
            .upsert(dbRow, { onConflict: 'external_id' });

        if (!error) {
            count++;
        } else if (!error.message.includes('duplicate')) {
            // Try plain insert
            const { error: ie } = await supabase.from('properties').insert(dbRow);
            if (!ie) count++;
        }
    }
    return count;
}

// ================================================================
// MAIN
// ================================================================
export async function runScraper(): Promise<void> {
    const start = Date.now();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  RentWise Apify Scraper v6 — NoBroker`);
    console.log(`  ${new Date().toISOString()}`);
    console.log(`  Areas: ${BLR_AREAS.length} Bangalore localities`);
    console.log(`${'='.repeat(60)}\n`);

    if (!APIFY_TOKEN) {
        console.error('[SCRAPER] APIFY_API_TOKEN not set!');
        return;
    }

    // Run areas in batches of 5 URLs per Apify call (to stay within memory + cost)
    const BATCH_SIZE = 5;
    let totalFetched = 0;
    let totalInserted = 0;

    for (let i = 0; i < BLR_AREAS.length; i += BATCH_SIZE) {
        const batch = BLR_AREAS.slice(i, i + BATCH_SIZE);
        const urls = batch.map(buildNoBrokerUrl);

        process.stdout.write(`[Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(BLR_AREAS.length / BATCH_SIZE)}] `);
        process.stdout.write(`${batch.map(a => a.name).join(', ')} → `);

        try {
            const { datasetId, success } = await callNoBrokerActor(urls, 20);
            if (!success) {
                console.log(`FAILED`);
                continue;
            }

            const items = await fetchDataset(datasetId, 200);
            totalFetched += items.length;

            const rows = items
                .map((item, idx) => normalizeNoBroker(item, batch[idx % batch.length]?.name || batch[0].name))
                .filter(Boolean);

            const inserted = await insertToSupabase(rows);
            totalInserted += inserted;
            console.log(`${items.length} fetched, ${inserted} inserted`);
        } catch (e: any) {
            console.log(`ERROR: ${e.message}`);
        }

        // Small delay between batches
        if (i + BATCH_SIZE < BLR_AREAS.length) {
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    // Stale cleanup — remove scraped listings older than 3 days
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: staleData } = await supabase
        .from('properties')
        .delete()
        .eq('source', 'scraped')
        .lt('scraped_at', threeDaysAgo)
        .select('property_id');
    const staleRemoved = staleData?.length || 0;

    const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  Complete in ${elapsed} minutes`);
    console.log(`  Total fetched: ${totalFetched}`);
    console.log(`  Total inserted/updated: ${totalInserted}`);
    console.log(`  Stale listings removed: ${staleRemoved}`);
    console.log(`${'='.repeat(60)}\n`);
}

// Direct execution
runScraper().catch(console.error);
