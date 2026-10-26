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
    color = '#00A699',
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
            <div className="border border-white/10 bg-[#111] p-6 text-center" role="img" aria-label={`${label}: no history recorded yet`}>
                <p className="text-sm text-gray-400">History starts today — check back.</p>
            </div>
        );
    }

    const first = data[0];
    const last = data[data.length - 1];

    if (data.length === 1) {
        return (
            <div
                className="border border-white/10 bg-[#111] p-6"
                role="img"
                aria-label={`${label}: ${formatINR(first.value)} on ${shortDate(first.date)}. Only one snapshot so far.`}
            >
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">{shortDate(first.date)}</p>
                <p className="text-2xl font-black text-white tracking-tight">{formatINR(first.value)}</p>
                <p className="text-sm text-gray-400 mt-3">History starts today — check back.</p>
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

    return (
        <figure className="border border-white/10 bg-[#111] p-4 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <figcaption className="text-[10px] font-bold tracking-widest uppercase text-gray-400">{label}</figcaption>
                <span className={`text-xs font-bold tracking-widest ${change > 0 ? 'text-[#FF385C]' : change < 0 ? 'text-[#00A699]' : 'text-gray-400'}`}>
                    {change === 0 ? 'FLAT' : `${change > 0 ? '+' : ''}${pct}%`}
                </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label={summary}>
                <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top} y2={PAD.top} stroke="rgba(255,255,255,0.08)" />
                <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="rgba(255,255,255,0.15)" />
                <path d={area} fill={color} fillOpacity={0.12} />
                <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r={4} fill={color} />
                <text x={PAD.left} y={H - 8} fill="#9CA3AF" fontSize={12}>{shortDate(first.date)}</text>
                <text x={W - PAD.right} y={H - 8} fill="#9CA3AF" fontSize={12} textAnchor="end">{shortDate(last.date)}</text>
            </svg>
            <div className="mt-3 flex justify-between gap-4 text-xs text-gray-400 font-mono">
                <span>Low {formatINR(Math.min(...values))}</span>
                <span>High {formatINR(Math.max(...values))}</span>
                <span className="text-white">Now {formatINR(last.value)}</span>
            </div>
        </figure>
    );
}
