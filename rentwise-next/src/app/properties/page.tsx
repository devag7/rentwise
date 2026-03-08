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
        <div className="w-full pt-28 pb-12 px-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Available Properties
                </h2>

                <FilterBar onFilterChange={handleFilterChange} />

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">No properties found</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your filters to find what you&apos;re looking for.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-6 w-full">
                        {properties.map(p => (
                            <PropertyCard key={p.property_id} property={p} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
