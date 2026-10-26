import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PropertyCard from '@/components/PropertyCard';
import RentTrendChart from '@/components/RentTrendChart';
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
        <div className="min-h-screen bg-[#0A0A0A] text-white pt-28 sm:pt-32 pb-24 px-4 sm:px-6 selection:bg-[#FF385C] selection:text-white overflow-x-hidden">
            <JsonLd data={breadcrumbJsonLd(BASE_URL, crumbs)} />
            {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}

            <div className="max-w-5xl mx-auto">
                <Breadcrumbs crumbs={crumbs} />

                <p className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-4">Bangalore rent index</p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-6 break-words">
                    {bhk} rent in {area.name}, Bangalore
                </h1>

                {stat ? (
                    <p className="text-gray-300 text-lg font-light max-w-2xl">
                        A {bhk} in {area.name} asks a median of <strong className="text-white font-bold">{formatINR(stat.median)}/month</strong>,
                        based on {stat.count} active listings as of {asOf}. Real listings only — no estimates.
                    </p>
                ) : (
                    <p className="text-gray-300 text-lg font-light max-w-2xl">
                        There are fewer than 3 active {bhk} listings in {area.name} right now, so we don’t publish a median —
                        too few comparables for an honest number. Any live listings are shown below.
                    </p>
                )}

                {stat && (
                    <section className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Rent statistics">
                        <Stat label="Median asking rent" value={formatINR(stat.median)} sub={`${stat.count} active listings`} accent />
                        <Stat
                            label="Typical range (p25–p75)"
                            value={stat.p25 != null && stat.p75 != null ? `${formatINR(stat.p25)}–${formatINR(stat.p75)}` : '—'}
                            sub="Middle half of listings"
                        />
                        <Stat label="Comparables" value={String(stat.count)} sub={`As of ${asOf}`} />
                        {paidStat ? (
                            <Stat
                                label="Actually paid (tenant reports)"
                                value={formatINR(paidStat.median)}
                                sub={`${paidStat.count} reports${paidStat.deposit_months != null ? ` · deposit ≈ ${paidStat.deposit_months} mo` : ''}`}
                            />
                        ) : (
                            <Stat label="Actually paid" value="—" sub="Fewer than 3 tenant reports yet" />
                        )}
                    </section>
                )}

                <section className="mt-16">
                    <SectionLabel>Median trend · last {HISTORY_DAYS} days</SectionLabel>
                    <RentTrendChart points={points} label={`${bhk} median asking rent, ${area.name}`} />
                </section>

                <section className="mt-16">
                    <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
                        <h2 className="text-sm font-bold tracking-widest text-[#00A699] uppercase">Cheapest live {bhk} listings</h2>
                        <Link href={listingsHref(area.area_id, bhk)} className="text-xs font-bold tracking-widest uppercase text-gray-300 hover:text-white transition-colors">
                            All {bhk} in {area.name} →
                        </Link>
                    </div>
                    {listings.length === 0 ? (
                        <div className="bg-[#111] border border-white/10 p-8 text-center">
                            <p className="text-gray-400">No active {bhk} listings in {area.name} right now. New listings sync twice daily.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {listings.map((p, i) => (
                                <PropertyCard key={p.property_id} property={p} marketStat={stat} priority={i < 3} />
                            ))}
                        </div>
                    )}
                </section>

                <section className="mt-16">
                    <SectionLabel>More in {area.name}</SectionLabel>
                    <div className="flex flex-wrap gap-3">
                        {otherBhks.map(t => {
                            const s = stats[t];
                            return (
                                <Link
                                    key={t}
                                    href={`${areaPathName}/${bhkSlug(t)}`}
                                    className="px-5 py-3 border border-white/15 hover:border-white text-sm font-bold tracking-widest uppercase text-white transition-colors"
                                >
                                    {t} rent{s ? <span className="text-gray-400 font-mono normal-case tracking-normal ml-2">{formatINR(s.median)}</span> : null}
                                </Link>
                            );
                        })}
                        <Link
                            href={areaPathName}
                            className="px-5 py-3 border border-white/15 hover:border-white text-sm font-bold tracking-widest uppercase text-white transition-colors"
                        >
                            All of {area.name}
                        </Link>
                        <Link
                            href="/bangalore/rent"
                            className="px-5 py-3 border border-white/15 hover:border-white text-sm font-bold tracking-widest uppercase text-gray-300 transition-colors"
                        >
                            Other areas
                        </Link>
                    </div>
                </section>

                <CheckCta />

                <FaqSection faqs={faqs} />

                <p className="mt-10 text-[10px] font-mono text-gray-400 uppercase tracking-widest leading-relaxed">
                    Median = midpoint of active listing rents for {bhk} in {area.name}. Markets with fewer than 3 comparables are not published.
                    “Actually paid” comes from anonymous tenant reports, shown only with 3+ reports. <Link href="/data" className="underline hover:text-white">Open data &amp; methodology</Link>.
                </p>
            </div>
        </div>
    );
}
