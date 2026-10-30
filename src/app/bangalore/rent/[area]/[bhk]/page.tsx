import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PropertyCard from '@/components/PropertyCard';
import RentTrendChart from '@/components/RentTrendChart';
import Container from '@/components/ui/Container';
import MarketBar from '@/components/ui/MarketBar';
import { BHK_TYPES } from '@/utils/market';
import {
    BASE_URL, HISTORY_DAYS, bhkFromSlug, bhkSlug, findAreaBySlug, getAreaStats, getPaidStats,
    getAreaHistory, getCheapestListings, listingsHref, formatINR, formatDate, todayIST,
} from '../../_lib';
import { JsonLd, Breadcrumbs, SectionLabel, Stat, FaqSection, CheckCta, breadcrumbJsonLd, faqJsonLd, type Faq } from '../../_ui';

export const revalidate = 3600;
export const dynamicParams = true;

// No DB at build time: render on first request, then cache (ISR).
export function generateStaticParams(): Array<{ area: string; bhk: string }> {
    return [];
}

type Params = Promise<{ area: string; bhk: string }>;

async function resolve(params: Params) {
    const { area: slug, bhk: bhkParam } = await params;
    const bhk = bhkFromSlug(bhkParam);
    if (!bhk || bhkParam !== bhkSlug(bhk)) return null;
    const area = await findAreaBySlug(slug);
    if (!area) return null;
    return { area, bhk, slug };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const r = await resolve(params);
    if (!r) return { title: 'Not found' };
    const { area, bhk, slug } = r;
    const stat = (await getAreaStats(area.area_id))[bhk];
    const canonical = `/bangalore/rent/${slug}/${bhkSlug(bhk)}`;

    if (!stat) {
        return {
            title: `${bhk} rent in ${area.name}, Bangalore`,
            description: `Too few active ${bhk} listings in ${area.name} right now to publish a median rent. RentWise only shows numbers backed by at least 3 real comparables.`,
            alternates: { canonical },
            robots: { index: false, follow: true },
        };
    }

    const range = stat.p25 != null && stat.p75 != null ? ` Typical range ${formatINR(stat.p25)}–${formatINR(stat.p75)}.` : '';
    return {
        title: `${bhk} rent in ${area.name}, Bangalore — ${formatINR(stat.median)} median`,
        description:
            `Median ${bhk} asking rent in ${area.name} is ${formatINR(stat.median)}/month from ${stat.count} live listings.${range} ` +
            `See the trend, the cheapest flats available now, and check if your rent is fair.`,
        alternates: { canonical },
        openGraph: {
            title: `${bhk} rent in ${area.name}: ${formatINR(stat.median)} median`,
            url: `${BASE_URL}${canonical}`,
        },
    };
}

export default async function BhkRentPage({ params }: { params: Params }) {
    const r = await resolve(params);
    if (!r) notFound();
    const { area, bhk, slug } = r;

    const [stats, paid, history, listings] = await Promise.all([
        getAreaStats(area.area_id),
        getPaidStats(area.area_id),
        getAreaHistory(area.area_id, bhk),
        getCheapestListings(area.area_id, bhk),
    ]);
    const stat = stats[bhk];
    const paidStat = paid[bhk];
    const points = history[bhk] ?? [];
    const asOf = formatDate(todayIST());

    const areaPathName = `/bangalore/rent/${slug}`;
    const crumbs = [
        { name: 'Home', path: '/' },
        { name: 'Bangalore rent', path: '/bangalore/rent' },
        { name: area.name, path: areaPathName },
        { name: bhk, path: `${areaPathName}/${bhkSlug(bhk)}` },
    ];

    const faqs: Faq[] = [];
    if (stat) {
        faqs.push({
            q: `What is the average rent for a ${bhk} in ${area.name}?`,
            a: `The median asking rent for a ${bhk} in ${area.name}, Bangalore is ${formatINR(stat.median)} per month, based on ${stat.count} active listings tracked by RentWise as of ${asOf}.`,
        });
        if (stat.p25 != null && stat.p75 != null) {
            faqs.push({
                q: `What is the typical rent range for a ${bhk} in ${area.name}?`,
                a: `The middle half of active ${bhk} listings in ${area.name} ask between ${formatINR(stat.p25)} and ${formatINR(stat.p75)} per month (25th to 75th percentile of ${stat.count} listings, as of ${asOf}).`,
            });
        }
    }
    if (paidStat) {
        faqs.push({
            q: `How much do tenants actually pay for a ${bhk} in ${area.name}?`,
            a: `Based on ${paidStat.count} rents reported by tenants on RentWise, the median rent actually paid for a ${bhk} in ${area.name} is ${formatINR(paidStat.median)} per month` +
                (paidStat.deposit_months != null ? `, with an average deposit of ${paidStat.deposit_months} months' rent.` : '.'),
        });
    }
    if (points.length >= 2) {
        const a = points[0];
        const b = points[points.length - 1];
        const pct = Math.round(((b.value - a.value) / a.value) * 1000) / 10;
        faqs.push({
            q: `Is ${bhk} rent in ${area.name} going up?`,
            a: `The median asking rent for a ${bhk} in ${area.name} moved from ${formatINR(a.value)} on ${formatDate(a.date)} to ${formatINR(b.value)} on ${formatDate(b.date)} (${pct > 0 ? '+' : ''}${pct}%), across ${points.length} daily snapshots.`,
        });
    }

    const otherBhks = BHK_TYPES.filter(t => t !== bhk);

    return (
        <div className="pt-28 pb-24 sm:pt-32 sm:pb-32">
            <JsonLd data={breadcrumbJsonLd(BASE_URL, crumbs)} />
            {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}

            <Container>
                <Breadcrumbs crumbs={crumbs} />

                <h1 className="text-title-1 break-words text-balance">{bhk} rent in {area.name}, Bangalore</h1>

                {stat ? (
                    <p className="mt-4 max-w-2xl text-lead text-label-2 text-balance">
                        A {bhk} in {area.name} asks a median of <strong className="font-semibold text-label num">{formatINR(stat.median)}/mo</strong>,
                        based on <span className="num">{stat.count}</span> live listings as of {asOf}. Real listings only, no estimates.
                    </p>
                ) : (
                    <p className="mt-4 max-w-2xl text-lead text-label-2 text-balance">
                        There are fewer than 3 live {bhk} listings in {area.name} right now, so we don’t publish a median —
                        too few comparables for an honest number. Any live listings are shown below.
                    </p>
                )}

                {stat && (
                    <section className="mt-10" aria-label="Rent statistics">
                        <div className="card p-6 sm:p-8">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <div>
                                    <p className="text-footnote text-label-2">Median asking rent</p>
                                    <p className="mt-1 text-title-1 num">
                                        {formatINR(stat.median)}<span className="text-title-3 font-normal text-label-2">/mo</span>
                                    </p>
                                </div>
                                <p className="text-footnote text-label-2 num">{stat.count} live listings · {asOf}</p>
                            </div>
                            {stat.p25 != null && stat.p75 != null && (
                                <>
                                    <MarketBar className="mt-8" median={stat.median} p25={stat.p25} p75={stat.p75} count={stat.count} />
                                    <p className="mt-4 text-callout text-label-2">
                                        The dark band is the typical range — the middle half of listings ask between{' '}
                                        <span className="num">{formatINR(stat.p25)}</span> and <span className="num">{formatINR(stat.p75)}</span>. The line is the median.
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Stat
                                label="Typical range"
                                value={stat.p25 != null && stat.p75 != null ? `${formatINR(stat.p25)}–${formatINR(stat.p75)}` : '—'}
                                sub="Middle half of listings"
                            />
                            <Stat label="Comparables" value={String(stat.count)} sub={`Live listings as of ${asOf}`} />
                            {paidStat ? (
                                <Stat
                                    label="Actually paid"
                                    value={formatINR(paidStat.median)}
                                    sub={`${paidStat.count} tenant reports${paidStat.deposit_months != null ? ` · deposit about ${paidStat.deposit_months} months` : ''}`}
                                />
                            ) : (
                                <Stat label="Actually paid" value="—" sub="Fewer than 3 tenant reports so far" />
                            )}
                        </div>
                    </section>
                )}

                <section className="mt-16">
                    <SectionLabel>Median trend, last <span className="num">{HISTORY_DAYS}</span> days</SectionLabel>
                    <RentTrendChart points={points} label={`${bhk} median asking rent, ${area.name}`} />
                </section>

                <section className="mt-16">
                    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
                        <h2 className="text-title-2">Cheapest {bhk} flats</h2>
                        <Link href={listingsHref(area.area_id, bhk)} className="link link-chevron text-callout">
                            All {bhk} in {area.name}
                        </Link>
                    </div>
                    {listings.length === 0 ? (
                        <div className="card px-6 py-12 text-center">
                            <p className="text-title-3">No live {bhk} listings right now</p>
                            <p className="mt-2 text-label-2">New listings in {area.name} sync twice a day.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {listings.map((p, i) => (
                                <PropertyCard key={p.property_id} property={p} marketStat={stat} priority={i < 3} />
                            ))}
                        </div>
                    )}
                </section>

                <section className="mt-16">
                    <SectionLabel>More in {area.name}</SectionLabel>
                    <ul className="card divide-y divide-separator overflow-hidden">
                        {otherBhks.map(t => {
                            const s = stats[t];
                            return (
                                <li key={t}>
                                    <Link
                                        href={`${areaPathName}/${bhkSlug(t)}`}
                                        className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-fill"
                                    >
                                        <span className="text-headline">{t} rent</span>
                                        <span className="flex items-baseline gap-3">
                                            {s
                                                ? <span className="text-headline num">{formatINR(s.median)}</span>
                                                : <span className="text-footnote text-label-2">Too few listings</span>}
                                            <span aria-hidden className="text-label-3">›</span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                        <li>
                            <Link href={areaPathName} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-fill">
                                <span className="text-headline">All of {area.name}</span>
                                <span aria-hidden className="text-label-3">›</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/bangalore/rent" className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-fill">
                                <span className="text-headline">Other areas</span>
                                <span aria-hidden className="text-label-3">›</span>
                            </Link>
                        </li>
                    </ul>
                </section>

                <CheckCta />

                <FaqSection faqs={faqs} />

                <p className="mt-10 text-footnote text-label-2">
                    Median is the middle asking rent of live {bhk} listings in {area.name}. Markets with fewer than 3 comparables are not published.
                    “Actually paid” comes from anonymous tenant reports, shown only once there are 3 or more.
                </p>
                <div className="mt-3 text-footnote">
                    <Link href="/data" className="link link-chevron">Open data and methodology</Link>
                </div>
            </Container>
        </div>
    );
}
