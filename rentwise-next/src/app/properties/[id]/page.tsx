import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

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

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex justify-center pb-20 pt-32 px-6 selection:bg-[#FF385C] selection:text-white">
            <div className="relative max-w-5xl w-full bg-[#111] rounded-none shadow-2xl p-0 md:p-12 border border-white/10 flex flex-col md:flex-row gap-12">

                {/* Left Column: Image & Details */}
                <div className="flex-1 w-full flex flex-col gap-10">

                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1.5 bg-black text-white border border-white/20 text-[10px] font-bold tracking-widest uppercase">
                                {formattedProperty.property_type}
                            </span>
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
                    <div className="grid grid-cols-2 gap-8 py-8 border-y border-white/10">
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2">Area Scope</p>
                            <p className="text-3xl font-black text-white tracking-tighter flex items-end gap-2">
                                {formattedProperty.size} <span className="text-xs font-bold text-gray-500 tracking-widest mb-1.5 uppercase">sq ft</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2">Tenant Specs</p>
                            <p className="text-xl font-bold text-gray-300">
                                {formattedProperty.preferences || 'Unrestricted'}
                            </p>
                        </div>
                    </div>

                    {/* Location Link */}
                    {formattedProperty.google_maps_link && (
                        <div>
                            <a
                                href={formattedProperty.google_maps_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-white hover:text-[#FF385C] font-bold text-xs uppercase tracking-widest transition-colors duration-300 group"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                                <span className="group-hover:tracking-[0.2em] transition-all duration-300">Open Map Coordinates</span>
                            </a>
                        </div>
                    )}
                </div>

                {/* Right Column: Pricing & Action */}
                <div className="w-full md:w-[400px]">
                    <div className="bg-[#050505] p-8 border border-white/10 h-fit sticky top-28 flex flex-col">

                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Asking Valuation</p>
                        <div className="flex items-end mb-8">
                            <span className="text-5xl font-black text-white tracking-tighter leading-none">
                                ₹{formattedProperty.rent.toLocaleString('en-IN')}
                            </span>
                            <span className="text-gray-500 font-bold text-xs tracking-widest uppercase ml-2 mb-1">/ Month</span>
                        </div>

                        {/* AI Analysis Block */}
                        <div className="mb-10 bg-[#0A0A0A] border border-white/5 p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#00A699]"></div>
                            <h4 className="text-[10px] font-bold text-[#00A699] uppercase tracking-widest mb-4 flex items-center">
                                <span className="w-2 h-2 bg-[#00A699] rounded-full animate-pulse mr-2"></span>
                                AI Market Analysis
                            </h4>

                            <div className="flex justify-between items-end mb-4">
                                <span className="text-gray-400 font-medium text-sm">Estimated Fair Value</span>
                                <span className="text-2xl font-bold text-white tracking-tight">₹{predictedPrice.toLocaleString('en-IN')}</span>
                            </div>

                            <div className={`flex items-center p-3 border text-[10px] font-bold tracking-widest uppercase ${isGoodDeal
                                    ? 'bg-[#00A699]/10 text-[#00A699] border-[#00A699]/30'
                                    : 'bg-[#FF385C]/10 text-[#FF385C] border-[#FF385C]/30'
                                }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {isGoodDeal
                                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    }
                                </svg>
                                <span>
                                    {isGoodDeal ? `Priced ${differencePercent}% Below Market` : `Priced ${differencePercent}% Above Market`}
                                </span>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div>
                            {formattedProperty.landlord_phone ? (
                                <a
                                    href={`tel:${formattedProperty.landlord_phone}`}
                                    className="w-full py-5 px-4 bg-white text-black font-bold text-xs uppercase tracking-widest text-center transition-all duration-300 hover:bg-[#FF385C] hover:text-white inline-block"
                                >
                                    Initiate Contact
                                </a>
                            ) : (
                                <button disabled className="w-full py-5 px-4 bg-white/5 text-gray-500 font-bold text-xs uppercase tracking-widest cursor-not-allowed border border-white/10">
                                    Owner Contact Hidden
                                </button>
                            )}

                            {formattedProperty.landlord_phone && (
                                <p className="text-center text-[10px] font-mono font-medium text-gray-500 uppercase tracking-widest mt-4">
                                    Direct Line: {formattedProperty.landlord_phone}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
