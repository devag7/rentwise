/**
 * RentWise Apify Automation Sync
 * 
 * Automates the extraction of properties using the Apify NoBroker scraper.
 * Pushes the sanitized results into the Supabase 'properties' table.
 */

import { ApifyClient } from 'apify-client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load env vars (try local first, then fallback to droplet's .env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !APIFY_TOKEN) {
    console.error('[APIFY SYNC] Missing required environment variables (Supabase or Apify).');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const apifyClient = new ApifyClient({ token: APIFY_TOKEN });

const BANGALORE_RENT_URLS = [
    // Example NoBroker search URLs for Bangalore (Indiranagar, Koramangala)
    "https://www.nobroker.in/property/rent/bangalore/Indiranagar?searchParam=W3sibGF0IjoxMi45Nzg0LCJsb24iOjc3LjY0MDgsInBsYWNlSWQiOiJDaElKc1A5RktWUVdyanNSZW1HUFc3UzhYNUUiLCJwbGFjZU5hbWUiOiJJbmRpcmFuYWdhciIsInNob3dNYXAiOmZhbHNlfV0=&radius=2.0",
    "https://www.nobroker.in/property/rent/bangalore/Koramangala?searchParam=W3sibGF0IjoxMi45MzUyLCJsb24iOjc3LjYyNDUsInBsYWNlSWQiOiJDaElKN1YtcUpKVVdyanNSeDBmU3d5Y2FfVzQiLCJwbGFjZU5hbWUiOiJLb3JhbWFuZ2FsYSIsInNob3dNYXAiOmZhbHNlfV0=&radius=2.0"
];

async function getAreaId(name: string): Promise<number | null> {
    const { data } = await supabase.from('areas').select('area_id').eq('name', name).single();
    if (data?.area_id) return data.area_id;
    const { data: n } = await supabase.from('areas').insert({ name }).select('area_id').single();
    return n?.area_id ?? null;
}

export async function runApifySync() {
    console.log('[APIFY SYNC] Starting automated property scraping via Apify...');
    
    const input = {
        "urls": BANGALORE_RENT_URLS,
        "max_items_per_url": 10,
        "proxy": {
            "useApifyProxy": true,
            "apifyProxyGroups": ["RESIDENTIAL"],
            "apifyProxyCountry": "IN"
        }
    };

    try {
        console.log('[APIFY SYNC] Calling ecomscrape/nobroker-property-search-scraper actor...');
        const run = await apifyClient.actor('ecomscrape/nobroker-property-search-scraper').call(input);
        
        console.log(`[APIFY SYNC] Actor run finished. Run ID: ${run.id}. Fetching results...`);
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        
        console.log(`[APIFY SYNC] Fetched ${items.length} properties from Apify.`);

        let inserted = 0;
        let updated = 0;

        for (const item of items as any[]) {
            // Safety checks
            if (!item.propertyTitle || !item.rent || !item.url) continue;

            const areaName = item.locality || 'Bangalore';
            const areaId = await getAreaId(areaName);
            if (!areaId) continue;

            // Map Apify item to Supabase schema
            // NoBroker typically gives rent as string like "₹ 25,000", parse it
            const rentRaw = String(item.rent).replace(/[^0-9]/g, '');
            const rentNum = parseInt(rentRaw) || 0;

            const sizeRaw = String(item.builtUpArea || '0').replace(/[^0-9]/g, '');
            const sizeNum = parseInt(sizeRaw) || 500;

            const externalId = `nobroker-${item.id || item.propertyTitle.replace(/\s+/g, '').slice(0, 15)}`;

            const row = {
                area_id: areaId,
                address: item.propertyTitle,
                property_type: item.propertyType || '2BHK',
                rent: rentNum,
                size: sizeNum,
                bathrooms: parseInt(item.bathrooms) || null,
                parking: item.parking ? (String(item.parking).toLowerCase().includes('yes') || String(item.parking) !== '0') : null,
                furnishing_status: item.furnishing || null,
                description: item.description || `Property in ${areaName}`,
                source: 'scraped',
                source_url: item.url,
                contact_name: item.ownerName || null,
                contact_phone: null, // Scraper might not provide phone without login
                external_id: externalId,
                scraped_at: new Date().toISOString(),
                image_url: item.imageUrls ? item.imageUrls[0] : (item.imageUrl || ''),
                google_maps_link: item.latitude && item.longitude ? `https://www.google.com/maps?q=${item.latitude},${item.longitude}` : '',
                landlord_id: null
            };

            const { data: existing } = await supabase
                .from('properties')
                .select('property_id')
                .eq('external_id', row.external_id)
                .maybeSingle();

            if (existing) {
                await supabase.from('properties').update({ scraped_at: row.scraped_at, rent: row.rent }).eq('external_id', row.external_id);
                updated++;
            } else {
                const { error } = await supabase.from('properties').insert(row);
                if (!error) inserted++;
            }
        }

        console.log(`[APIFY SYNC] Upsert complete. Inserted: ${inserted}, Updated: ${updated}`);
    } catch (error) {
        console.error('[APIFY SYNC] Error running sync:', error);
        process.exit(1);
    }
}

// Exported for cron.ts to use. If run directly:
if (import.meta.url === `file://${process.argv[1]}`) {
    runApifySync();
}
