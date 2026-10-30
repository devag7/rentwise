import Link from 'next/link';
import { BHK_TYPES, formatINR, areaSlug, type MarketStatsMap, marketKey } from '@/utils/market';
import MarketBar from '@/components/ui/MarketBar';

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
        <section className="card p-6 sm:p-8" aria-labelledby="area-market-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <div>
                    <h2 id="area-market-heading" className="text-title-3">Rent in {areaName}</h2>
                    <p className="mt-1 text-callout text-label-2">Median asking rent of live listings, by size.</p>
                </div>
                <Link href={`/bangalore/rent/${areaSlug(areaName)}`} className="link link-chevron text-callout">
                    Full {areaName} rent report
                </Link>
            </div>
            <div className="mt-6 grid divide-y divide-separator sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {cells.map(({ bhk, stat, paid: p }) => (
                    <div key={bhk} className="min-w-0 py-5 first:pt-0 last:pb-0 sm:px-5 sm:py-0 sm:first:pl-0 sm:last:pr-0">
                        <p className="text-footnote text-label-2">{bhk}</p>
                        {stat ? (
                            <>
                                <p className="mt-0.5 text-title-3 num">{formatINR(stat.median)}<span className="text-footnote font-normal text-label-2">/mo</span></p>
                                <p className="text-caption text-label-2 num">{stat.count} live listings</p>
                                {stat.p25 != null && stat.p75 != null && (
                                    <MarketBar className="mt-3" median={stat.median} p25={stat.p25} p75={stat.p75} count={stat.count} />
                                )}
                                {p && (
                                    <p className="mt-2 text-caption text-label-2 num">
                                        Tenants report paying {formatINR(p.median)} ({p.count} reports)
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="mt-1 text-callout text-label-3">Too few listings to say</p>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
