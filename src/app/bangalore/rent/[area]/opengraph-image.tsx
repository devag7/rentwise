import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/utils/og';
import { BHK_TYPES } from '@/utils/market';
import { findAreaBySlug, getAreaStats, formatINR } from '../_lib';

export const alt = 'Median rent in this Bangalore area';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ area: string }> }) {
    const { area: slug } = await params;
    const area = await findAreaBySlug(slug);
    if (!area) return ogCard({ eyebrow: 'Bangalore rent index', title: 'Rent in Bangalore' });

    const stats = await getAreaStats(area.area_id);
    const columns = BHK_TYPES.filter(t => stats[t]).map(t => ({ label: t, value: formatINR(stats[t]!.median) }));
    const count = BHK_TYPES.reduce((n, t) => n + (stats[t]?.count ?? 0), 0);
    return ogCard({
        eyebrow: 'Median asking rent',
        title: `Rent in ${area.name}, Bangalore`,
        columns,
        sub: columns.length ? `per month, from ${count} live listings` : 'Not enough live listings yet to publish a median.',
    });
}
