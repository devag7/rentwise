import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

export default async function PropertyDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch property and its associated area
    const { data: property, error } = await supabase
        .from('properties')
        .select(`
      *,
      areas ( name )
    `)
        .eq('property_id', id)
        .single();

    if (error || !property) {
        return notFound();
    }

    // Format the area name
    const formattedProperty = {
        ...property,
        area_name: property.areas?.name || 'Unknown Area'
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex justify-center pb-20 pt-28 px-6 transition-colors duration-300">
            <div className="relative max-w-4xl w-full bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-xl dark:shadow-2xl p-8 md:p-12 border border-gray-100 dark:border-gray-800">

                {/* Property Image */}
                <div className="relative w-full h-80 md:h-96 rounded-2xl overflow-hidden mb-8 shadow-inner bg-gray-100 dark:bg-gray-800">
                    {formattedProperty.image_data ? (
                        <img
                            src={`data:image/jpeg;base64,${formattedProperty.image_data}`}
                            alt={formattedProperty.address}
                            className="w-full h-full object-cover rounded-2xl transition-transform transform hover:scale-105 duration-700"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium text-lg">No Image Available</span>
                        </div>
                    )}
                </div>

                {/* Property Info */}
                <div className="grid md:grid-cols-3 gap-10">
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-bold tracking-wide uppercase">
                                    {formattedProperty.property_type}
                                </span>
                                <span className="flex items-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {formattedProperty.area_name}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4 text-balance">
                                {formattedProperty.address}
                            </h1>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-100 dark:border-gray-800">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Size</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white flex items-baseline gap-1">
                                    {formattedProperty.size} <span className="text-sm font-normal text-gray-500">sq ft</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Preferences</p>
                                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                    {formattedProperty.preferences || 'None specified'}
                                </p>
                            </div>
                        </div>

                        {/* Google Maps link if available */}
                        {formattedProperty.google_maps_link && (
                            <div className="pt-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Location</h3>
                                <a
                                    href={formattedProperty.google_maps_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition group"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                    <span className="group-hover:underline underline-offset-4 decoration-blue-500/30">View on Google Maps</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Pricing & Contact Sidebar */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 h-fit sticky top-24">
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Monthly Rent</p>
                        <div className="flex items-end gap-2 mb-6">
                            <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                                ₹{formattedProperty.rent.toLocaleString('en-IN')}
                            </span>
                        </div>

                        {formattedProperty.priceStatus && (
                            <div className={`flex items-center p-3 rounded-xl mb-8 ${formattedProperty.priceStatus === 'overpriced'
                                    ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30'
                                    : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-900/30'
                                }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {formattedProperty.priceStatus === 'overpriced'
                                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    }
                                </svg>
                                <span className="text-sm font-bold">
                                    {formattedProperty.priceStatus === 'overpriced' ? 'Priced above market average' : 'Fairly priced for this area'}
                                </span>
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            {formattedProperty.landlord_phone ? (
                                <a
                                    href={`tel:${formattedProperty.landlord_phone}`}
                                    className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 flex justify-center items-center group"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Call Owner
                                </a>
                            ) : (
                                <button className="w-full py-4 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center">
                                    Contact Owner
                                </button>
                            )}

                            {formattedProperty.landlord_phone && (
                                <p className="text-center text-sm font-mono font-medium text-gray-500 dark:text-gray-400 mt-4">
                                    {formattedProperty.landlord_phone}
                                </p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
