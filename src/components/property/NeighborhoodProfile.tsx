'use client'

interface Props {
    areaName: string;
}

export default function NeighborhoodProfile({ areaName }: Props) {

    const getMockIntelligence = (area: string) => {
        const defaultIntel = { walkability: 75, safety: 80, vibe: "Urban Mix", tags: ['Convenient', 'Mixed Zoning', 'Active'] };
        const profiles: Record<string, { walkability: number, safety: number, vibe: string, tags: string[] }> = {
            'Indiranagar': { walkability: 98, safety: 92, vibe: "Tech & Brews", tags: ['Nightlife', 'Startups', 'Metro Access'] },
            'Koramangala': { walkability: 90, safety: 95, vibe: "Startup Hub", tags: ['Entrepreneurial', 'Cafes', 'Youthful'] },
            'Whitefield': { walkability: 70, safety: 98, vibe: "Corporate Residential", tags: ['Tech Parks', 'Family-Friendly', 'Malls'] },
            'HSR Layout': { walkability: 95, safety: 96, vibe: "Organized Sector", tags: ['Parks', 'Grid Layout', 'Quiet'] },
            'Bellandur': { walkability: 60, safety: 85, vibe: "Hyper-Dense IT", tags: ['Corporate', 'High-Rise', 'Bustling'] },
            'Marathahalli': { walkability: 65, safety: 82, vibe: "Commercial Transit", tags: ['Outer Ring Road', 'Retail', 'Accessible'] },
            'Jayanagar': { walkability: 96, safety: 98, vibe: "Heritage Green", tags: ['Canopy Trees', 'Cultural', 'Established'] }
        };
        return profiles[area] || defaultIntel;
    };

    const intel = getMockIntelligence(areaName);

    return (
        <div className="w-full mt-16 bg-[#050505] border border-white/5 p-8 relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00A699]/5 rounded-full blur-3xl group-hover:bg-[#00A699]/10 transition-colors duration-1000"></div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">

                <div className="flex-1">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-3">
                        <span className="w-2 h-2 bg-[#00A699] rounded-full animate-pulse"></span>
                        Neural Neighborhood Profile
                    </h3>
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-6">
                        {areaName}
                    </h2>

                    <div className="flex flex-wrap gap-3 mb-6">
                        {intel.tags.map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 bg-[#111] border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex gap-8">
                    <div className="text-center md:text-left">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-[3px] border-[#00A699] flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(0,166,153,0.2)]">
                            <span className="text-2xl md:text-3xl font-black text-white mb-[-4px]">{intel.walkability}</span>
                            <span className="text-[8px] font-bold text-[#00A699] uppercase tracking-widest">Transit</span>

                            {/* SVG Circle progress */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="#111" strokeWidth="3" />
                                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="#00A699" strokeWidth="3" strokeDasharray={`${intel.walkability * 2.5} 300`} strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>

                    <div className="text-center md:text-left">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-[3px] border-[#FF385C] flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(255,56,92,0.2)]">
                            <span className="text-2xl md:text-3xl font-black text-white mb-[-4px]">{intel.safety}</span>
                            <span className="text-[8px] font-bold text-[#FF385C] uppercase tracking-widest">Safety</span>

                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="#111" strokeWidth="3" />
                                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="#FF385C" strokeWidth="3" strokeDasharray={`${intel.safety * 2.5} 300`} strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Calculated Vibe Metric</span>
                    <span className="text-lg font-bold text-white tracking-tight">{intel.vibe}</span>
                </div>
                <div className="mt-4 md:mt-0 px-6 py-2 bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#00A699]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Verified by RentWise Oracles
                </div>
            </div>
        </div>
    );
}
