import { ogCard } from '@/utils/og';
import { checkRent } from '@/utils/checkRent';
import { formatINR } from '@/utils/market';

/**
 * Preview image for a shared /check?q=... link. Same numbers as the checker;
 * no verdict unless there are enough real comps.
 */
export async function GET(req: Request) {
    const q = (new URL(req.url).searchParams.get('q') || '').slice(0, 300);
    let res;
    try {
        res = q ? await checkRent({ text: q }) : null;
    } catch {
        res = null;
    }

    let img;
    if (!res || !res.parsed.area_name || !res.parsed.property_type) {
        img = ogCard({ eyebrow: 'Fair-rent checker', title: 'Is your rent fair?', sub: 'Compare any Bangalore flat with live listings of the same BHK and area.' });
    } else {
        const { area_name, property_type, rent } = res.parsed;
        const title = `${property_type} in ${area_name}${rent ? ` at ${formatINR(rent)}` : ''}`;
        if (res.stat && res.verdict) {
            const { label, percent } = res.verdict;
            img = ogCard({
                eyebrow: 'Fair-rent check',
                title,
                badge: label === 'AT MARKET'
                    ? { text: 'AT MARKET', tone: 'neutral' }
                    : { text: `${percent}% ${label}`, tone: label === 'UNDER MARKET' ? 'good' : 'bad' },
                big: `${formatINR(res.stat.median)}/mo`,
                sub: `median from ${res.stat.count} live listings`,
            });
        } else if (res.stat) {
            img = ogCard({ eyebrow: 'Fair-rent check', title, big: `${formatINR(res.stat.median)}/mo`, sub: `median from ${res.stat.count} live listings` });
        } else {
            img = ogCard({ eyebrow: 'Fair-rent check', title, sub: 'Not enough live listings yet to call a fair price.' });
        }
    }
    img.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return img;
}
