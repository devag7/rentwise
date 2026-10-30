'use client'

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import PropertyCard, { Property } from '@/components/PropertyCard';
import { MarketStatsMap, marketKey } from '@/utils/market';

// Mapbox GL is ~1MB of JS — only load it when someone opens the map.
const MapboxCluster = dynamic(() => import('@/components/property/MapboxCluster'), {
    ssr: false,
    loading: () => (
        <div className="flex h-[600px] items-center justify-center rounded-[var(--radius-card)] bg-surface-2 text-footnote text-label-2">
            Loading map…
        </div>
    ),
});

const VIEWS = [
    { value: 'grid', label: 'Grid' },
    { value: 'map', label: 'Map' },
] as const;

export default function PropertiesList({
    properties,
    total,
    marketStats,
}: {
    properties: Property[];
    total?: number;
    marketStats?: MarketStatsMap;
}) {
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const count = total ?? properties.length;

    return (
        <>
            <div className="mt-8 mb-6 flex items-center justify-between gap-4">
                <p className="text-callout text-label-2 num" aria-live="polite">
                    {count.toLocaleString('en-IN')} {count === 1 ? 'flat' : 'flats'}
                </p>
                <div role="group" aria-label="View" className="inline-flex rounded-full bg-fill p-1">
                    {VIEWS.map(v => (
                        <button
                            key={v.value}
                            type="button"
                            onClick={() => setViewMode(v.value)}
                            aria-pressed={viewMode === v.value}
                            className={`rounded-full px-4 py-1.5 text-footnote transition-colors duration-200 ${
                                viewMode === v.value
                                    ? 'bg-surface-3 font-semibold text-label shadow-card'
                                    : 'text-label-2 hover:text-label'
                            }`}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {properties.length === 0 ? (
                <div className="flex flex-col items-center rounded-[var(--radius-panel)] bg-surface-2 px-6 py-20 text-center">
                    <h2 className="text-title-3">No flats match these filters</h2>
                    <p className="mt-2 max-w-md text-label-2">
                        Try a wider budget or another area — or watch an area below and we&apos;ll email you when a matching flat is listed.
                    </p>
                    <Link href="/properties" className="btn btn-secondary mt-6">Clear filters</Link>
                </div>
            ) : viewMode === 'map' ? (
                <MapboxCluster properties={properties} />
            ) : (
                <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {properties.map((p, i) => (
                        <PropertyCard
                            key={p.property_id}
                            property={p}
                            priority={i < 4}
                            marketStat={marketStats?.[marketKey(p.area_id, p.property_type)]}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
