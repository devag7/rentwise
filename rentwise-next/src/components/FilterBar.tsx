'use client'

import { ChangeEvent, useState } from "react";

export interface FilterState {
    area_id: string;
    property_type: string;
    min_rent: string;
    max_rent: string;
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
    });

    const handleChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="bg-[#0A0A0A] border-y border-white/5 py-8 mb-12">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Area Selection */}
                <div className="relative">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Location</span>
                    <select
                        name="area_id"
                        value={filters.area_id}
                        onChange={handleChange}
                        className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-white transition-colors duration-300 text-sm font-medium"
                    >
                        <option value="" className="bg-[#0A0A0A]">All Areas</option>
                        <option value="1" className="bg-[#0A0A0A]">Indiranagar</option>
                        <option value="2" className="bg-[#0A0A0A]">Koramangala</option>
                        <option value="3" className="bg-[#0A0A0A]">Whitefield</option>
                        <option value="4" className="bg-[#0A0A0A]">HSR Layout</option>
                        <option value="5" className="bg-[#0A0A0A]">Marathahalli</option>
                        <option value="6" className="bg-[#0A0A0A]">Bellandur</option>
                        <option value="7" className="bg-[#0A0A0A]">Jayanagar</option>
                        <option value="8" className="bg-[#0A0A0A]">BTM Layout</option>
                        <option value="9" className="bg-[#0A0A0A]">Electronic City</option>
                        <option value="10" className="bg-[#0A0A0A]">Banashankari</option>
                    </select>
                </div>

                {/* Property Type Selection */}
                <div className="relative">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Asset Type</span>
                    <select
                        name="property_type"
                        value={filters.property_type}
                        onChange={handleChange}
                        className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-white transition-colors duration-300 text-sm font-medium"
                    >
                        <option value="" className="bg-[#0A0A0A]">All Types</option>
                        <option value="1BHK" className="bg-[#0A0A0A]">1BHK</option>
                        <option value="2BHK" className="bg-[#0A0A0A]">2BHK</option>
                        <option value="3BHK" className="bg-[#0A0A0A]">3BHK</option>
                        <option value="1RK" className="bg-[#0A0A0A]">1RK</option>
                        <option value="PG" className="bg-[#0A0A0A]">PG</option>
                    </select>
                </div>

                {/* Min Rent Input */}
                <div className="relative">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Min Valuation</span>
                    <input
                        name="min_rent"
                        type="number"
                        value={filters.min_rent}
                        onChange={handleChange}
                        placeholder="₹ 0"
                        className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-white transition-colors duration-300 text-sm font-medium placeholder-gray-700"
                    />
                </div>

                {/* Max Rent Input */}
                <div className="relative">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Max Valuation</span>
                    <input
                        name="max_rent"
                        type="number"
                        value={filters.max_rent}
                        onChange={handleChange}
                        placeholder="₹ Unlimited"
                        className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-white transition-colors duration-300 text-sm font-medium placeholder-gray-700"
                    />
                </div>
            </div>
        </div>
    );
}
