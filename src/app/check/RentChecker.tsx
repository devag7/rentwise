'use client'

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { track } from '@/utils/analytics';
import { formatINR } from '@/utils/market';

interface CheckResult {
    parsed: { area_id: number | null; area_name: string | null; property_type: string | null; rent: number | null };
    stat: { median: number; p25?: number; p75?: number; count: number } | null;
    verdict: { label: string; percent: number } | null;
    alternatives: { property_id: number; address: string; rent: number; image_url: string | null }[];
    paid: { median: number; deposit_months: number | null; count: number } | null;
    message?: string;
}

async function runCheck(text: string): Promise<CheckResult> {
    // Primary: Supabase Edge Function. Fallback: same logic as a Next.js route.
    try {
        const { data, error } = await createClient().functions.invoke('check-rent', { body: { text } });
        if (!error && data && 'parsed' in data) return data as CheckResult;
    } catch { /* fall through */ }
    const res = await fetch('/api/check-rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
    return res.json();
}

function negotiationScript(r: CheckResult): string | null {
    if (!r.stat || !r.parsed.rent || r.verdict?.label !== 'OVER MARKET') return null;
    const target = Math.round(r.stat.median / 500) * 500;
    return `Hi, I'm interested in the ${r.parsed.property_type} in ${r.parsed.area_name}. Comparable ${r.parsed.property_type}s there are listed around ${formatINR(r.stat.median)} (median of ${r.stat.count} live listings), so ${formatINR(r.parsed.rent)} is about ${r.verdict.percent}% above market. Would you consider ${formatINR(target)}?`;
}

export default function RentChecker() {
    const router = useRouter();
    const params = useSearchParams();
    const initial = params.get('q') || '';
    const [text, setText] = useState(initial);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<CheckResult | null>(null);

    useEffect(() => {
        if (!initial) return;
        let cancelled = false;
        runCheck(initial).then(r => { if (!cancelled) setResult(r); }).catch(() => {});
        return () => { cancelled = true; };
    }, [initial]);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const q = text.trim();
        if (!q) return;
        setBusy(true);
        try {
            const r = await runCheck(q);
            setResult(r);
            track('rent_checked', { verdict: r.verdict?.label ?? 'none', area_id: r.parsed.area_id, bhk: r.parsed.property_type });
            router.replace(`/check?q=${encodeURIComponent(q)}`, { scroll: false });
        } catch {
            setResult({ parsed: { area_id: null, area_name: null, property_type: null, rent: null }, stat: null, verdict: null, alternatives: [], paid: null, message: 'Checker is unavailable right now. Try again in a minute.' });
        } finally {
            setBusy(false);
        }
    };

    const script = result ? negotiationScript(result) : null;
    const shareText = result?.verdict && result.stat
        ? `${result.parsed.property_type} in ${result.parsed.area_name} at ${formatINR(result.parsed.rent!)}: ${result.verdict.label === 'AT MARKET' ? 'at market' : `${result.verdict.percent}% ${result.verdict.label.toLowerCase()}`} (median ${formatINR(result.stat.median)}, ${result.stat.count} comps). Check yours: ${typeof window !== 'undefined' ? window.location.href : ''}`
        : null;

    return (
        <div>
            <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
                <label htmlFor="check-q" className="sr-only">Listing link or description</label>
                <input
                    id="check-q"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder='Paste a link, or "2BHK HSR Layout 42k"'
                    className="flex-1 px-4 py-4 bg-[#111] border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#00A699]"
                    maxLength={2000}
                />
                <button disabled={busy} className="px-8 py-4 bg-[#00A699] text-white font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50">
                    {busy ? 'Checking…' : 'Check'}
                </button>
            </form>

            {result && (
                <div className="mt-10 bg-[#111] border border-white/10 p-6 sm:p-8" aria-live="polite">
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-4">
                        Read as: {result.parsed.property_type || '? BHK'} · {result.parsed.area_name || '? area'} · {result.parsed.rent ? formatINR(result.parsed.rent) : '? rent'}
                    </p>

                    {result.verdict && result.stat ? (
                        <>
                            <p className={`text-4xl sm:text-5xl font-black tracking-tighter ${result.verdict.label === 'OVER MARKET' ? 'text-[#FF385C]' : result.verdict.label === 'UNDER MARKET' ? 'text-[#00A699]' : 'text-white'}`}>
                                {result.verdict.label === 'AT MARKET' ? 'At market' : `${result.verdict.percent}% ${result.verdict.label === 'OVER MARKET' ? 'over' : 'under'} market`}
                            </p>
                            <p className="text-gray-300 mt-3">
                                Median {result.parsed.property_type} in {result.parsed.area_name}: <strong className="text-white">{formatINR(result.stat.median)}</strong>
                                {result.stat.p25 && result.stat.p75 ? <> · typical {formatINR(result.stat.p25)}–{formatINR(result.stat.p75)}</> : null}
                                {' '}· {result.stat.count} live listings
                            </p>
                        </>
                    ) : result.stat ? (
                        <p className="text-gray-300">Median {result.parsed.property_type} in {result.parsed.area_name}: <strong className="text-white">{formatINR(result.stat.median)}</strong> ({result.stat.count} listings)</p>
                    ) : null}

                    {result.paid && (
                        <p className="mt-3 text-sm text-[#00A699]">
                            Tenants report actually paying {formatINR(result.paid.median)}
                            {result.paid.deposit_months ? `, with ~${result.paid.deposit_months} months deposit` : ''} ({result.paid.count} reports).
                        </p>
                    )}

                    {result.message && <p className="mt-4 text-gray-400">{result.message}</p>}

                    {script && (
                        <div className="mt-8">
                            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Negotiation message</h2>
                            <p className="p-4 bg-[#0A0A0A] border border-white/10 text-sm text-gray-200 leading-relaxed">{script}</p>
                            <button type="button" onClick={() => { navigator.clipboard?.writeText(script); track('negotiation_copied', {}); }}
                                className="mt-2 text-[10px] font-bold text-[#00A699] uppercase tracking-widest">Copy</button>
                        </div>
                    )}

                    {result.alternatives.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Cheaper {result.parsed.property_type}s in {result.parsed.area_name}</h2>
                            <ul className="flex flex-col gap-2">
                                {result.alternatives.map(a => (
                                    <li key={a.property_id}>
                                        <Link href={`/properties/${a.property_id}`} className="flex justify-between gap-4 p-3 border border-white/10 hover:border-white/40">
                                            <span className="truncate text-sm">{a.address}</span>
                                            <span className="font-mono text-sm text-[#00A699] shrink-0">{formatINR(a.rent)}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {shareText && (
                        <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                            onClick={() => track('check_shared', { channel: 'whatsapp' })}
                            className="mt-8 inline-flex px-6 py-3 bg-[#25D366] text-black font-bold text-xs uppercase tracking-widest">
                            Share on WhatsApp
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
