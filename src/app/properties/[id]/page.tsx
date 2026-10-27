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

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center pb-20 pt-28 px-4 sm:px-6 selection:bg-[#FF385C] selection:text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="max-w-5xl w-full">
                <nav className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6" aria-label="Breadcrumb">
                    <Link href="/properties" className="hover:text-white">Flats</Link>
                    {' / '}
                    <Link href={`/properties?area_id=${areaId}`} className="hover:text-white">{property.area_name}</Link>
                </nav>
                {!isActive && (
                    <div className="mb-6 p-4 border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm">
                        This listing hasn&apos;t been seen on its source for over two weeks and is probably rented out.
                    </div>
                )}
            </div>

            <div className="max-w-5xl w-full bg-[#111] border border-white/10 p-5 md:p-12 flex flex-col md:flex-row gap-10 md:items-start">
                <div className="flex-1 min-w-0 w-full flex flex-col gap-10">
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="px-3 py-1.5 bg-black text-white border border-white/20 text-[10px] font-bold tracking-widest uppercase">{property.property_type || 'Flat'}</span>
                            {property.source === 'scraped' ? (
                                <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold tracking-widest uppercase">External listing</span>
                            ) : (
                                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold tracking-widest uppercase">Owner-listed</span>
                            )}
                            <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">{property.area_name}</span>
                            <span className="ml-auto">
                                <ShareListing
                                    propertyId={property.property_id}
                                    address={property.address}
                                    areaName={property.area_name}
                                    propertyType={property.property_type}
                                    rent={property.rent}
                                    verdictText={verdictText}
                                />
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white leading-[1.1] tracking-tighter break-words">{property.address}</h1>
                    </div>

                    {images.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            <div className="w-full aspect-[4/3] overflow-hidden bg-[#050505] border border-white/10">
                                <img src={images[0]} alt={`${property.property_type} in ${property.area_name}`} fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
                            </div>
                            {images.length > 1 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {images.slice(1, 4).map((img, idx) => (
                                        <div key={idx} className="aspect-[4/3] overflow-hidden bg-[#050505] border border-white/10">
                                            <img src={img} alt={`Photo ${idx + 2}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : property.image_data ? (
                        <div className="w-full aspect-[4/3] overflow-hidden bg-[#050505] border border-white/10">
                            <img src={`data:image/jpeg;base64,${property.image_data}`} alt={property.address} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-full aspect-[4/3] bg-[#050505] border border-white/10 flex items-center justify-center text-gray-600 font-mono text-xs tracking-widest">NO PHOTOS</div>
                    )}

                    <dl className="grid grid-cols-2 md:grid-cols-3 gap-6 py-8 border-y border-white/10">
                        {facts.map(([k, v]) => (
                            <div key={k}>
                                <dt className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2">{k}</dt>
                                <dd className="text-base font-bold text-white">{v}</dd>
                            </div>
                        ))}
                    </dl>

                    {property.description && (
                        <div>
                            <h2 className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-4">About this flat</h2>
                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{property.description}</p>
                        </div>
                    )}

                    {(Boolean(property.preferences) || (property.amenities && property.amenities.length > 0)) && (
                        <div className="flex flex-col gap-6">
                            {Boolean(property.preferences) && (
                                <div>
                                    <h2 className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-3">Tenant preferences</h2>
                                    <p className="inline-block px-4 py-2 bg-white/5 border border-white/10 text-xs font-bold text-white">{String(property.preferences)}</p>
                                </div>
                            )}
                            {property.amenities && property.amenities.length > 0 && (
                                <div>
                                    <h2 className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-3">Amenities</h2>
                                    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {property.amenities.map((a: string) => (
                                            <li key={a} className="p-3 border border-white/5 bg-[#050505] text-xs font-bold text-gray-300 uppercase tracking-wider">{a}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <InteractiveMediaLinks google_maps_link={(property.google_maps_link as string) || null} />
                    <ReportListing propertyId={property.property_id} />
                </div>

                <div className="w-full md:w-[380px] flex flex-col gap-6 flex-shrink-0">
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
                    {property.source !== 'scraped' && <TourScheduler propertyId={property.property_id} />}
                    <CommuteAnalyzer propertyArea={property.area_name} latitude={property.latitude} longitude={property.longitude} />
                    <AffordabilityCalculator monthlyRent={property.rent} />
                </div>
            </div>

            <div className="max-w-5xl w-full mt-6 flex flex-col gap-6">
                <NeighborhoodProfile areaId={areaId} areaName={property.area_name} stats={areaStats} paid={(paidData || []) as { property_type: string; median: number; count: number }[]} />
                <PropertyReviews propertyId={property.property_id} initialReviews={(reviewData || []) as Review[]} />
            </div>

            {similar.length > 0 && (
                <div className="max-w-5xl w-full mt-20">
                    <h2 className="text-sm font-bold text-[#FF385C] uppercase tracking-widest mb-8">
                        Cheapest similar {property.property_type} in {property.area_name}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {similar.map(p => <PropertyCard key={p.property_id} property={p} marketStat={stat} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
