import { formatINR } from '@/utils/market';

/**
 * RentWise's signature: where a rent sits in its market.
 * Track = the visible range, darker band = typical range (p25–p75),
 * tick = median, dot = the rent being judged (optional).
 * Only render with real comps (callers check MIN_COMPS).
 */
export default function MarketBar({
    median,
    p25,
    p75,
    rent,
    count,
    className = '',
}: {
    median: number;
    p25?: number | null;
    p75?: number | null;
    rent?: number | null;
    count?: number;
    className?: string;
}) {
    const lo = Math.min(p25 ?? median, rent ?? median, median);
    const hi = Math.max(p75 ?? median, rent ?? median, median);
    const pad = Math.max((hi - lo) * 0.18, median * 0.06);
    const min = Math.max(0, lo - pad);
    const max = hi + pad;
    const pos = (v: number) => `${(((v - min) / (max - min)) * 100).toFixed(2)}%`;

    const rentTone = rent == null ? '' : rent > median * 1.05 ? 'bg-bad' : rent < median * 0.95 ? 'bg-good' : 'bg-label';
    const summary = [
        `Median ${formatINR(median)}`,
        p25 != null && p75 != null ? `typical range ${formatINR(p25)} to ${formatINR(p75)}` : null,
        rent != null ? `this rent ${formatINR(rent)}` : null,
        count ? `${count} live listings` : null,
    ].filter(Boolean).join(', ');

    return (
        <figure className={className}>
            <div role="img" aria-label={summary} className="relative h-9">
                <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fill" />
                {p25 != null && p75 != null && (
                    <div
                        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fill-strong"
                        style={{ left: pos(p25), width: `calc(${pos(p75)} - ${pos(p25)})` }}
                    />
                )}
                <div className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-label" style={{ left: pos(median) }} />
                {rent != null && (
                    <div
                        className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-surface-3 ${rentTone}`}
                        style={{ left: pos(rent) }}
                    />
                )}
            </div>
            <figcaption className="mt-1 flex justify-between text-caption text-label-2 num">
                <span>{p25 != null ? formatINR(p25) : ''}</span>
                <span className="font-semibold text-label">Median {formatINR(median)}</span>
                <span>{p75 != null ? formatINR(p75) : ''}</span>
            </figcaption>
        </figure>
    );
}
