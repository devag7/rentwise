'use client'

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { track } from '@/utils/analytics';
import { formatINR, type Verdict } from '@/utils/market';
import VerdictPill from '@/components/ui/VerdictPill';
import MarketBar from '@/components/ui/MarketBar';

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
    const [copied, setCopied] = useState(false);

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
            setCopied(false);
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

    const verdict = result?.verdict
        ? { label: result.verdict.label as Verdict['label'], percent: result.verdict.percent }
        : null;

    return (
        <div>
            <form onSubmit={submit}>
                <label htmlFor="check-q" className="field-label">Listing link or description</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        id="check-q"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder='Paste a link, or “2BHK HSR Layout 42k”'
                        className="field flex-1"
                        maxLength={2000}
                        autoComplete="off"
                    />
                    <button disabled={busy} className="btn btn-primary sm:min-w-28">
                        {busy ? 'Checking…' : 'Check'}
                    </button>
                </div>
                <p className="mt-2 text-footnote text-label-2">Works with NoBroker, MagicBricks and 99acres links.</p>
            </form>

            {result && (
                <section className="card pop-in mt-10 p-6 sm:p-8" aria-live="polite" aria-label="Result">
                    <p className="text-footnote text-label-2">
                        Read as: <span className="text-label num">{result.parsed.property_type || 'BHK not found'} · {result.parsed.area_name || 'area not found'} · {result.parsed.rent ? formatINR(result.parsed.rent) : 'rent not found'}</span>
                    </p>

                    {verdict && result.stat ? (
                        <div className="mt-5">
                            <VerdictPill verdict={verdict} />
                            <h2 className="mt-3 text-title-2 text-balance">
                                <span className="num">{formatINR(result.parsed.rent!)}</span> for a {result.parsed.property_type} in {result.parsed.area_name}
                            </h2>
                            <MarketBar
                                className="mt-8"
                                median={result.stat.median}
                                p25={result.stat.p25}
                                p75={result.stat.p75}
                                rent={result.parsed.rent}
                                count={result.stat.count}
                            />
                            <p className="mt-4 text-callout text-label-2">
                                Compared with <span className="num">{result.stat.count}</span> live {result.parsed.property_type} listings in {result.parsed.area_name}. The dot is this rent, the line is the median
                                {result.stat.p25 && result.stat.p75 ? ', the dark band is the typical range' : ''}.
                            </p>
                        </div>
                    ) : result.stat ? (
                        <div className="mt-5">
                            <h2 className="text-title-3">
                                Median {result.parsed.property_type} in {result.parsed.area_name}: <span className="num">{formatINR(result.stat.median)}</span>
                            </h2>
                            <MarketBar
                                className="mt-6"
                                median={result.stat.median}
                                p25={result.stat.p25}
                                p75={result.stat.p75}
                                count={result.stat.count}
                            />
                            <p className="mt-4 text-callout text-label-2">
                                From <span className="num">{result.stat.count}</span> live listings. Add the rent to see how this flat compares.
                            </p>
                        </div>
                    ) : null}

                    {result.paid && (
                        <p className="mt-6 rounded-[var(--radius-control)] bg-fill px-4 py-3 text-callout">
                            Tenants report actually paying <span className="font-semibold num">{formatINR(result.paid.median)}</span>
                            {result.paid.deposit_months ? <>, with about <span className="num">{result.paid.deposit_months}</span> months deposit</> : ''}
                            {' '}<span className="text-label-2">(<span className="num">{result.paid.count}</span> reports)</span>.
                        </p>
                    )}

                    {result.message && <p className="mt-5 text-label-2">{result.message}</p>}

                    {script && (
                        <div className="mt-8 border-t border-separator pt-6">
                            <h3 className="text-headline">Message to the owner</h3>
                            <p className="mt-1 text-footnote text-label-2">A polite counter-offer at the market median.</p>
                            <p className="mt-3 rounded-[var(--radius-control)] bg-fill p-4 text-callout">{script}</p>
                            <button
                                type="button"
                                onClick={() => { navigator.clipboard?.writeText(script); track('negotiation_copied', {}); setCopied(true); }}
                                className="btn btn-secondary btn-sm mt-3"
                            >
                                {copied ? 'Copied' : 'Copy message'}
                            </button>
                        </div>
                    )}

                    {result.alternatives.length > 0 && (
                        <div className="mt-8 border-t border-separator pt-6">
                            <h3 className="text-headline">Cheaper {result.parsed.property_type}s in {result.parsed.area_name}</h3>
                            <ul className="mt-3 divide-y divide-separator overflow-hidden rounded-[var(--radius-control)] border border-separator">
                                {result.alternatives.map(a => (
                                    <li key={a.property_id}>
                                        <Link
                                            href={`/properties/${a.property_id}`}
                                            className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-fill"
                                        >
                                            <span className="truncate text-callout">{a.address}</span>
                                            <span className="flex shrink-0 items-baseline gap-2">
                                                <span className="text-headline num">{formatINR(a.rent)}</span>
                                                <span aria-hidden className="text-label-3">›</span>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {shareText && (
                        <div className="mt-8 border-t border-separator pt-6">
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => track('check_shared', { channel: 'whatsapp' })}
                                className="btn btn-secondary"
                            >
                                Share on WhatsApp
                            </a>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
