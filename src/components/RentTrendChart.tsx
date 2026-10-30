/**
 * Tiny dependency-free SVG line chart of median rent over time.
 * Server component: renders static markup, ships no client JS.
 */
import { formatINR } from '@/utils/market';

export interface TrendPoint {
    date: string; // YYYY-MM-DD
    value: number;
}

const W = 600;
const H = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 16 };

function shortDate(iso: string): string {
    const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default function RentTrendChart({
    points,
    label = 'Median asking rent',
    color = 'var(--accent)',
}: {
    points: TrendPoint[];
    label?: string;
    color?: string;
}) {
    const data = points
        .filter(p => Number.isFinite(p.value) && p.value > 0)
        .sort((a, b) => a.date.localeCompare(b.date));

    if (data.length === 0) {
        return (
            <div className="card p-6 text-center" role="img" aria-label={`${label}: no history recorded yet`}>
                <p className="text-callout text-label-2">No history yet. Daily snapshots start today.</p>
            </div>
        );
    }

    const first = data[0];
    const last = data[data.length - 1];

    if (data.length === 1) {
        return (
            <div
                className="card p-6"
                role="img"
                aria-label={`${label}: ${formatINR(first.value)} on ${shortDate(first.date)}. Only one snapshot so far.`}
            >
                <p className="text-footnote text-label-2">{label} · {shortDate(first.date)}</p>
                <p className="mt-1 text-title-2 num">{formatINR(first.value)}</p>
                <p className="mt-3 text-callout text-label-2">Only one snapshot so far. The trend line appears after the next daily update.</p>
            </div>
        );
    }

    const values = data.map(p => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
        min -= 1;
        max += 1;
    }
    const t0 = Date.parse(`${first.date}T00:00:00Z`);
    const t1 = Date.parse(`${last.date}T00:00:00Z`);
    const span = Math.max(1, t1 - t0);
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const xy = data.map(p => {
        const x = PAD.left + ((Date.parse(`${p.date}T00:00:00Z`) - t0) / span) * innerW;
        const y = PAD.top + (1 - (p.value - min) / (max - min)) * innerH;
        return [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as const;
    });
    const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
    const area = `${line} L${xy[xy.length - 1][0]},${PAD.top + innerH} L${xy[0][0]},${PAD.top + innerH} Z`;

    const change = last.value - first.value;
    const pct = Math.round((change / first.value) * 1000) / 10;
    const summary =
        `${label} went from ${formatINR(first.value)} on ${shortDate(first.date)} ` +
        `to ${formatINR(last.value)} on ${shortDate(last.date)} ` +
        `(${change === 0 ? 'no change' : `${change > 0 ? '+' : ''}${pct}%`}), across ${data.length} daily snapshots.`;

    const gridY = [0, 0.5, 1].map(f => PAD.top + f * innerH);

    return (
        <figure className="card p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <figcaption className="text-footnote text-label-2">{label}</figcaption>
                <span className="chip num">
                    {change === 0 ? 'No change' : `${change > 0 ? '+' : ''}${pct}%`}
                </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={summary}>
                {gridY.map((y, i) => (
                    <line
                        key={y}
                        x1={PAD.left}
                        x2={W - PAD.right}
                        y1={y}
                        y2={y}
                        style={{ stroke: 'var(--separator)' }}
                        strokeWidth={1}
                        strokeDasharray={i === gridY.length - 1 ? undefined : '3 4'}
                        vectorEffect="non-scaling-stroke"
                    />
                ))}
                <path d={area} style={{ fill: color }} fillOpacity={0.1} />
                <path
                    d={line}
                    fill="none"
                    style={{ stroke: color }}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />
                <circle
                    cx={xy[xy.length - 1][0]}
                    cy={xy[xy.length - 1][1]}
                    r={5}
                    style={{ fill: color, stroke: 'var(--surface-3)' }}
                    strokeWidth={2.5}
                />
                <text x={PAD.left} y={H - 8} style={{ fill: 'var(--label-2)' }} fontSize={13}>{shortDate(first.date)}</text>
                <text x={W - PAD.right} y={H - 8} style={{ fill: 'var(--label-2)' }} fontSize={13} textAnchor="end">{shortDate(last.date)}</text>
            </svg>
            <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-separator pt-4 text-footnote">
                <div>
                    <dt className="text-label-2">Low</dt>
                    <dd className="font-semibold num">{formatINR(Math.min(...values))}</dd>
                </div>
                <div className="text-center">
                    <dt className="text-label-2">High</dt>
                    <dd className="font-semibold num">{formatINR(Math.max(...values))}</dd>
                </div>
                <div className="text-right">
                    <dt className="text-label-2">Now</dt>
                    <dd className="font-semibold num">{formatINR(last.value)}</dd>
                </div>
            </dl>
        </figure>
    );
}
