import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://157.245.110.163:3009';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard', '/messages', '/api/'],
        },
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
