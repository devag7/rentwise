import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ApplicationCard from '@/components/property/ApplicationCard';
import InteractiveMediaLinks from '@/components/property/InteractiveMediaLinks';
import CommuteAnalyzer from '@/components/property/CommuteAnalyzer';
import AffordabilityCalculator from '@/components/property/AffordabilityCalculator';
import TourScheduler from '@/components/property/TourScheduler';
import NeighborhoodProfile from '@/components/property/NeighborhoodProfile';
import PropertyReviews, { type Review } from '@/components/property/PropertyReviews';
import PropertyCard from '@/components/PropertyCard';
import ShareListing from '@/components/property/ShareListing';
import ReportListing from '@/components/property/ReportListing';
import { createPublicClient } from '@/utils/supabase/public';
import { getMarketStats, marketKey, getVerdict, formatINR } from '@/utils/market';
import { CARD_COLUMNS, toProperty, queryActive } from '@/utils/listings';
import Container from '@/components/ui/Container';

// Listing pages are public data: cache and refresh every 10 minutes.
export const revalidate = 600;

// Render on first request, then serve from cache (no DB access at build time).
export async function generateStaticParams() {
    return [];
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rentwise.devshipit.com';

const getProperty = cache(async (id: string) => {
    if (!/^\d+$/.test(id)) return null;
    const { data } = await createPublicClient()
        .from('properties')
        .select('*, areas ( name )')
        .eq('property_id', id)
        .maybeSingle();
    return data ? toProperty(data) as ReturnType<typeof toProperty> & Record<string, unknown> : null;
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const p = await getProperty(id);
    if (!p) return { title: 'Listing not found' };

    const title = `${p.property_type || 'Flat'} for rent in ${p.area_name} — ${formatINR(p.rent)}/mo`;
    const description = (p.description || `${p.property_type} at ${p.address}, ${p.area_name}. Fair-rent verdict from real market comparables on RentWise.`).slice(0, 155);
    return {
        title,
        description,
        openGraph: { title, description, type: 'article', ...(p.image_url ? { images: [p.image_url.split(',')[0]] } : {}) },
        alternates: { canonical: `/properties/${id}` },
    };
}

export default async function PropertyDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const property = await getProperty(id);
    if (!property) notFound();

    const supabase = createPublicClient();
    const areaId = property.area_id as number;

    const [areaStats, { data: similarData }, { data: reviewData }, { data: paidData }] = await Promise.all([
        getMarketStats(supabase, { areaId }),
        queryActive((activeOnly) => {
            let q = supabase.from('properties').select(CARD_COLUMNS)
                .eq('area_id', areaId)
                .neq('property_id', property.property_id);
            if (activeOnly) q = q.eq('is_active', true);
            if (property.property_type) q = q.eq('property_type', property.property_type);
            return q.order('rent', { ascending: true }).limit(3);
        }),
        supabase.from('reviews').select('review_id, rating, review_text, created_at')
            .eq('property_id', property.property_id).order('created_at', { ascending: false }).limit(20),
        supabase.from('paid_rent_stats').select('property_type, median, count').eq('area_id', areaId),
    ]);

    const stat = areaStats[marketKey(areaId, property.property_type)];
    const verdict = getVerdict(property.rent, stat);
    const verdictText = verdict
        ? (verdict.label === 'AT MARKET' ? 'at market' : `${verdict.percent}% ${verdict.label.toLowerCase()}`)
        : undefined;

    const images: string[] = property.image_url
        ? property.image_url.split(',').map((u: string) => u.trim()).filter(Boolean)
        : [];
    const similar = ((similarData || []) as Record<string, unknown>[]).map(toProperty);
    const isActive = property.is_active !== false;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: `${property.property_type} for rent in ${property.area_name}`,
        description: property.description || property.address,
        url: `${BASE_URL}/properties/${property.property_id}`,
        ...(images[0] ? { image: images[0] } : {}),
        address: {
            '@type': 'PostalAddress',
            streetAddress: property.address,
            addressLocality: property.area_name,
            addressRegion: 'Karnataka',
            addressCountry: 'IN',
        },
        offers: {
            '@type': 'Offer',
            price: property.rent,
            priceCurrency: 'INR',
            availability: isActive ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
        },
        ...(property.size ? { floorSize: { '@type': 'QuantitativeValue', value: property.size, unitCode: 'FTK' } } : {}),
    };

    const facts: [string, string][] = [
        ['Size', property.size ? `${property.size} sq ft` : 'Not specified'],
        ['Bathrooms', property.bathrooms ? String(property.bathrooms) : 'Not specified'],
        ['Deposit', property.deposit ? `${formatINR(property.deposit)}${property.rent ? ` (${(property.deposit / property.rent).toFixed(1)} mo)` : ''}` : 'Not specified'],
        ['Parking', property.parking === true ? 'Yes' : property.parking === false ? 'No' : 'Not specified'],
        ['Furnishing', property.furnishing_status || 'Not specified'],
    ];

    const photoAlt = `${property.property_type || 'Flat'} in ${property.area_name}`;

    return (
        <div className="pt-28 pb-24 sm:pt-32">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

            <Container>
                <nav aria-label="Breadcrumb" className="mb-6">
                    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-footnote text-label-2">
                        <li><Link href="/properties" className="hover:text-label hover:underline underline-offset-2">Flats</Link></li>
                        <li aria-hidden className="text-label-3">›</li>
                        <li><Link href={`/properties?area_id=${areaId}`} className="hover:text-label hover:underline underline-offset-2">{property.area_name}</Link></li>
                    </ol>
                </nav>

                {!isActive && (
                    <p role="status" className="mb-6 rounded-[var(--radius-control)] bg-warn/12 px-4 py-3 text-callout text-warn">
                        This listing hasn&apos;t been seen on its source for over two weeks, so it&apos;s probably rented out.
                    </p>
                )}

                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="chip">{property.property_type || 'Flat'}</span>
                            <span className="chip">{property.source === 'scraped' ? 'From a listing portal' : 'Listed by owner'}</span>
                        </div>
                        <h1 className="mt-3 text-title-1 text-balance break-words">{property.address}</h1>
                        <p className="mt-2 text-callout text-label-2">{property.area_name}, Bangalore</p>
                    </div>
                    <ShareListing
                        propertyId={property.property_id}
                        address={property.address}
                        areaName={property.area_name}
                        propertyType={property.property_type}
                        rent={property.rent}
                        verdictText={verdictText}
                    />
                </header>

                <div className="mt-8">
                    {images.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            <div className="aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-panel)] bg-fill sm:aspect-[16/9]">
                                <img src={images[0]} alt={photoAlt} fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
                            </div>
                            {images.length > 1 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {images.slice(1, 4).map((img, idx) => (
                                        <div key={idx} className="aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-fill">
                                            <img src={img} alt={`${photoAlt}, photo ${idx + 2}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : property.image_data ? (
                        <div className="aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-panel)] bg-fill sm:aspect-[16/9]">
                            <img src={`data:image/jpeg;base64,${property.image_data}`} alt={photoAlt} className="h-full w-full object-cover" />
                        </div>
                    ) : (
                        <div className="flex aspect-[16/9] w-full items-center justify-center rounded-[var(--radius-panel)] bg-surface-2 text-footnote text-label-3 sm:aspect-[3/1]">
                            No photos for this listing
                        </div>
                    )}
                </div>

                <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
                    <div className="flex min-w-0 flex-col gap-10">
                        <section aria-labelledby="facts-heading">
                            <h2 id="facts-heading" className="text-title-3 mb-4">Details</h2>
                            <dl className="card grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-3 sm:p-6">
                                {facts.map(([k, v]) => (
                                    <div key={k} className="min-w-0">
                                        <dt className="text-footnote text-label-2">{k}</dt>
                                        <dd className={`mt-0.5 text-headline num ${v === 'Not specified' ? 'font-normal text-label-3' : ''}`}>{v}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>

                        {property.description && (
                            <section aria-labelledby="about-heading">
                                <h2 id="about-heading" className="text-title-3 mb-3">About this flat</h2>
                                <p className="max-w-2xl whitespace-pre-line text-label-2">{property.description}</p>
                            </section>
                        )}

                        {Boolean(property.preferences) && (
                            <section aria-labelledby="prefs-heading">
                                <h2 id="prefs-heading" className="text-title-3 mb-3">Who the owner prefers</h2>
                                <p className="chip text-footnote">{String(property.preferences)}</p>
                            </section>
                        )}

                        {property.amenities && property.amenities.length > 0 && (
                            <section aria-labelledby="amenities-heading">
                                <h2 id="amenities-heading" className="text-title-3 mb-3">Amenities</h2>
                                <ul className="flex flex-wrap gap-2">
                                    {property.amenities.map((a: string) => (
                                        <li key={a} className="chip px-3 py-1 text-footnote font-normal">{a}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <InteractiveMediaLinks google_maps_link={(property.google_maps_link as string) || null} />
                        <ReportListing propertyId={property.property_id} />
                    </div>

                    <aside className="flex w-full flex-col gap-5" aria-label="Rent and contact">
                        <ApplicationCard
                            property_id={property.property_id}
                            landlord_id={(property.landlord_id as string) || null}
                            rent={property.rent}
                            landlord_phone={(property.landlord_phone as string) || null}
                            verdict={verdict}
                            p25={stat?.p25}
                            p75={stat?.p75}
                            source={property.source}
                            source_url={property.source_url}
                        />
                        {property.source !== 'scraped' && <TourScheduler propertyId={property.property_id} landlordId={(property.landlord_id as string) || null} address={property.address} />}
                        <CommuteAnalyzer propertyArea={property.area_name} latitude={property.latitude} longitude={property.longitude} />
                        <AffordabilityCalculator monthlyRent={property.rent} />
                    </aside>
                </div>

                <div className="mt-16 flex flex-col gap-5">
                    <NeighborhoodProfile areaId={areaId} areaName={property.area_name} stats={areaStats} paid={(paidData || []) as { property_type: string; median: number; count: number }[]} />
                    <PropertyReviews propertyId={property.property_id} initialReviews={(reviewData || []) as Review[]} />
                </div>

                {similar.length > 0 && (
                    <section className="mt-16 sm:mt-20" aria-labelledby="similar-heading">
                        <h2 id="similar-heading" className="text-title-2 text-balance mb-6">
                            More {property.property_type} flats in {property.area_name}, lowest rent first
                        </h2>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {similar.map(p => <PropertyCard key={p.property_id} property={p} marketStat={stat} />)}
                        </div>
                    </section>
                )}
            </Container>
        </div>
    );
}
