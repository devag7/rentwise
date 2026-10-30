import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PropertyCard from '@/components/PropertyCard';
import RentTrendChart from '@/components/RentTrendChart';
import Container from '@/components/ui/Container';
import MarketBar from '@/components/ui/MarketBar';
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
        <div className="pt-28 pb-24 sm:pt-32 sm:pb-32">
            <JsonLd data={breadcrumbJsonLd(BASE_URL, crumbs)} />
            {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}

            <Container>
                <Breadcrumbs crumbs={crumbs} />

                <h1 className="text-title-1 break-words text-balance">Rent in {area.name}</h1>
                {markets.length > 0 ? (
                    <p className="mt-4 max-w-2xl text-lead text-label-2 text-balance">
                        Median asking rent by size in {area.name}, Bangalore — from <span className="num">{totalComps}</span> live listings as of {asOf}.
                        Real listings only, no estimates.
                    </p>
                ) : (
                    <p className="mt-4 max-w-2xl text-lead text-label-2 text-balance">
                        No flat size in {area.name} has 3 or more live listings right now, so we don’t publish a median here yet —
                        too few comparables for an honest number. Any live listings are shown below.
                    </p>
                )}

                <section className="mt-10" aria-label="Rent by configuration">
                    <ul className="flex flex-col gap-4">
                        {BHK_TYPES.map(t => {
                            const s = stats[t];
                            const p = paid[t];
                            return (
                                <li key={t}>
                                    <Link
                                        href={`${path}/${bhkSlug(t)}`}
                                        className="card pressable grid min-w-0 gap-6 p-5 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:items-center sm:p-6"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-footnote text-label-2">{t} median</p>
                                            {s ? (
                                                <>
                                                    <p className="mt-1 text-title-2 num">{formatINR(s.median)}</p>
                                                    <p className="mt-1 text-footnote text-label-2 num">{s.count} live listings</p>
                                                    {p && (
                                                        <p className="mt-1 text-footnote text-label-2">
                                                            Tenants report paying <span className="font-semibold text-label num">{formatINR(p.median)}</span>{' '}
                                                            (<span className="num">{p.count}</span> reports)
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="mt-1 text-callout text-label-2">Fewer than 3 live listings, so no median yet.</p>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            {s && s.p25 != null && s.p75 != null && (
                                                <MarketBar median={s.median} p25={s.p25} p75={s.p75} count={s.count} />
                                            )}
                                            <p className={`text-callout text-accent ${s && s.p25 != null && s.p75 != null ? 'mt-3 sm:text-right' : 'sm:text-right'}`}>
                                                {t} rent in {area.name} <span aria-hidden>›</span>
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    {markets.some(m => m.stat.p25 != null && m.stat.p75 != null) && (
                        <p className="mt-3 text-footnote text-label-2">The dark band is the typical range (middle half of listings); the line is the median.</p>
                    )}
                </section>

                {charted.length > 0 && (
                    <section className="mt-16">
                        <SectionLabel>Median trend, last <span className="num">{HISTORY_DAYS}</span> days</SectionLabel>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {charted.map(t => (
                                <RentTrendChart key={t} points={history[t] ?? []} label={`${t} median, ${area.name}`} />
                            ))}
                        </div>
                    </section>
                )}

                <section className="mt-16">
                    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
                        <h2 className="text-title-2">Cheapest flats in {area.name}</h2>
                        <Link href={listingsHref(area.area_id)} className="link link-chevron text-callout">
                            All listings in {area.name}
                        </Link>
                    </div>
                    {listings.length === 0 ? (
                        <div className="card px-6 py-12 text-center">
                            <p className="text-title-3">No live listings right now</p>
                            <p className="mt-2 text-label-2">New listings in {area.name} sync twice a day.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

                <p className="mt-10 text-footnote text-label-2">
                    Median is the middle asking rent of live listings in {area.name} for that size. Markets with fewer than 3 comparables are not published.
                </p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-footnote">
                    <Link href="/data" className="link link-chevron">Open data and methodology</Link>
                    <Link href="/bangalore/rent" className="link link-chevron">All areas</Link>
                </div>
            </Container>
        </div>
    );
}
