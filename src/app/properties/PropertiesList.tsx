'use client'

import { useState } from 'react';
import PropertyCard, { Property } from '@/components/PropertyCard';
import MapboxCluster from '@/components/property/MapboxCluster';

export default function PropertiesList({ properties }: { properties: Property[] }) {
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

    return (
        <>
            <div className="flex justify-between items-center mt-6 border-b border-white/10 pb-6 mb-8">
                <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">{properties.length} Results Found</p>
                <div className="flex border border-white/20 p-1 bg-[#111]">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${viewMode === 'grid' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                        Data Grid
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${viewMode === 'map' ? 'bg-[#00A699] text-white overflow-hidden relative' : 'text-gray-500 hover:text-[#00A699]'}`}
                    >
                        {viewMode === 'map' && <span className="absolute inset-0 bg-[#00A699] animate-pulse opacity-50"></span>}
                        <span className="relative z-10 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            Geo Matrix
                        </span>
                    </button>
                </div>
            </div>

            {properties.length === 0 ? (
                <div className="text-center py-32 bg-[#111] border border-white/5 flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-2xl font-black text-white tracking-tighter mb-2">Zero Matches Found</h3>
                    <p className="text-gray-500 font-light max-w-sm">Adjust your parameters. Our model only displays inventory that aligns with strict valuation criteria.</p>
                </div>
            ) : viewMode === 'map' ? (
                <div className="w-full animate-fade-in shadow-2xl">
                    <MapboxCluster properties={properties} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full animate-fade-in">
                    {properties.map(p => (
                        <PropertyCard key={p.property_id} property={p} />
                    ))}
                </div>
            )}
        </>
    );
}
