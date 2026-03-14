import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import ApplicationCard from '@/components/property/ApplicationCard';
import InteractiveMediaLinks from '@/components/property/InteractiveMediaLinks';
import CommuteAnalyzer from '@/components/property/CommuteAnalyzer';
import AffordabilityCalculator from '@/components/property/AffordabilityCalculator';
import TourScheduler from '@/components/property/TourScheduler';
import NeighborhoodProfile from '@/components/property/NeighborhoodProfile';
import PropertyReviews from '@/components/property/PropertyReviews';
import PropertyCard, { Property } from '@/components/PropertyCard';

// Keep the same prediction logic as PropertyCard
const calculateAIPrediction = (area_name: string, size: number, type: string) => {
    let baseRatePerSqFt = 20;

    const premiumAreas = ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout'];
    const standardAreas = ['Marathahalli', 'Bellandur', 'Jayanagar'];

    if (premiumAreas.includes(area_name)) baseRatePerSqFt = 35;
    else if (standardAreas.includes(area_name)) baseRatePerSqFt = 25;

    let prediction = size * baseRatePerSqFt;
    if (type === '3BHK') prediction += 8000;
    if (type === '2BHK') prediction += 4000;

    return Math.round(prediction / 500) * 500;
};

export default async function PropertyDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: property, error } = await supabase
        .from('properties')
        .select(`*, areas ( name )`)
        .eq('property_id', id)
        .single();

    if (error || !property) {
        return notFound();
    }

    const formattedProperty = {
        ...property,
        area_name: property.areas?.name || 'Unknown Area'
    };

    const predictedPrice = calculateAIPrediction(formattedProperty.area_name, formattedProperty.size, formattedProperty.property_type);
    const difference = predictedPrice - formattedProperty.rent;
    const isGoodDeal = difference >= 0;
    const differencePercent = Math.abs((difference / predictedPrice) * 100).toFixed(0);

    const { data: similarPropertiesData } = await supabase
        .from('properties')
        .select('*, areas(name)')
        .neq('property_id', id)
        .or(`area_id.eq.${formattedProperty.area_id},property_type.eq.${formattedProperty.property_type}`)
        .limit(3);

    const similarProperties: Property[] = (similarPropertiesData || []).map(item => ({
        ...item,
        area_name: item.areas?.name || 'Unknown Area'
    })) as Property[];

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center pb-20 pt-32 px-6 selection:bg-[#FF385C] selection:text-white">
            <div className="relative max-w-5xl w-full bg-[#111] rounded-none shadow-2xl p-0 md:p-12 border border-white/10 flex flex-col md:flex-row gap-12">

                {/* Left Column: Image & Details */}
                <div className="flex-1 w-full flex flex-col gap-10">

                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1.5 bg-black text-white border border-white/20 text-[10px] font-bold tracking-widest uppercase">
                                {formattedProperty.property_type}
                            </span>
                            {formattedProperty.source === 'scraped' ? (
                                <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                    EXTERNAL LISTING
                                </span>
                            ) : (
                                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                    VERIFIED
                                </span>
                            )}
                            <span className="flex items-center text-gray-500 text-[10px] font-bold tracking-widest uppercase">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {formattedProperty.area_name}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-2 tracking-tighter">
                            {formattedProperty.address}
                        </h1>
                    </div>

                    {/* Property Image */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#050505] border border-white/10 group">
                        {formattedProperty.image_data ? (
                            <img
                                src={`data:image/jpeg;base64,${formattedProperty.image_data}`}
                                alt={formattedProperty.address}
                                className="w-full h-full object-cover transition-transform transform group-hover:scale-105 duration-1000"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 font-mono text-xs tracking-widest">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                NO MEDIA AVAILABLE
                            </div>
                        )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-white/10">
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2">Area Scope</p>
                            <p className="text-2xl font-black text-white tracking-tighter flex items-end gap-2">
                                {formattedProperty.size} <span className="text-[10px] font-bold text-gray-500 tracking-widest mb-1.5 uppercase">sq ft</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2">Bathrooms</p>
                            <p className="text-2xl font-black text-white tracking-tighter flex items-end gap-2">
                                {formattedProperty.bathrooms || 1}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2">Parking</p>
                            <p className="text-base font-bold text-white tracking-tight flex items-end gap-2 h-full pb-1">
                                {formattedProperty.parking ? 'Allocated slot' : 'Not available'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2">Furnishing</p>
                            <p className="text-base font-bold text-[#00A699] tracking-tight flex items-end gap-2 h-full pb-1">
                                {formattedProperty.furnishing_status || 'Unfurnished'}
                            </p>
                        </div>
                    </div>

                    {/* About Property */}
                    {formattedProperty.description && (
                        <div className="pt-4">
                            <h3 className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-4">About this Property</h3>
                            <p className="text-gray-300 text-sm leading-relaxed font-medium">
                                {formattedProperty.description}
                            </p>
                        </div>
                    )}

                    {/* Tenant Specs & Amenities */}
                    <div className="pt-4 flex flex-col gap-6 w-full">
                        <div>
                            <h3 className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-4">Tenant Requirements</h3>
                            <div className="inline-flex items-center px-4 py-2 bg-white/5 border border-white/10 text-xs font-bold text-white tracking-widest">
                                {formattedProperty.preferences || 'Unrestricted'}
                            </div>
                        </div>

                        {formattedProperty.amenities && formattedProperty.amenities.length > 0 && (
                            <div>
                                <h3 className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-4 mt-6">Amenities Included</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {formattedProperty.amenities.map((amenity: string, idx: number) => (
                                        <div key={idx} className="flex items-center p-3 border border-white/5 bg-[#050505]">
                                            <span className="w-1.5 h-1.5 bg-[#00A699] rounded-full mr-3"></span>
                                            <span className="text-xs font-bold text-gray-300 tracking-wider uppercase">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Multimedia Hub (Virtual Tour & Location) */}
                    <InteractiveMediaLinks google_maps_link={formattedProperty.google_maps_link} />
                </div>

                {/* Right Column: Pricing & Action */}
                <div className="w-full md:w-[400px]">
                    <ApplicationCard
                        property_id={formattedProperty.property_id}
                        landlord_id={formattedProperty.landlord_id}
                        rent={formattedProperty.rent}
                        landlord_phone={formattedProperty.landlord_phone}
                        predictedPrice={predictedPrice}
                        isGoodDeal={isGoodDeal}
                        differencePercent={differencePercent}
                        source={formattedProperty.source}
                        source_url={formattedProperty.source_url}
                        contact_name={formattedProperty.contact_name}
                        contact_phone={formattedProperty.contact_phone}
                    />

                    {formattedProperty.source !== 'scraped' && (
                        <div className="mt-8">
                            <TourScheduler propertyId={formattedProperty.property_id} />
                        </div>
                    )}

                    {formattedProperty.source !== 'scraped' && (
                        <div>
                            <CommuteAnalyzer propertyArea={formattedProperty.area_name} />
                        </div>
                    )}

                    <div>
                        <AffordabilityCalculator monthlyRent={formattedProperty.rent} />
                    </div>
                </div>
            </div>

            {/* Neighborhood Intelligence */}
            <div className="max-w-5xl w-full mt-4">
                <NeighborhoodProfile areaName={formattedProperty.area_name} />
            </div>

            {/* Verified Rating System */}
            <div className="max-w-5xl w-full mt-4">
                <PropertyReviews propertyId={formattedProperty.property_id} />
            </div>

            {/* Recommendation Engine */}
            {similarProperties.length > 0 && (
                <div className="max-w-5xl w-full mt-24">
                    <h3 className="text-sm font-bold text-[#FF385C] uppercase tracking-widest mb-8 flex items-center gap-3">
                        <span className="w-2 h-2 bg-[#FF385C] rounded-full animate-pulse"></span>
                        Neural Match Recommendations
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {similarProperties.map(p => (
                            <PropertyCard key={p.property_id} property={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
