'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { MarketStat, getVerdict, formatINR } from '@/utils/market';
import { useAppContext } from '@/components/providers/AppContext';
import { loadSavedIds, setSaved } from '@/utils/favorites';
import VerdictPill from '@/components/ui/VerdictPill';

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
    const image = property.image_url?.split(',')[0]?.trim();
    const href = `/properties/${property.property_id}`;

    return (
        <article className="property-card card pressable group relative flex h-full flex-col overflow-hidden">
            <Link href={href} className="relative block aspect-[4/3] w-full overflow-hidden bg-fill">
                {image ? (
                    <img
                        src={image}
                        alt={`${property.property_type} in ${property.area_name}`}
                        className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.03]"
                        loading={priority ? 'eager' : 'lazy'}
                        fetchPriority={priority ? 'high' : 'auto'}
                        decoding="async"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-footnote text-label-3">No photo</div>
                )}
                <span className="material absolute left-3 top-3 rounded-full px-2.5 py-1 text-caption font-semibold text-label">
                    {property.property_type || 'Flat'}
                </span>
            </Link>

            <button
                onClick={handleToggleSave}
                className="material absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-150 active:scale-90"
                aria-label={isSaved ? 'Remove from saved' : 'Save flat'}
                aria-pressed={isSaved}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-[18px] w-[18px] ${isSaved ? 'text-bad' : 'text-label'}`} fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            </button>

            <div className="flex flex-grow flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                    <Link href={href} className="min-w-0 after:absolute after:inset-0 after:content-['']">
                        <h3 className="text-headline line-clamp-1">{property.address}</h3>
                        <p className="mt-0.5 text-footnote text-label-2">
                            {property.area_name}
                            {property.size ? <span className="num"> · {property.size} sq ft</span> : null}
                        </p>
                    </Link>
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                    <p className="text-title-3 num">
                        {formatINR(property.rent)}<span className="text-footnote font-normal text-label-2">/mo</span>
                    </p>
                    {verdict ? (
                        <VerdictPill verdict={verdict} size="sm" />
                    ) : (
                        <span className="text-caption text-label-3">Too few comparables</span>
                    )}
                </div>
                <p className="mt-2 flex items-center justify-between gap-2 text-caption text-label-2">
                    <span>{property.source === 'scraped' ? 'From a listing portal' : 'Listed by owner'}</span>
                    {verdict && <span className="num">Median {formatINR(verdict.median)} · {verdict.count} flats</span>}
                </p>
            </div>
        </article>
    );
}
