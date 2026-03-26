'use client'

import { ChangeEvent, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export interface FilterState {
    area_id: string;
    property_type: string;
    min_rent: string;
    max_rent: string;
    furnishing_status: string;
    parking: boolean;
    sort_by: string;
    source: string;
}

interface Area {
    area_id: number;
    name: string;
}

interface FilterBarProps {
    onFilterChange: (filters: FilterState) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
    const [filters, setFilters] = useState<FilterState>({
        area_id: "",
        property_type: "",
        min_rent: "",
        max_rent: "",
        furnishing_status: "",
        parking: false,
        sort_by: "newest",
        source: "",
    });

    const [areas, setAreas] = useState<Area[]>([]);
    const supabase = createClient();

    useEffect(() => {
        async function fetchAreas() {
            const { data, error } = await supabase
                .from('areas')
                .select('area_id, name')
                .order('name', { ascending: true });

            if (!error && data) {
                setAreas(data);
            }
        }
        fetchAreas();
    }, [supabase]);

    const handleChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const newFilters = {
            ...filters,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="bg-[#0A0A0A] border-y border-white/5 py-8 mb-12">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
                {/* Area Selection — Dynamic from Supabase */}
                <div className="relative">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Location</span>
                    <select
                        name="area_id"
                        value={filters.area_id}
                        onChange={handleChange}
                        className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-[#00A699] transition-colors duration-300 text-sm font-medium appearance-none cursor-pointer"
                    >
                        <option value="" className="bg-[#111]">All Areas ({areas.length})</option>
                        {areas.map(area => (
                            <option key={area.area_id} value={area.area_id} className="bg-[#111]">
                                {area.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Property Type */}
                <div className="relative">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Asset Type</span>
                    <select
                        name="property_type"
                        value={filters.property_type}
                        onChange={handleChange}
                        className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-[#00A699] transition-colors duration-300 text-sm font-medium appearance-none cursor-pointer"
                    >
                        <option value="" className="bg-[#111]">All Types</option>
                        <option value="1BHK" className="bg-[#111]">1BHK</option>
                        <option value="2BHK" className="bg-[#111]">2BHK</option>
                        <option value="3BHK" className="bg-[#111]">3BHK</option>
                    </select>
                </div>

                {/* Budget Range */}
                <div className="col-span-1 md:col-span-2 lg:col-span-1 grid grid-cols-2 gap-4">
                    <div className="relative">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Min (₹)</span>
                        <input
                            name="min_rent"
                            type="number"
                            value={filters.min_rent}
                            onChange={handleChange}
                            placeholder="0"
                            className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-[#00A699] transition-colors duration-300 text-sm font-medium placeholder-gray-700"
                        />
                    </div>
                    <div className="relative">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Max (₹)</span>
                        <input
                            name="max_rent"
                            type="number"
                            value={filters.max_rent}
                            onChange={handleChange}
                            placeholder="Unlimited"
                            className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-[#00A699] transition-colors duration-300 text-sm font-medium placeholder-gray-700"
                        />
                    </div>
                </div>

                {/* Advanced Filters */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-6 pt-2 lg:pt-0">

                    <div className="relative">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Source</span>
                        <select
                            name="source"
                            value={filters.source}
                            onChange={handleChange}
                            className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-[#00A699] transition-colors duration-300 text-sm font-medium appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-[#111]">All Sources</option>
                            <option value="platform" className="bg-[#111]">✅ Verified Only</option>
                            <option value="scraped" className="bg-[#111]">🌐 External Only</option>
                        </select>
                    </div>

                    <div className="relative">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Furnishing</span>
                        <select
                            name="furnishing_status"
                            value={filters.furnishing_status}
                            onChange={handleChange}
                            className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-[#00A699] transition-colors duration-300 text-sm font-medium appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-[#111]">Any</option>
                            <option value="Fully Furnished" className="bg-[#111]">Fully Furnished</option>
                            <option value="Semi-Furnished" className="bg-[#111]">Semi-Furnished</option>
                            <option value="Unfurnished" className="bg-[#111]">Unfurnished</option>
                        </select>
                    </div>

                    <div className="relative">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Sort By</span>
                        <select
                            name="sort_by"
                            value={filters.sort_by}
                            onChange={handleChange}
                            className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-[#00A699] transition-colors duration-300 text-sm font-medium appearance-none cursor-pointer"
                        >
                            <option value="newest" className="bg-[#111]">Newest First</option>
                            <option value="price_asc" className="bg-[#111]">Price: Low → High</option>
                            <option value="price_desc" className="bg-[#111]">Price: High → Low</option>
                            <option value="size_desc" className="bg-[#111]">Size: Largest</option>
                        </select>
                    </div>

                    <div className="relative flex items-center h-full pb-2">
                        <label className="flex items-center cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="parking"
                                    checked={filters.parking}
                                    onChange={handleChange}
                                    className="sr-only"
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${filters.parking ? 'bg-[#00A699]' : 'bg-gray-800'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${filters.parking ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <span className="ml-3 text-[10px] font-bold text-gray-400 group-hover:text-white uppercase tracking-widest transition-colors">
                                Parking
                            </span>
                        </label>
                    </div>
                </div>

            </div>
        </div>
    );
}
