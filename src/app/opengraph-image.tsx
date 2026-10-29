import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/utils/og';

export const alt = 'RentWise — fair rent for every Bangalore flat';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
    return ogCard({
        eyebrow: 'Bangalore rent index',
        title: 'Is your rent fair? Check it against real listings.',
        sub: 'Medians from live NoBroker + MagicBricks listings, refreshed daily.',
    });
}
