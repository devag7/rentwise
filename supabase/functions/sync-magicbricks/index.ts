/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />
/**
 * sync-magicbricks — MagicBricks rental listings (cheerio). Port of scripts/scraper.ts.
 * Invoked by pg_cron (phase 16) with the service role key.
 *
 * BATCHING: Edge Functions have a ~150s wall clock, so each invocation scrapes
 * one batch of BATCH_SIZE areas. The batch is chosen deterministically from the
 * clock — no cursor table:
 *
 *     batch = floor(Date.now() / 10 min) % numBatches      (30 areas / 6 = 5 batches)
 *
 * Phase 16 fires at :35, :45, :55 past 00 and 12 UTC — three consecutive
 * 10-minute slots each time. A day has 144 slots and 12h = 72 slots ≡ 2 (mod 5),
 * so the morning run covers batches k, k+1, k+2 and the evening run k+2, k+3, k+4:
 * all 5 batches every day. POST {"batch": n} overrides the choice (manual runs).
 *
 * ZERO FAKE DATA (stricter than the old script):
 *   - no default BHK: listings whose BHK can't be read from the URL are skipped
 *   - no BHK-based size estimate: size is null unless carpet/built-up area is in the page
 *   - phone numbers and contact names are never stored
 */
import * as cheerio from 'npm:cheerio@1';
import { adminClient, requireServiceRole } from '../_shared/supabase.ts';
import { json } from '../_shared/cors.ts';
import { AreaIndex, upsertListings, type ScrapedListing } from '../_shared/listings.ts';

interface AreaConfig { name: string; slug: string; lat: number; lng: number }

const BANGALORE_AREAS: AreaConfig[] = [
    { name: 'Indiranagar',       slug: 'Indiranagar',        lat: 12.9784, lng: 77.6408 },
    { name: 'Koramangala',       slug: 'Koramangala',        lat: 12.9352, lng: 77.6245 },
    { name: 'Whitefield',        slug: 'Whitefield',         lat: 12.9698, lng: 77.7500 },
    { name: 'HSR Layout',        slug: 'HSR-Layout',         lat: 12.9116, lng: 77.6474 },
    { name: 'Marathahalli',      slug: 'Marathahalli',       lat: 12.9591, lng: 77.7009 },
    { name: 'Bellandur',         slug: 'Bellandur',          lat: 12.9261, lng: 77.6757 },
    { name: 'Jayanagar',         slug: 'Jayanagar',          lat: 12.9308, lng: 77.5838 },
    { name: 'BTM Layout',        slug: 'BTM-Layout',         lat: 12.9166, lng: 77.6101 },
    { name: 'Electronic City',   slug: 'Electronic-City',    lat: 12.8456, lng: 77.6603 },
    { name: 'Banashankari',      slug: 'Banashankari',       lat: 12.9256, lng: 77.5468 },
    { name: 'Rajajinagar',       slug: 'Rajajinagar',        lat: 12.9880, lng: 77.5525 },
    { name: 'Malleshwaram',      slug: 'Malleshwaram',       lat: 13.0035, lng: 77.5646 },
    { name: 'Hebbal',            slug: 'Hebbal',             lat: 13.0358, lng: 77.5970 },
    { name: 'Yelahanka',         slug: 'Yelahanka',          lat: 13.1005, lng: 77.5963 },
    { name: 'Sarjapur Road',     slug: 'Sarjapur-Road',      lat: 12.9107, lng: 77.6872 },
    { name: 'JP Nagar',          slug: 'JP-Nagar',           lat: 12.9063, lng: 77.5857 },
    { name: 'Hennur',            slug: 'Hennur',             lat: 13.0450, lng: 77.6370 },
    { name: 'Thanisandra',       slug: 'Thanisandra',        lat: 13.0594, lng: 77.6346 },
    { name: 'Brookefield',       slug: 'Brookefield',        lat: 12.9692, lng: 77.7142 },
    { name: 'KR Puram',          slug: 'KR-Puram',           lat: 13.0077, lng: 77.6990 },
    { name: 'Kalyan Nagar',      slug: 'Kalyannagar',        lat: 13.0270, lng: 77.6401 },
    { name: 'Kammanahalli',      slug: 'Kammanahalli',       lat: 13.0122, lng: 77.6404 },
    { name: 'Old Airport Road',  slug: 'Old-Airport-Road',   lat: 12.9660, lng: 77.6470 },
    { name: 'Basavanagudi',      slug: 'Basavanagudi',       lat: 12.9432, lng: 77.5750 },
    { name: 'Sadashivanagar',    slug: 'Sadashivanagar',     lat: 13.0067, lng: 77.5811 },
    { name: 'Yeshwanthpur',      slug: 'Yeshwanthpur',       lat: 13.0220, lng: 77.5512 },
    { name: 'Bannerghatta Road', slug: 'Bannerghatta-Road',  lat: 12.8872, lng: 77.5969 },
    { name: 'Kanakapura Road',   slug: 'Kanakapura-Road',    lat: 12.8899, lng: 77.5640 },
    { name: 'Bommanahalli',      slug: 'Bommanahalli',       lat: 12.8989, lng: 77.6183 },
    { name: 'Mahadevapura',      slug: 'Mahadevapura',       lat: 12.9920, lng: 77.6930 },
];

const BATCH_SIZE = 6;
const SLOT_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20_000;
const BETWEEN_AREAS_MS = 2_000;
/** Stop starting new areas after this much elapsed time (wall clock ~150s). */
const TIME_BUDGET_MS = 110_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function decodeUnicode(str: string): string {
    return str
        .replace(/\\\\u([0-9a-fA-F]{4})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\u([0-9a-fA-F]{4})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)));
}

/** BHK from the MagicBricks listing URL, or null — never a default. */
function parseBHK(url: string): string | null {
    if (/(^|[^a-z])1-?RK([^a-z]|$)/i.test(url)) return '1RK';
    const m = url.match(/(\d)-BHK/i) || url.match(/(\d)BHK/i);
    return m && m[1] !== '0' ? `${m[1]}BHK` : null;
}

function lastInt(context: string, field: string): number | null {
    const m = context.match(new RegExp(`"${field}"\\s*:\\s*(\\d+)`, 'g'))?.pop();
    const n = m ? parseInt(m.match(/(\d+)$/)?.[1] || '0', 10) : 0;
    return n > 0 ? n : null;
}

function parseAreaPage(html: string, area: AreaConfig): ScrapedListing[] {
    const $ = cheerio.load(html);
    const listings: ScrapedListing[] = [];

    $('script').each((_i, el) => {
        const scriptText = $(el).html() || '';
        if (!scriptText.includes('allImgPath')) return;

        const parts = scriptText.split('"allImgPath"');
        for (let i = 1; i < parts.length; i++) {
            // Context: 2000 chars before this allImgPath + up to 12000 after
            // (carpet/builtUpArea can be 4000+ chars after the image array).
            const before = parts[i - 1].slice(-2000);
            const after = parts[i];
            const context = before + after.substring(0, 12000);

            const arrayMatch = after.match(/:\s*\[([^\]]*)\]/);
            if (!arrayMatch) continue;
            const rawImgs = arrayMatch[1].match(/"([^"]+)"/g)?.map((s) => decodeUnicode(s.replace(/"/g, ''))) || [];
            const images = rawImgs.filter((u) => u.startsWith('http')).slice(0, 4);
            if (!images.length) continue;

            const priceMatches = [...context.matchAll(/"price"\s*:\s*"?(\d+)/g)].map((m) => parseInt(m[1], 10));
            const rent = priceMatches.find((p) => p >= 3000 && p <= 500000) || 0;
            if (!rent) continue;

            // Search only `after` so we don't pick up the previous listing's URL.
            const propUrlMatch = after.match(/"url"\s*:\s*"([^"]*(?:for-rent|FOR-Rent|-BHK-)[^"]*)"/i);
            const propUrl = propUrlMatch ? decodeUnicode(propUrlMatch[1]) : null;
            if (!propUrl) continue; // no listing URL → no BHK, no stable id, no source link

            const bhk = parseBHK(propUrl);
            if (!bhk) continue;

            // Real sqft only (carpet preferred, then built-up). No estimates.
            const sqft = lastInt(context, 'carpet') ?? lastInt(context, 'builtUpArea');

            const furnRaw = context.match(/"furnStatusD"\s*:\s*"([^"]+)"/)?.[1]?.trim();
            const furn = furnRaw && furnRaw.length > 2 ? furnRaw : null;

            const bath = lastInt(context, 'noOfBathrooms');
            const cleanBath = bath && bath < 10 ? bath : null;

            let parking: boolean | null = null;
            const carPark = context.match(/"carParking"\s*:\s*(\d+)/g)?.pop();
            const park = context.match(/"parking"\s*:\s*(\d+)/g)?.pop();
            if (carPark) parking = parseInt(carPark.match(/(\d+)$/)?.[1] || '0', 10) > 0;
            else if (park) parking = parseInt(park.match(/(\d+)$/)?.[1] || '0', 10) > 0;

            const sourceUrl = propUrl.startsWith('http')
                ? propUrl
                : `https://www.magicbricks.com${propUrl.startsWith('/') ? '' : '/'}${propUrl}`;

            const rentMatch = propUrl.match(/([^/]+)-FOR-Rent-([^/]+)-in-/i);
            const societyRaw = rentMatch ? rentMatch[1].replace(/-/g, ' ') : null;
            const locationRaw = rentMatch ? rentMatch[2].replace(/-/g, ' ') : area.name;
            const address = societyRaw
                ? `${bhk} in ${societyRaw}, ${locationRaw}`
                : `${bhk} in ${locationRaw}, ${area.name}`;

            const description = [
                `${bhk} apartment for rent in ${area.name}, Bangalore.`,
                sqft ? `${sqft} sq.ft.` : null,
                cleanBath ? `${cleanBath} bathroom${cleanBath > 1 ? 's' : ''}.` : null,
                furn ? `${furn}.` : null,
                parking === true ? 'Parking included.' : null,
                'Full details and contact on MagicBricks.',
            ].filter(Boolean).join(' ');

            const hashMatch = propUrl.match(/\/([A-Z0-9]{10,})-[A-Z]/i) || propUrl.match(/id=(\d+)/i);
            const externalId = hashMatch
                ? `mb-${hashMatch[1].toLowerCase()}`
                : `mb-${area.slug.toLowerCase()}-${rent}-${sqft ?? 'na'}-${i}`;

            listings.push({
                external_id: externalId,
                area_name: area.name,
                address,
                property_type: bhk,
                rent,
                size: sqft,
                bathrooms: cleanBath,
                parking,
                furnishing_status: furn,
                deposit: null,
                description,
                source_url: sourceUrl,
                image_url: images.join(','),
                // Area-centre pin (not a fabricated exact location); coords left null.
                google_maps_link: `https://www.google.com/maps?q=${area.lat},${area.lng}`,
                latitude: null,
                longitude: null,
            });
        }
    });

    return listings;
}

async function scrapeArea(area: AreaConfig): Promise<{ listings: ScrapedListing[]; error?: string }> {
    const url = `https://www.magicbricks.com/property-for-rent/residential-real-estate?proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment&cityName=Bangalore&localityName=${area.slug}`;
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!res.ok) {
            await res.body?.cancel();
            return { listings: [], error: `HTTP ${res.status}` };
        }
        return { listings: parseAreaPage(await res.text(), area) };
    } catch (e) {
        return { listings: [], error: (e as Error).message };
    }
}

Deno.serve(async (req) => {
    const denied = requireServiceRole(req);
    if (denied) return denied;

    const t0 = Date.now();
    const numBatches = Math.ceil(BANGALORE_AREAS.length / BATCH_SIZE);
    let batch = Math.floor(t0 / SLOT_MS) % numBatches;
    try {
        const body = await req.json();
        const n = Number(body?.batch);
        if (Number.isInteger(n) && n >= 0 && n < numBatches) batch = n;
    } catch {
        // empty / non-JSON body → clock-based batch
    }
    const areasToScrape = BANGALORE_AREAS.slice(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE);

    const perArea: Record<string, { scraped: number; error?: string }> = {};
    const listings: ScrapedListing[] = [];
    for (const [i, area] of areasToScrape.entries()) {
        if (Date.now() - t0 > TIME_BUDGET_MS) {
            perArea[area.name] = { scraped: 0, error: 'skipped: time budget' };
            continue;
        }
        if (i > 0) await sleep(BETWEEN_AREAS_MS);
        const r = await scrapeArea(area);
        perArea[area.name] = { scraped: r.listings.length, ...(r.error ? { error: r.error } : {}) };
        listings.push(...r.listings);
    }

    try {
        const sb = adminClient();
        const areas = await AreaIndex.load(sb);
        const r = await upsertListings(sb, listings, areas);
        const out = {
            batch,
            numBatches,
            areas: perArea,
            inserted: r.inserted,
            updated: r.updated,
            skipped: r.skipped,
            elapsed_ms: Date.now() - t0,
        };
        console.log('[sync-magicbricks]', JSON.stringify(out));
        return json(out);
    } catch (e) {
        return json({ batch, error: (e as Error).message }, 500);
    }
});
