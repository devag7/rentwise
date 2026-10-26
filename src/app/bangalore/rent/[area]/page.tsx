import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PropertyCard from '@/components/PropertyCard';
import RentTrendChart from '@/components/RentTrendChart';
import { BHK_TYPES } from '@/utils/market';
import {
    BASE_URL, HISTORY_DAYS, bhkSlug, findAreaBySlug, getAreaStats, getPaidStats,
    getAreaHistory, getCheapestListings, listingsHref, formatINR, formatDate, todayIST,
} from '../_lib';
import { JsonLd, Breadcrumbs, SectionLabel, FaqSection, CheckCta, breadcrumbJsonLd, faqJsonLd, type Faq } from '../_ui';

export const revalidate = 3600;
export const dynamicParams = true;

// No DB at build time: render on first request, then cache (ISR).
export function generateStaticParams(): Array<{ area: string }> {
    return [];
}

type Params = Promise<{ area: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { area: slug } = await params;
    const area = await findAreaBySlug(slug);
    if (!area) return { title: 'Not found' };
    const stats = await getAreaStats(area.area_id);
    const canonical = `/bangalore/rent/${slug}`;
    const parts = BHK_TYPES.filter(t => stats[t]).map(t => `${t} ${formatINR(stats[t]!.median)}`);

    if (parts.length === 0) {
        return {
            title: `Rent in ${area.name}, Bangalore`,
            description: `Too few active listings in ${area.name} right now to publish a median rent. RentWise only shows numbers backed by at least 3 real comparables.`,
            alternates: { canonical },
            robots: { index: false, follow: true },
        };
    }
    return {
        title: `Rent in ${area.name}, Bangalore — median ${parts.join(' · ')}`,
        description:
            `Median asking rent in ${area.name}, Bangalore from live listings: ${parts.join(', ')}. ` +
            `Typical ranges, trend, the cheapest flats available now, and a fair-rent checker.`,
        alternates: { canonical },
        openGraph: { title: `Rent in ${area.name}, Bangalore`, url: `${BASE_URL}${canonical}` },
    };
}

export default async function AreaRentPage({ params }: { params: Params }) {
    const { area: slug } = await params;
    const area = await findAreaBySlug(slug);
    if (!area) notFound();

    const [stats, paid, history, listings] = await Promise.all([
        getAreaStats(area.area_id),
        getPaidStats(area.area_id),
        getAreaHistory(area.area_id),
        getCheapestListings(area.area_id),
    ]);
    const asOf = formatDate(todayIST());
    const path = `/bangalore/rent/${slug}`;
    const crumbs = [
        { name: 'Home', path: '/' },
        { name: 'Bangalore rent', path: '/bangalore/rent' },
        { name: area.name, path },
    ];

    const markets = BHK_TYPES.filter(t => stats[t]).map(t => ({ bhk: t, stat: stats[t]! }));
    const totalComps = markets.reduce((s, m) => s + m.stat.count, 0);
    const paidMarkets = BHK_TYPES.filter(t => paid[t]).map(t => ({ bhk: t, stat: paid[t]! }));
    const charted = BHK_TYPES.filter(t => (history[t]?.length ?? 0) > 0 || stats[t]);

    const faqs: Faq[] = [];
    if (markets.length > 0) {
        faqs.push({
            q: `What is the average rent in ${area.name}, Bangalore?`,
            a: `Median asking rents in ${area.name} as of ${asOf}: ` +
                markets.map(m => `${m.bhk} ${formatINR(m.stat.median)} (${m.stat.count} listings)`).join(', ') +
                `. Based on active listings tracked by RentWise.`,
        });
        const ranged = markets.filter(m => m.stat.p25 != null && m.stat.p75 != null);
        if (ranged.length > 0) {
            faqs.push({
                q: `What is the typical rent range in ${area.name}?`,
                a: `The middle half (25th–75th percentile) of active listings in ${area.name} ask: ` +
                    ranged.map(m => `${m.bhk} ${formatINR(m.stat.p25!)}–${formatINR(m.stat.p75!)}`).join(', ') + ` per month, as of ${asOf}.`,
            });
        }
        faqs.push({
            q: `How many rental listings are there in ${area.name}?`,
            a: `RentWise is tracking ${totalComps} active ${markets.map(m => m.bhk).join('/')} listings in ${area.name} as of ${asOf}, refreshed twice daily from multiple sources.`,
        });
    }
    if (paidMarkets.length > 0) {
        faqs.push({
            q: `How much do tenants actually pay in ${area.name}?`,
            a: `From rents reported by tenants on RentWise: ` +
                paidMarkets.map(m => `${m.bhk} median ${formatINR(m.stat.median)} (${m.stat.count} reports)`).join(', ') + '.',
        });
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white pt-28 sm:pt-32 pb-24 px-4 sm:px-6 selection:bg-[#FF385C] selection:text-white overflow-x-hidden">
            <JsonLd data={breadcrumbJsonLd(BASE_URL, crumbs)} />
            {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}

            <div className="max-w-5xl mx-auto">
                <Breadcrumbs crumbs={crumbs} />

                <p className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-4">Bangalore rent index</p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-6 break-words">
                    Rent in {area.name}
                </h1>
                {markets.length > 0 ? (
                    <p className="text-gray-300 text-lg font-light max-w-2xl">
                        Median asking rent by configuration in {area.name}, Bangalore — from {totalComps} active listings as of {asOf}.
                        Real listings only, no estimates.
                    </p>
                ) : (
                    <p className="text-gray-300 text-lg font-light max-w-2xl">
                        No configuration in {area.name} has 3 or more active listings right now, so we don’t publish a median here yet —
                        too few comparables for an honest number. Any live listings are shown below.
                    </p>
                )}

                <section className="mt-10" aria-label="Rent by configuration">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {BHK_TYPES.map(t => {
                            const s = stats[t];
                            const p = paid[t];
                            return (
                                <Link
                                    key={t}
                                    href={`${path}/${bhkSlug(t)}`}
                                    className="group bg-[#111] border border-white/10 hover:border-[#00A699]/60 p-5 transition-colors min-w-0"
                                >
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">{t} median</p>
                                    {s ? (
                                        <>
                                            <p className="text-3xl font-black tracking-tighter text-white">{formatINR(s.median)}</p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {s.p25 != null && s.p75 != null ? `${formatINR(s.p25)}–${formatINR(s.p75)} · ` : ''}{s.count} listings
                                            </p>
                                            {p && <p className="text-xs text-[#00A699] mt-1">Actually paid: {formatINR(p.median)} ({p.count} reports)</p>}
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-400 mt-1">Fewer than 3 active listings — no median.</p>
                                    )}
                                    <p className="mt-4 text-[10px] font-bold tracking-widest uppercase text-gray-300 group-hover:text-white">{t} rent in {area.name} →</p>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {charted.length > 0 && (
                    <section className="mt-16">
                        <SectionLabel>Median trend · last {HISTORY_DAYS} days</SectionLabel>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {charted.map(t => (
                                <RentTrendChart key={t} points={history[t] ?? []} label={`${t} median, ${area.name}`} />
                            ))}
                        </div>
                    </section>
                )}

                <section className="mt-16">
                    <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
                        <h2 className="text-sm font-bold tracking-widest text-[#00A699] uppercase">Cheapest live listings in {area.name}</h2>
                        <Link href={listingsHref(area.area_id)} className="text-xs font-bold tracking-widest uppercase text-gray-300 hover:text-white transition-colors">
                            All listings in {area.name} →
                        </Link>
                    </div>
                    {listings.length === 0 ? (
                        <div className="bg-[#111] border border-white/10 p-8 text-center">
                            <p className="text-gray-400">No active listings in {area.name} right now. New listings sync twice daily.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {listings.map((p, i) => (
                                <PropertyCard
                                    key={p.property_id}
                                    property={p}
                                    marketStat={p.area_id === area.area_id ? stats[p.property_type] : undefined}
                                    priority={i < 3}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <CheckCta />

                <FaqSection faqs={faqs} />

                <p className="mt-10 text-[10px] font-mono text-gray-400 uppercase tracking-widest leading-relaxed">
                    Median = midpoint of active listing rents in {area.name} for that configuration. Markets with fewer than 3 comparables are not published.
                    {' '}<Link href="/data" className="underline hover:text-white">Open data &amp; methodology</Link> · <Link href="/bangalore/rent" className="underline hover:text-white">All areas</Link>.
                </p>
            </div>
        </div>
    );
}
