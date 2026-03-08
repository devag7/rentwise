import Link from 'next/link';

export interface Property {
    property_id: number;
    address: string;
    area_name: string;
    property_type: string;
    rent: number;
    size: number;
    image_data?: string;
    priceStatus?: 'overpriced' | 'fair';
}

export default function PropertyCard({ property }: { property: Property }) {
    // Generate a mock AI Match Score based on property features
    const matchScore = Math.floor(80 + (property.property_id % 20));
    const getScoreColor = (score: number) => {
        if (score >= 95) return 'text-green-500 bg-green-500/10 border-green-500/20';
        if (score >= 90) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (score >= 85) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
    };

    return (
        <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                {property.image_data ? (
                    <img
                        src={`data:image/jpeg;base64,${property.image_data}`}
                        alt={property.address}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-80"></div>

                <div className="absolute top-4 right-4 z-10">
                    <div className={`px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center shadow-lg ${getScoreColor(matchScore)}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-bold tracking-tight">{matchScore}% Match</span>
                    </div>
                </div>

                <div className="absolute bottom-4 left-4 z-10">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-lg text-xs font-bold tracking-wide shadow-sm">
                        {property.property_type}
                    </span>
                </div>
            </div>

            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-500 transition-colors">
                    {property.address}
                </h3>

                <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {property.area_name}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">Monthly Rent</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                ₹{property.rent.toLocaleString('en-IN')}
                            </span>
                            {property.priceStatus && (
                                <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${property.priceStatus === 'overpriced'
                                        ? 'bg-red-100 text-red-700 border border-red-200'
                                        : 'bg-green-100 text-green-700 border border-green-200'
                                    }`}>
                                    {property.priceStatus === 'overpriced' ? 'OVERPRICED' : 'FAIR PRICE'}
                                </span>
                            )}
                        </div>
                    </div>

                    <Link
                        href={`/properties/${property.property_id}`}
                        className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm"
                        aria-label="View Details"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}
