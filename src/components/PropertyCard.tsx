'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { MarketStat, getVerdict, formatINR } from '@/utils/market';
import { useAppContext } from '@/components/providers/AppContext';
import { loadSavedIds, setSaved } from '@/utils/favorites';

export interface Property {
    property_id: number;
    area_id?: number;
    address: string;
    area_name: string;
    property_type: string;
    rent: number;
    size: number | null;
    image_data?: string;
    image_url?: string;
    bathrooms?: number;
    deposit?: number;
    parking?: boolean;
    furnishing_status?: string;
    longitude?: number | null;
    latitude?: number | null;
    source?: string;
    source_url?: string;
    contact_name?: string;
    contact_phone?: string;
    scraped_at?: string;
    created_at?: string;
    external_id?: string;
    description?: string;
    amenities?: string[];
}

export default function PropertyCard({
    property,
    marketStat,
    priority = false,
}: {
    property: Property;
    marketStat?: MarketStat;
    priority?: boolean;
}) {
    const { user, role } = useAppContext();
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (!user || role !== 'tenant') return;
        loadSavedIds(user.id).then(ids => setIsSaved(ids.has(property.property_id)));
    }, [user, role, property.property_id]);

    const handleToggleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user || role !== 'tenant') {
            toast.error('Log in as a tenant to save flats.');
            return;
        }
        const next = !isSaved;
        setIsSaved(next);
        const ok = await setSaved(user.id, property.property_id, next);
        if (!ok) {
            setIsSaved(!next);
            toast.error('Could not update saved flats.');
        }
    };

    // Comps-based verdict only. No comps → no verdict (never a guessed number).
    const verdict = getVerdict(property.rent, marketStat);
    const badge = verdict
        ? {
            text: verdict.label === 'AT MARKET' ? 'AT MARKET' : `${verdict.percent}% ${verdict.label}`,
            cls: verdict.label === 'OVER MARKET'
                ? 'bg-[#FF385C]/90 border-[#FF385C]'
                : verdict.label === 'UNDER MARKET' ? 'bg-[#00A699]/90 border-[#00A699]' : 'bg-white/20 border-white/30',
        }
        : null;
    const image = property.image_url?.split(',')[0]?.trim();

    return (
        <div className="property-card group bg-[#0A0A0A] border border-white/10 overflow-hidden flex flex-col h-full relative hover:border-[#FF385C]/40 transition-colors">
            <div className="absolute top-4 left-4 z-20 flex gap-2">
                <span className="px-3 py-1.5 bg-black/80 text-white text-[10px] font-bold tracking-widest uppercase border border-white/10">
                    {property.property_type || 'Flat'}
                </span>
                {property.source === 'scraped' ? (
                    <span className="px-2.5 py-1.5 bg-amber-500/90 text-white text-[9px] font-bold tracking-widest uppercase">External</span>
                ) : (
                    <span className="px-2.5 py-1.5 bg-emerald-600/90 text-white text-[9px] font-bold tracking-widest uppercase">Owner-listed</span>
                )}
            </div>

            <button
                onClick={handleToggleSave}
                className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full border border-white/20 hover:bg-black/80 transition-colors"
                aria-label={isSaved ? 'Remove from saved' : 'Save flat'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isSaved ? 'text-[#FF385C]' : 'text-white'}`} fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            </button>

            <Link href={`/properties/${property.property_id}`} className="relative aspect-[4/3] w-full overflow-hidden bg-[#111] block">
                {image ? (
                    <img
                        src={image}
                        alt={`${property.property_type} in ${property.area_name}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading={priority ? 'eager' : 'lazy'}
                        fetchPriority={priority ? 'high' : 'auto'}
                        decoding="async"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono text-[10px] tracking-widest">NO PHOTO</div>
                )}
                {badge && (
                    <span className={`absolute bottom-4 left-4 px-2 py-1 text-white border text-[10px] font-bold tracking-widest uppercase ${badge.cls}`}>
                        {badge.text}
                    </span>
                )}
                {property.size ? (
                    <span className="absolute bottom-4 right-4 text-white text-xs font-bold tracking-widest bg-black/60 px-2 py-1 border border-white/20">
                        {property.size} SQ.FT
                    </span>
                ) : null}
            </Link>

            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-black text-white line-clamp-1 tracking-tight">{property.address}</h3>
                <p className="text-gray-400 text-xs font-medium tracking-widest uppercase mt-1 mb-6">{property.area_name}</p>

                <div className="mt-auto pt-6 border-t border-white/10 flex justify-between items-end gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">Asking rent</span>
                        <span className="text-3xl font-black text-white tracking-tighter leading-none">{formatINR(property.rent)}</span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                        {verdict ? (
                            <>
                                <span className="text-[10px] font-bold tracking-widest uppercase mb-1 text-[#00A699]">Median · {verdict.count} comps</span>
                                <span className="text-sm font-bold text-gray-300">{formatINR(verdict.median)}</span>
                            </>
                        ) : (
                            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-600">Too few comps<br />for a verdict</span>
                        )}
                    </div>
                </div>

                <Link
                    href={`/properties/${property.property_id}`}
                    className="w-full mt-6 py-3 border border-white text-white text-center text-xs font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-colors"
                >
                    View details
                </Link>
            </div>
        </div>
    );
}
