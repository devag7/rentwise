import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://157.245.110.163:3009';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
        { url: `${BASE_URL}/properties`, changeFrequency: 'hourly', priority: 0.9 },
        { url: `${BASE_URL}/login`, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/register`, changeFrequency: 'monthly', priority: 0.3 },
    ];

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return staticRoutes;

    try {
        // Cookie-less client: sitemap only needs public listing data and may
        // run outside a request scope (e.g. at build time).
        const supabase = createClient(url, key);
        const { data } = await supabase
            .from('properties')
            .select('property_id, scraped_at')
            .order('property_id', { ascending: false })
            .limit(1000);

        const propertyRoutes: MetadataRoute.Sitemap = (data || []).map((p) => ({
            url: `${BASE_URL}/properties/${p.property_id}`,
            lastModified: p.scraped_at ? new Date(p.scraped_at) : undefined,
            changeFrequency: 'daily',
            priority: 0.7,
        }));

        return [...staticRoutes, ...propertyRoutes];
    } catch {
        return staticRoutes;
    }
}
