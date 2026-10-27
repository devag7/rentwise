/**
 * RentWise Production Scraper — MagicBricks
 * 
 * ZERO FAKE DATA POLICY:
 *   ✅ Only real scraped values are stored
 *   ✅ If a field cannot be extracted → it is NULL, not fabricated
 *   ✅ No generated emails, no constructed owner names, no random coordinates
 *   ✅ GPS uses exact area center coordinates (not randomized offsets)
 *   ✅ Parking is null when not explicitly scraped (never random)
 *   ✅ No default BHK: listings whose BHK isn't in the URL are skipped
 *   ✅ No size estimates: size is null unless carpet/built-up area is on the page
 *   ✅ Owner phone numbers / names are personal data — never stored
 *
 * Required fields for insertion: image_url + price + BHK + source_url
 * Optional (null if missing): size, furnishing, parking, bathrooms
 *
 * Primary pipeline is now supabase/functions/sync-magicbricks (pg_cron);
 * this script is the Docker fallback and follows the same rules.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[SCRAPER] Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface AreaConfig { name: string; slug: string; lat: number; lng: number; }

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

interface PropertyListing {
    address: string;
    area_name: string;
    property_type: string;
    rent: number;
    size: number | null;       // null = not on page (never estimated)
    bathrooms: number | null;
    parking: boolean | null;   // null = not known (never random)
    furnishing_status: string | null;
    source: 'scraped';
    source_url: string;
    external_id: string;
    scraped_at: string;
    description: string;
    image_url: string;
    google_maps_link: string;
}

function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}

function decodeUnicode(str: string): string {
    return str
        .replace(/\\\\u([0-9a-fA-F]{4})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\u([0-9a-fA-F]{4})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)));
}

/** BHK from the listing URL, or null — never a default. */
function parseBHK(url: string): string | null {
    if (/(^|[^a-z])1-?RK([^a-z]|$)/i.test(url)) return '1RK';
    const m = url.match(/(\d)-BHK/i) || url.match(/(\d)BHK/i);
    return m && m[1] !== '0' ? `${m[1]}BHK` : null;
}

async function scrapeMagicBricks(area: AreaConfig): Promise<PropertyListing[]> {
    const url = `https://www.magicbricks.com/property-for-rent/residential-real-estate?proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment&cityName=Bangalore&localityName=${area.slug}`;
    try {
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
            timeout: 20000,
        });

        const $ = cheerio.load(html);
        const listings: PropertyListing[] = [];

        $('script').each((_i, el) => {

            const scriptText = $(el).html() || '';
            // Only target scripts with actual listing photo data
            if (!scriptText.includes('allImgPath')) return;

            // Split script by each allImgPath occurrence to get per-listing blocks
            const parts = scriptText.split('"allImgPath"');
            for (let i = 1; i < parts.length; i++) {
                // Context: 2000 chars from the end of the previous block (before this allImgPath)
                // plus up to 12000 chars after (carpet/builtUpArea can be 4000+ chars after the image array)
                const before = parts[i - 1].slice(-2000);
                const after = parts[i];
                const context = before + after.substring(0, 12000);

                // Extract images from this allImgPath array
                const arrayMatch = after.match(/:\s*\[([^\]]*)\]/);
                if (!arrayMatch) continue;
                const rawImgs = arrayMatch[1].match(/"([^"]+)"/g)?.map(s => decodeUnicode(s.replace(/"/g, ''))) || [];
                const images = rawImgs.filter(u => u.startsWith('http')).slice(0, 4);
                if (images.length === 0) continue;

                // Extract price from combined context (may be before OR after the image array)
                const priceMatches = [...context.matchAll(/"price"\s*:\s*"?(\d+)/g)].map(m => parseInt(m[1]));
                const priceNum = priceMatches.find(p => p >= 3000 && p <= 500000) || 0;
                if (!priceNum) continue;

                // Extract propUrl — look for a URL containing "for-rent" or BHK pattern
                // MUST search in 'after' (current property) to avoid matching the previous property and duplicating external_ids
                const propUrlMatch = after.match(/"url"\s*:\s*"([^"]*(?:for-rent|FOR-Rent|-BHK-)[^"]*)"/i);
                const propUrl = propUrlMatch ? decodeUnicode(propUrlMatch[1]) : null;
                // No listing URL → no BHK, no stable id, no source link. Skip.
                if (!propUrl) continue;
                const bhk = parseBHK(propUrl);
                if (!bhk) continue;

                // Extract size — carpet preferred, then builtUpArea. Real values only.
                const carpetMatch = context.match(/"carpet"\s*:\s*(\d+)/g)?.pop();
                const builtupMatch = context.match(/"builtUpArea"\s*:\s*(\d+)/g)?.pop();
                const scrapedSqft = carpetMatch ? parseInt(carpetMatch.match(/(\d+)$/)?.[1] || '0')
                    : builtupMatch ? parseInt(builtupMatch.match(/(\d+)$/)?.[1] || '0') : 0;
                const sqft = scrapedSqft > 0 ? scrapedSqft : null;


                // Extract furnishing
                const furnMatch = context.match(/"furnStatusD"\s*:\s*"([^"]+)"/)?.[1]?.trim();
                const furn = furnMatch && furnMatch.length > 2 ? furnMatch : null;

                // Extract bathrooms
                const bathMatch = context.match(/"noOfBathrooms"\s*:\s*(\d+)/g)?.pop();
                const bath = bathMatch ? parseInt(bathMatch.match(/(\d+)$/)?.[1] || '0') : null;
                const cleanBath = bath && bath > 0 && bath < 10 ? bath : null;

                // Extract parking
                const carParkMatch = context.match(/"carParking"\s*:\s*(\d+)/g)?.pop();
                const parkMatch = context.match(/"parking"\s*:\s*(\d+)/g)?.pop();
                let parking: boolean | null = null;
                if (carParkMatch) parking = parseInt(carParkMatch.match(/(\d+)$/)?.[1] || '0') > 0;
                else if (parkMatch) parking = parseInt(parkMatch.match(/(\d+)$/)?.[1] || '0') > 0;

                // Build source URL
                const sourceUrl = propUrl.startsWith('http')
                    ? propUrl
                    : `https://www.magicbricks.com${propUrl.startsWith('/') ? '' : '/'}${propUrl}`;

                // Address
                const rentMatch = propUrl.match(/([^/]+)-FOR-Rent-([^/]+)-in-/i);
                const societyRaw = rentMatch ? rentMatch[1].replace(/-/g, ' ') : null;
                const locationRaw = rentMatch ? rentMatch[2].replace(/-/g, ' ') : area.name;
                const address = societyRaw
                    ? `${bhk} in ${societyRaw}, ${locationRaw}`
                    : `${bhk} in ${locationRaw}, ${area.name}`;

                // Description
                const desc = [
                    `${bhk} apartment for rent in ${area.name}, Bangalore.`,
                    sqft ? `${sqft} sq.ft.` : null,
                    cleanBath ? `${cleanBath} bathroom${cleanBath > 1 ? 's' : ''}.` : null,
                    furn ? `${furn}.` : null,
                    parking === true ? 'Parking included.' : null,
                    'Full details and contact on MagicBricks.',
                ].filter(Boolean).join(' ');

                // External ID — stable from propUrl hash
                const hashMatch = propUrl.match(/\/([A-Z0-9]{10,})-[A-Z]/i) || propUrl.match(/id=(\d+)/i);
                const externalId = hashMatch ? `mb-${hashMatch[1].toLowerCase()}` : `mb-${area.slug.toLowerCase()}-${priceNum}-${sqft ?? 'na'}-${i}`;

                listings.push({
                    address,
                    area_name: area.name,
                    property_type: bhk,
                    rent: priceNum,
                    size: sqft,
                    bathrooms: cleanBath,
                    parking,
                    furnishing_status: furn,
                    source: 'scraped',
                    source_url: sourceUrl,
                    external_id: externalId,
                    scraped_at: new Date().toISOString(),
                    description: desc,
                    image_url: images.join(','),
                    google_maps_link: `https://www.google.com/maps?q=${area.lat},${area.lng}`,
                });
            }
        });

        return listings;

    } catch (err) {
        const e = err as { response?: { status?: number }; message?: string };
        if (e.response?.status && [403, 503, 429].includes(e.response.status)) {
            console.warn(`[MB] ${area.name}: blocked (${e.response.status})`); 
        } else {
            console.error(`\n[MB] ${area.name} error:`, e.message);
        }
        return [];
    }
}

async function getAreaId(name: string): Promise<number | null> {
    const { data } = await supabase.from('areas').select('area_id').eq('name', name).single();
    if (data?.area_id) return data.area_id;
    const { data: n } = await supabase.from('areas').insert({ name }).select('area_id').single();
    return n?.area_id ?? null;
}

async function insertListings(listings: PropertyListing[]): Promise<number> {
    let inserted = 0;
    for (const l of listings) {
        if (!l.image_url || !l.rent || !l.property_type || !l.source_url) continue;
        const areaId = await getAreaId(l.area_name);
        if (!areaId) continue;

        const row = {
            area_id: areaId,
            address: l.address,
            property_type: l.property_type,
            rent: l.rent,
            size: l.size,
            bathrooms: l.bathrooms,
            parking: l.parking,
            furnishing_status: l.furnishing_status,
            description: l.description,
            source: l.source,
            source_url: l.source_url,
            contact_name: null,   // personal data — never stored
            contact_phone: null,
            external_id: l.external_id,
            scraped_at: l.scraped_at,
            last_seen_at: l.scraped_at,
            is_active: true,
            image_url: l.image_url,
            google_maps_link: l.google_maps_link,
            landlord_id: null,
        };

        const { data: existing } = await supabase
            .from('properties')
            .select('property_id')
            .eq('external_id', row.external_id)
            .maybeSingle();

        if (existing) {
            await supabase.from('properties').update({
                scraped_at: row.scraped_at,
                last_seen_at: row.scraped_at,
                is_active: true,
                rent: row.rent,
                image_url: row.image_url,
                contact_name: null,
                contact_phone: null,
            }).eq('external_id', row.external_id);
            inserted++;
        } else {
            const { error: ie } = await supabase.from('properties').insert(row);
            if (!ie) inserted++;
        }
    }
    return inserted;
}

export async function runScraper(): Promise<void> {
    const t0 = Date.now();
    console.log(`\n[SCRAPER] ============================================================`);
    console.log(`[SCRAPER] RentWise Production Scraper — Zero Fake Data Policy`);
    console.log(`[SCRAPER] ${new Date().toISOString()} | ${BANGALORE_AREAS.length} Bangalore areas | MagicBricks`);
    console.log(`[SCRAPER] Required: image + price + BHK + source_url | Optional: size, furnishing, parking`);
    console.log(`[SCRAPER] ============================================================\n`);

    let totalFound = 0, totalInserted = 0;

    for (const area of BANGALORE_AREAS) {
        console.log(`\n[SCRAPER] ${area.name}...`);
        let listings: PropertyListing[] = [];
        try { listings = await scrapeMagicBricks(area); } catch (e) { console.error((e as Error).message); }
        totalFound += listings.length;

        if (!listings.length) {
            console.log('0 scraped');
        } else {
            const inserted = await insertListings(listings);
            totalInserted += inserted;
            const withSize = listings.filter(l => l.size).length;
            console.log(`${listings.length} scraped → ${inserted} upserted (${withSize} with real sqft)`);
        }
        await sleep(2500);
    }

    // Stale listings: mark inactive (not seen for 14 days) instead of deleting,
    // so rent history and saved favourites keep working. See phase 15 SQL.
    const { data: staleCount } = await supabase.rpc('deactivate_stale_listings');

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n[SCRAPER] ============================================================`);
    console.log(`[SCRAPER] Complete in ${elapsed}s | Scraped: ${totalFound} | Inserted/Updated: ${totalInserted} | Stale deactivated: ${staleCount ?? 0}`);
    console.log(`[SCRAPER] ============================================================\n`);
}

runScraper().catch(console.error);
