'use client'

import { useState } from 'react';
import dynamic from 'next/dynamic';
import PropertyCard, { Property } from '@/components/PropertyCard';
import { MarketStatsMap, marketKey } from '@/utils/market';

// Mapbox GL is ~1MB of JS — only load it when someone opens the map.
const MapboxCluster = dynamic(() => import('@/components/property/MapboxCluster'), {
    ssr: false,
    loading: () => <div className="h-[600px] bg-[#111] border border-white/10 flex items-center justify-center text-gray-500 font-mono text-xs tracking-widest">LOADING MAP…</div>,
});

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

    return (
        <>
            <div className="flex justify-between items-center mt-6 border-b border-white/10 pb-6 mb-8">
                <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest">{(total ?? properties.length).toLocaleString('en-IN')} results</p>
                <div className="flex border border-white/20 p-1 bg-[#111]">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${viewMode === 'grid' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        Grid
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${viewMode === 'map' ? 'bg-[#00A699] text-white' : 'text-gray-400 hover:text-[#00A699]'}`}
                    >
                        Map
                    </button>
                </div>
            </div>

            {properties.length === 0 ? (
                <div className="text-center py-24 bg-[#111] border border-white/5 flex flex-col items-center px-6">
                    <h2 className="text-2xl font-black text-white tracking-tighter mb-2">Zero Matches Found</h2>
                    <p className="text-gray-400 font-light max-w-sm">Nothing matches these filters right now. Widen the budget or area — or watch the area below and we&apos;ll email you when one appears.</p>
                </div>
            ) : viewMode === 'map' ? (
                <MapboxCluster properties={properties} />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
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
