'use client'

import { track } from '@/utils/analytics';

interface Props {
    propertyId: number;
    address: string;
    areaName: string;
    propertyType: string;
    rent: number;
    verdictText?: string;
}

export default function ShareListing({ propertyId, address, areaName, propertyType, rent, verdictText }: Props) {
    const handleShare = () => {
        const url = `${window.location.origin}/properties/${propertyId}`;
        const lines = [
            `${propertyType} in ${areaName} — ₹${rent.toLocaleString('en-IN')}/mo${verdictText ? ` (${verdictText})` : ''}`,
            address,
            url,
        ];
        track('share', { channel: 'whatsapp', property_id: propertyId });
        window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
    };

    return (
        <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 text-gray-300 hover:text-white hover:border-[#00A699] transition-colors text-[10px] font-bold tracking-widest uppercase"
            aria-label="Share on WhatsApp"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.241-.579-.486-.5-.668-.51l-.57-.01c-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Share
        </button>
    );
}
