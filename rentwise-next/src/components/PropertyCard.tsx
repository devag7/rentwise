'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

export interface Property {
    property_id: number;
    address: string;
    area_name: string;
    property_type: string;
    rent: number;
    size: number;
    image_data?: string;
    bathrooms?: number;
    parking?: boolean;
    furnishing_status?: string;
    longitude?: number;
    latitude?: number;
}

// Pseudo AI Algorithm: Predicts a fair price based on the area's base rate and flat size.
const calculateAIPrediction = (area_name: string, size: number, type: string) => {
    let baseRatePerSqFt = 20; // Default base rate

    const premiumAreas = ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout'];
    const standardAreas = ['Marathahalli', 'Bellandur', 'Jayanagar'];

    if (premiumAreas.includes(area_name)) baseRatePerSqFt = 35;
    else if (standardAreas.includes(area_name)) baseRatePerSqFt = 25;

    let prediction = size * baseRatePerSqFt;

    // Add type premiums
    if (type === '3BHK') prediction += 8000;
    if (type === '2BHK') prediction += 4000;

    return Math.round(prediction / 500) * 500; // Round to nearest 500
};

export default function PropertyCard({ property }: { property: Property }) {
    const supabase = createClient();
    const [isSaved, setIsSaved] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const checkSavedStatus = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                setUserId(session.user.id);
                // Only tenants can save properties
                if (session.user.user_metadata?.role !== 'tenant') return;

                const { data } = await supabase
                    .from('favorites')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('property_id', property.property_id)
                    .single();

                if (data) setIsSaved(true);
            }
        };
        checkSavedStatus();
    }, [property.property_id, supabase]);

    const handleToggleSave = async (e: React.MouseEvent) => {
        e.preventDefault(); // prevent navigation if wrapped in link later
        if (!userId) {
            toast.error("Please login as a Tenant to save properties.");
            return;
        }

        if (isSaved) {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('property_id', property.property_id);
            if (!error) {
                setIsSaved(false);
                toast.success("Removed from favorites.");
            } else {
                toast.error("Failed to remove.");
            }
        } else {
            const { error } = await supabase
                .from('favorites')
                .insert({ user_id: userId, property_id: property.property_id });
            if (!error) {
                setIsSaved(true);
                toast.success("Saved to favorites!");
            } else {
                toast.error("Could not save property.");
            }
        }
    };

    const predictedPrice = calculateAIPrediction(property.area_name, property.size, property.property_type);
    const difference = predictedPrice - property.rent;
    const isGoodDeal = difference >= 0;
    const differencePercent = Math.abs((difference / predictedPrice) * 100).toFixed(0);
    const matchScore = isGoodDeal
        ? Math.min(99, 82 + parseInt(differencePercent))
        : Math.max(50, 82 - parseInt(differencePercent));

    return (
        <div className="group bg-white dark:bg-[#0A0A0A] rounded-none border border-gray-200 dark:border-white/10 overflow-hidden transform transition-all duration-500 hover:border-gray-900 dark:hover:border-white/30 flex flex-col h-full shadow-sm relative">

            {/* Save Button */}
            <button
                onClick={handleToggleSave}
                className="absolute top-4 right-4 z-20 p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/20 hover:bg-black/80 transition-all group/btn"
                aria-label="Save Property"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-colors ${isSaved ? 'text-[#FF385C] fill-[#FF385C]' : 'text-white group-hover/btn:text-[#FF385C]'}`}
                    fill={isSaved ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            </button>

            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-[#111]">
                {property.image_data ? (
                    <img
                        src={`data:image/jpeg;base64,${property.image_data}`}
                        alt={property.address}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 font-mono text-xs tracking-widest bg-gray-100 dark:bg-[#0D0D0D]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        NO IMAGE DATA
                    </div>
                )}

                <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase border border-white/10">
                        {property.property_type}
                    </span>
                </div>

                {/* AI Deal Badge */}
                <div className="absolute bottom-4 left-4 z-10 flex flex-col items-start">
                    <div className={`px-2 py-1 flex items-center shadow-lg border backdrop-blur-md text-[10px] font-bold tracking-widest uppercase ${isGoodDeal
                        ? 'bg-[#00A699]/90 text-white border-[#00A699]'
                        : 'bg-[#FF385C]/90 text-white border-[#FF385C]'
                        }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {isGoodDeal ? `${differencePercent}% UNDER MARKET` : `${differencePercent}% OVER MARKET`}
                    </div>
                </div>

                <div className="absolute bottom-4 right-4 z-10 text-white text-xs font-bold tracking-widest flex items-center bg-black/50 px-2 py-1 backdrop-blur-sm border border-white/20">
                    {property.size} SQ.FT
                </div>
            </div>

            <div className="p-6 flex flex-col flex-grow bg-white dark:bg-[#0A0A0A]">

                <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white line-clamp-1 tracking-tight">
                        {property.address}
                    </h3>
                    {/* Unique PropScore Metric */}
                    <div className="bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-bold tracking-widest px-2 py-1 flex items-center shrink-0 shadow-sm">
                        <span className="text-[#00A699] mr-1">✦</span>
                        {matchScore}% MATCH
                    </div>
                </div>

                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium tracking-widest uppercase mb-6 flex items-center">
                    {property.area_name}
                </p>

                <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/10 flex flex-col gap-4">

                    {/* Price Comparison Block */}
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase mb-1">Asking Rent</span>
                            <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                                ₹{property.rent.toLocaleString('en-IN')}
                            </span>
                        </div>

                        <div className="flex flex-col items-end text-right">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase mb-1 text-[#00A699]">AI Valuation</span>
                            <span className="text-sm font-bold text-gray-400 line-through decoration-2 decoration-gray-500/50">
                                ₹{predictedPrice.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    <Link
                        href={`/properties/${property.property_id}`}
                        className="w-full mt-2 py-3 border border-gray-900 dark:border-white text-gray-900 dark:text-white text-center text-xs font-bold tracking-widest uppercase hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-300"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
}
