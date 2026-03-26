'use client'

interface Props {
    propertyId: number;
}

export default function PropertyReviews({ propertyId }: Props) {
    // Deterministic mock reviews based on propertyId
    const seed = propertyId || 1;
    const rating = ((seed % 15) * 0.1 + 3.8).toFixed(1); // 3.8 to 4.9 score

    const reviews = [
        {
            id: 1,
            name: "Verified Tenant A.",
            role: "Software Engineer",
            date: "October 2025",
            score: 5,
            text: "The integration with the RentWise platform made the lease process incredibly smooth. The property itself is exactly as verified by the AI matching system."
        },
        {
            id: 2,
            name: "Verified Tenant M.",
            role: "Product Designer",
            date: "July 2024",
            score: 4,
            text: "Excellent corporate housing setup. Maintenance pings were addressed within SLA timeframes. Only deducted one star due to slight noise from the adjacent transit corridor."
        },
        {
            id: 3,
            name: "Verified Tenant S.",
            role: "Tech Lead",
            date: "January 2024",
            score: 5,
            text: "Absolute zero-friction experience. The digital lease generation saved me hours of paperwork. The neighborhood analytics were 100% accurate."
        }
    ];

    return (
        <div className="w-full mt-4 bg-[#0A0A0A] border border-white/5 p-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-12">

                {/* Aggregate Score */}
                <div className="md:w-1/3 flex flex-col items-center md:items-start justify-center border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 pr-0 md:pr-8">
                    <h3 className="text-sm font-bold text-[#FF385C] uppercase tracking-widest mb-4 flex items-center gap-3">
                        <span className="w-2 h-2 bg-[#FF385C] rounded-full animate-pulse"></span>
                        Verified Consensus
                    </h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-6xl font-black text-white leading-none tracking-tighter">{rating}</span>
                        <span className="text-gray-500 font-bold mb-1">/ 5.0</span>
                    </div>
                    <div className="flex text-[#FF385C] mb-4">
                        {[1, 2, 3, 4, 5].map(star => (
                            <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase text-center md:text-left">
                        Based on {12 + (seed % 10)} Cryptographically Verified Leases
                    </p>
                </div>

                {/* Review List */}
                <div className="md:w-2/3 grid grid-cols-1 gap-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="p-5 bg-[#111] border border-white/5 relative group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#333] group-hover:bg-[#FF385C] transition-colors"></div>

                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-white font-bold text-sm">{review.name}</h4>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">{review.role}</p>
                                </div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{review.date}</span>
                            </div>

                            <p className="text-gray-300 text-sm leading-relaxed mb-3">"{review.text}"</p>

                            <div className="flex text-gray-600">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${i < review.score ? 'text-[#FF385C]' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
