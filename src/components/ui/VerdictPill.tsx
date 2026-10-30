import type { Verdict } from '@/utils/market';

/**
 * The verdict, everywhere it appears: green = under the area median,
 * red = over it, grey = within ±5%. Colour is never the only signal —
 * the text always says it.
 */
export default function VerdictPill({
    verdict,
    size = 'md',
    className = '',
}: {
    verdict: Pick<Verdict, 'label' | 'percent'>;
    size?: 'sm' | 'md';
    className?: string;
}) {
    const tone =
        verdict.label === 'UNDER MARKET' ? 'text-good bg-good/12'
            : verdict.label === 'OVER MARKET' ? 'text-bad bg-bad/12'
                : 'text-label-2 bg-fill';
    const text =
        verdict.label === 'AT MARKET' ? 'At market'
            : `${verdict.percent}% ${verdict.label === 'UNDER MARKET' ? 'under' : 'over'} market`;
    const pad = size === 'sm' ? 'px-2 py-0.5 text-[0.75rem]' : 'px-2.5 py-1 text-footnote';
    return (
        <span className={`inline-flex items-center gap-1 rounded-full font-semibold num ${pad} ${tone} ${className}`}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
            {text}
        </span>
    );
}
