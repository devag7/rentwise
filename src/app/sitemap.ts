import type { MetadataRoute } from 'next';
import { createPublicClient, hasSupabaseEnv } from '@/utils/supabase/public';
import { getMarketStats, marketKey, areaSlug, BHK_TYPES } from '@/utils/market';
import { getAreas, queryActive } from '@/utils/listings';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rentwise.devshipit.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
        { url: `${BASE_URL}/properties`, changeFrequency: 'hourly', priority: 0.9 },
        { url: `${BASE_URL}/check`, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${BASE_URL}/bangalore/rent`, changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/insights`, changeFrequency: 'daily', priority: 0.8 },
        { url: `${BASE_URL}/data`, changeFrequency: 'daily', priority: 0.6 },
        { url: `${BASE_URL}/login`, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/register`, changeFrequency: 'monthly', priority: 0.3 },
    ];

    if (!hasSupabaseEnv()) return staticRoutes;

    try {
        // Cookie-less client: sitemap only needs public data and may run
        // outside a request scope (e.g. at build time).
        const supabase = createPublicClient();
        const [stats, areas, { data }] = await Promise.all([
            getMarketStats(supabase),
            getAreas(supabase),
            queryActive((activeOnly) => {
                let q = supabase.from('properties').select('property_id, scraped_at');
                if (activeOnly) q = q.eq('is_active', true);
                return q.order('property_id', { ascending: false }).limit(1000);
            }),
        ]);

        // Area + area/BHK pages, only for markets that actually exist.
        const marketRoutes: MetadataRoute.Sitemap = [];
        const seen = new Set<string>();
        for (const a of areas) {
            const slug = areaSlug(a.name);
            // Area pages resolve a slug to the first matching area, so skip duplicates.
            if (!slug || seen.has(slug)) continue;
            seen.add(slug);
            const bhks = BHK_TYPES.filter(t => stats[marketKey(a.area_id, t)]);
            if (bhks.length === 0) continue;
            marketRoutes.push({ url: `${BASE_URL}/bangalore/rent/${slug}`, changeFrequency: 'daily', priority: 0.8 });
            for (const t of bhks) {
                marketRoutes.push({ url: `${BASE_URL}/bangalore/rent/${slug}/${t.toLowerCase()}`, changeFrequency: 'daily', priority: 0.8 });
            }
        }

        const propertyRoutes: MetadataRoute.Sitemap = ((data || []) as { property_id: number; scraped_at: string | null }[]).map((p) => ({
            url: `${BASE_URL}/properties/${p.property_id}`,
            lastModified: p.scraped_at ? new Date(p.scraped_at) : undefined,
            changeFrequency: 'daily',
            priority: 0.7,
        }));

        return [...staticRoutes, ...marketRoutes, ...propertyRoutes];
    } catch {
        return staticRoutes;
    }
}
