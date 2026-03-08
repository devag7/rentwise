'use client'

import { useState, useEffect } from 'react';
import PropertyCard, { Property } from '@/components/PropertyCard';
import FilterBar, { FilterState } from '@/components/FilterBar';
import { createClient } from '@/utils/supabase/client';

export default function Properties() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [filters, setFilters] = useState<FilterState>({
        area_id: '',
        property_type: '',
        min_rent: '',
        max_rent: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchProperties() {
            setIsLoading(true);

            let query = supabase.from('properties').select(`
        *,
        areas ( name )
      `);

            if (filters.area_id) {
                query = query.eq('area_id', filters.area_id);
            }
            if (filters.property_type) {
                query = query.eq('property_type', filters.property_type);
            }
            if (filters.min_rent) {
                query = query.gte('rent', filters.min_rent);
            }
            if (filters.max_rent) {
                query = query.lte('rent', filters.max_rent);
            }

            const { data, error } = await query;

            if (!error && data) {
                // Map the joined area table name back to standard property structure
                const formattedData: Property[] = data.map(item => ({
                    ...item,
                    area_name: item.areas?.name || 'Unknown Area'
                }));
                setProperties(formattedData);
            } else {
                console.error("Error fetching properties:", error);
            }

            setIsLoading(false);
        }

        fetchProperties();
    }, [filters, supabase]);

    const handleFilterChange = (newFilters: FilterState) => {
        setFilters(newFilters);
    };

    return (
        <div className="w-full pt-32 pb-24 px-6 bg-[#0A0A0A] text-white min-h-screen selection:bg-[#FF385C] selection:text-white">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <h2 className="text-sm font-bold tracking-widest text-[#FF385C] uppercase mb-4">Live Inventory</h2>
                    <h3 className="text-5xl font-black tracking-tighter text-white">Analyzed Properties.</h3>
                </div>

                <FilterBar onFilterChange={handleFilterChange} />

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF385C]"></div>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-32 bg-[#111] border border-white/5 flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-2xl font-black text-white tracking-tighter mb-2">Zero Matches Found</h3>
                        <p className="text-gray-500 font-light max-w-sm">Adjust your parameters. Our model only displays inventory that aligns with strict valuation criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6 w-full">
                        {properties.map(p => (
                            <PropertyCard key={p.property_id} property={p} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
