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

const BANGALORE_LOCALITIES = [
    'Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Marathahalli',
    'Bellandur', 'Jayanagar', 'BTM Layout', 'Electronic City', 'Banashankari',
];

interface ApifyItem {
    listing_id?: string;
    title?: string;
    bhk?: number;
    bathrooms?: number;
    carpet_area_sqft?: number;
    price_inr?: number;
    furnishing?: string;
    locality?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    owner_name?: string;
    images?: string[];
    thumbnail?: string;
    url?: string;
}

async function getAreaId(name: string): Promise<number | null> {
    const { data } = await supabase.from('areas').select('area_id').eq('name', name).single();
    if (data?.area_id) return data.area_id;
    const { data: n } = await supabase.from('areas').insert({ name }).select('area_id').single();
    return n?.area_id ?? null;
}

export async function runApifySync() {
    console.log('[APIFY SYNC] Starting automated property scraping via Apify...');
    
    const input = {
        searchMode: 'rent',
        city: 'Bangalore',
        localities: BANGALORE_LOCALITIES,
        ownerOnly: false,
        maxResults: 80,
    };

    try {
        console.log('[APIFY SYNC] Calling thirdwatch/nobroker-scraper actor (free)...');
        const run = await apifyClient.actor('thirdwatch/nobroker-scraper').call(input);
        
        console.log(`[APIFY SYNC] Actor run finished. Run ID: ${run.id}. Fetching results...`);
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        
        console.log(`[APIFY SYNC] Fetched ${items.length} properties from Apify.`);

        let inserted = 0;
        let updated = 0;

        for (const item of items as ApifyItem[]) {
            // Safety checks — zero-fake-data policy: skip items missing essentials
            if (!item.title || !item.price_inr || !item.url) continue;

            const areaName = (item.locality || 'Bangalore').trim();
            const areaId = await getAreaId(areaName);
            if (!areaId) continue;

            const rentNum = Math.round(item.price_inr);
            if (rentNum < 3000 || rentNum > 1000000) continue;

            const sizeNum = item.carpet_area_sqft && item.carpet_area_sqft > 50
                ? Math.round(item.carpet_area_sqft)
                : 500;

            const externalId = `nobroker-${item.listing_id || item.title.replace(/\s+/g, '').slice(0, 15)}`;

            // Normalize furnishing labels ("Semi" -> "Semi-Furnished")
            const furnishing = item.furnishing
                ? (item.furnishing.toLowerCase().startsWith('semi') ? 'Semi-Furnished'
                    : item.furnishing.toLowerCase().startsWith('full') ? 'Furnished'
                        : item.furnishing.toLowerCase().startsWith('un') ? 'Unfurnished'
                            : item.furnishing)
                : null;

            const row = {
                area_id: areaId,
                address: item.title,
                property_type: item.bhk ? `${item.bhk}BHK` : '2BHK',
                rent: rentNum,
                size: sizeNum,
                bathrooms: item.bathrooms && item.bathrooms > 0 && item.bathrooms < 10 ? item.bathrooms : null,
                parking: null, // actor doesn't expose parking; never invent it
                furnishing_status: furnishing,
                description: item.address || `Property in ${areaName}`,
                source: 'scraped',
                source_url: item.url,
                contact_name: item.owner_name || null,
                contact_phone: null, // Scraper might not provide phone without login
                external_id: externalId,
                scraped_at: new Date().toISOString(),
                image_url: item.images?.length ? item.images.slice(0, 4).join(',') : (item.thumbnail || ''),
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
        // Re-throw so callers (cron.ts) can handle it without the whole
        // process dying — process.exit here would kill the cron scheduler.
        throw error;
    }
}

// Exported for cron.ts to use. If run directly:
if (import.meta.url === `file://${process.argv[1]}`) {
    runApifySync().catch(() => process.exit(1));
}
