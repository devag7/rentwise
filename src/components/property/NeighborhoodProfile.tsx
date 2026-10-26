import Link from 'next/link';
import { BHK_TYPES, formatINR, areaSlug, type MarketStatsMap, marketKey } from '@/utils/market';

/**
 * Area market snapshot — real medians from live listings (replaces the old
 * hardcoded walkability/safety scores).
 */
export default function NeighborhoodProfile({
    areaId,
    areaName,
    stats,
    paid,
}: {
    areaId: number;
    areaName: string;
    stats: MarketStatsMap;
    paid?: { property_type: string; median: number; count: number }[];
}) {
    const cells = BHK_TYPES.map(bhk => ({ bhk, stat: stats[marketKey(areaId, bhk)], paid: paid?.find(p => p.property_type === bhk) }));
    if (!cells.some(c => c.stat)) return null;

    return (
        <section className="bg-[#111] border border-white/10 p-6 sm:p-10">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">{areaName} rent market</h2>
                <Link href={`/bangalore/rent/${areaSlug(areaName)}`} className="text-[10px] font-bold text-[#00A699] uppercase tracking-widest hover:underline">
                    Full {areaName} rent report →
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10 border border-white/10">
                {cells.map(({ bhk, stat, paid: p }) => (
                    <div key={bhk} className="bg-[#0A0A0A] p-5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{bhk} median asking</p>
                        {stat ? (
                            <>
                                <p className="text-2xl font-black text-white tracking-tighter">{formatINR(stat.median)}</p>
                                <p className="text-[10px] font-mono text-gray-500 mt-1">{stat.count} listings{stat.p25 && stat.p75 ? ` · ${formatINR(stat.p25)}–${formatINR(stat.p75)}` : ''}</p>
                                {p && <p className="text-[10px] font-mono text-[#00A699] mt-1">Tenants report paying {formatINR(p.median)} ({p.count})</p>}
                            </>
                        ) : (
                            <p className="text-sm text-gray-600">Not enough listings</p>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
