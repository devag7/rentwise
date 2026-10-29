import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/utils/og';
import { findAreaBySlug, getAreaStats, bhkFromSlug, formatINR } from '../../_lib';

export const alt = 'Median rent for this flat size in this Bangalore area';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ area: string; bhk: string }> }) {
    const { area: slug, bhk: bhkParam } = await params;
    const bhk = bhkFromSlug(bhkParam);
    const area = bhk ? await findAreaBySlug(slug) : null;
    if (!bhk || !area) return ogCard({ eyebrow: 'Bangalore rent index', title: 'Rent in Bangalore' });

    const stat = (await getAreaStats(area.area_id))[bhk];
    if (!stat) {
        return ogCard({
            eyebrow: 'Median asking rent',
            title: `${bhk} in ${area.name}`,
            sub: 'Not enough live listings yet to publish a median.',
        });
    }
    const range = stat.p25 != null && stat.p75 != null ? `typical ${formatINR(stat.p25)}–${formatINR(stat.p75)} · ` : '';
    return ogCard({
        eyebrow: 'Median asking rent',
        title: `${bhk} in ${area.name}, Bangalore`,
        big: `${formatINR(stat.median)}/mo`,
        sub: `${range}${stat.count} live listings`,
    });
}
