'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import PropertyCard, { Property } from '@/components/PropertyCard';
import LandlordApplications from '@/components/dashboard/LandlordApplications';
import TenantApplications from '@/components/dashboard/TenantApplications';
import Container from '@/components/ui/Container';
import toast from 'react-hot-toast';
import { track } from '@/utils/analytics';

export default function DashboardContent() {
    const router = useRouter();
    const supabase = createClient();
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [myProperties, setMyProperties] = useState<Property[]>([]);
    const [savedProperties, setSavedProperties] = useState<Property[]>([]);
    const [isFetchingProperties, setIsFetchingProperties] = useState(false);

    // Analytics State
    const [totalFavorites, setTotalFavorites] = useState(0);
    const [totalLeads, setTotalLeads] = useState(0);

    const [formData, setFormData] = useState({
        area_id: '',
        address: '',
        property_type: '1BHK',
        size: '',
        rent: '',
        preferences: '',
        landlord_phone: '',
        google_maps_link: '',
        deposit: '',
        bathrooms: '',
        furnishing_status: '',
        parking: '',
        description: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [tab, setTab] = useState<'overview' | 'new'>('overview');

    const fetchMyProperties = useCallback(async (id: string) => {
        setIsFetchingProperties(true);
        const { data, error } = await supabase
            .from('properties')
            .select(`
                *,
                areas ( name )
            `)
            .eq('landlord_id', id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            const formattedData: Property[] = data.map(item => ({
                ...item,
                area_name: item.areas?.name || 'Unknown Area'
            }));
            setMyProperties(formattedData);

            // Analytics Fetching logic
            if (formattedData.length > 0) {
                const propertyIds = formattedData.map(p => p.property_id);

                const { count: favCount } = await supabase.from('favorites')
                    .select('*', { count: 'exact', head: true })
                    .in('property_id', propertyIds);
                setTotalFavorites(favCount || 0);

                const { count: appsCount } = await supabase.from('applications')
                    .select('*', { count: 'exact', head: true })
                    .in('property_id', propertyIds);
                setTotalLeads(appsCount || 0);
            }
        }
        setIsFetchingProperties(false);
    }, [supabase]);

    const fetchSavedProperties = useCallback(async (id: string) => {
        setIsFetchingProperties(true);

        // Join Favorites -> Properties -> Areas
        const { data, error } = await supabase
            .from('favorites')
            .select(`
                property_id,
                properties (
                    *,
                    areas ( name )
                )
            `)
            .eq('user_id', id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            type FavoriteRow = { properties: Property & { areas: { name: string } | null } };
            const formattedData: Property[] = (data as unknown as FavoriteRow[]).map((item) => ({
                ...item.properties,
                area_name: item.properties.areas?.name || 'Unknown Area'
            }));
            setSavedProperties(formattedData);
        } else {
            console.error(error);
        }
        setIsFetchingProperties(false);
    }, [supabase]);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                setUserId(session.user.id);
                const role = session.user.user_metadata?.role || 'tenant';
                setUserRole(role);

                if (role === 'landlord') {
                    fetchMyProperties(session.user.id);
                } else if (role === 'tenant') {
                    fetchSavedProperties(session.user.id);
                }
            }
        };
        fetchUser();
    }, [router, supabase.auth, fetchMyProperties, fetchSavedProperties]);

    const areas = [
        { area_id: "1", area_name: "Indiranagar" },
        { area_id: "2", area_name: "Koramangala" },
        { area_id: "3", area_name: "Whitefield" },
        { area_id: "4", area_name: "HSR Layout" },
        { area_id: "5", area_name: "Marathahalli" },
        { area_id: "6", area_name: "Bellandur" },
        { area_id: "7", area_name: "Jayanagar" },
        { area_id: "8", area_name: "BTM Layout" },
        { area_id: "9", area_name: "Electronic City" },
        { area_id: "10", area_name: "Banashankari" }
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('That photo is over 5 MB. Choose a smaller one.');
                e.target.value = '';
                return;
            }
            if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
                toast.error('Use a JPG or PNG photo.');
                e.target.value = '';
                return;
            }

            setImageFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        setIsLoading(true);
        const loadingToast = toast.loading('Publishing listing…');

        try {
            // Photos go to Supabase Storage (public CDN URL), not base64 in the row.
            let imageUrl: string | null = null;
            if (imageFile) {
                const ext = imageFile.type === 'image/png' ? 'png' : 'jpg';
                const path = `${userId}/${Date.now()}.${ext}`;
                const { error: upErr } = await supabase.storage
                    .from('listing-images')
                    .upload(path, imageFile, { contentType: imageFile.type, cacheControl: '31536000' });
                if (upErr) throw upErr;
                imageUrl = supabase.storage.from('listing-images').getPublicUrl(path).data.publicUrl;
            }

            const { error } = await supabase
                .from('properties')
                .insert({
                    landlord_id: userId,
                    area_id: parseInt(formData.area_id),
                    address: formData.address,
                    property_type: formData.property_type,
                    size: parseInt(formData.size),
                    rent: parseInt(formData.rent),
                    preferences: formData.preferences,
                    landlord_phone: formData.landlord_phone,
                    google_maps_link: formData.google_maps_link,
                    deposit: formData.deposit ? parseInt(formData.deposit) : null,
                    bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
                    furnishing_status: formData.furnishing_status || null,
                    parking: formData.parking === '' ? null : formData.parking === 'yes',
                    description: formData.description || null,
                    image_url: imageUrl,
                });

            if (error) throw error;

            track('listing_created', { area_id: parseInt(formData.area_id), property_type: formData.property_type });
            toast.success('Listing published.', { id: loadingToast });

            setFormData({
                area_id: '',
                address: '',
                property_type: '1BHK',
                size: '',
                rent: '',
                preferences: '',
                landlord_phone: '',
                google_maps_link: '',
                deposit: '',
                bathrooms: '',
                furnishing_status: '',
                parking: '',
                description: '',
            });
            setImageFile(null);
            setImagePreview(null);

            // Refresh properties
            fetchMyProperties(userId);

        } catch (err: unknown) {
            toast.error(((err as Error).message || 'Something went wrong'), { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (property_id: number) => {
        if (!confirm('Delete this listing? This can’t be undone.')) return;

        try {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('property_id', property_id);

            if (error) throw error;

            toast.success('Listing deleted.');
            if (userId) fetchMyProperties(userId);
        } catch (err: unknown) {
            toast.error(((err as Error).message || 'Something went wrong'));
        }
    };

    if (!userId || !userRole) return null;

    const isLandlord = userRole === 'landlord';
    const listed = isLandlord ? myProperties : savedProperties;

    return (
        <div className="min-h-dvh bg-surface-2 pb-24 pt-28 sm:pt-32">
            <Container>
                <header className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <h1 className="text-title-1">{isLandlord ? 'Your listings' : 'Your flats'}</h1>
                        <p className="mt-2 text-lead text-label-2">
                            {isLandlord
                                ? 'See who’s interested and review applications.'
                                : 'Applications you’ve sent and flats you’ve saved.'}
                        </p>
                    </div>

                    {isLandlord && (
                        <div role="tablist" aria-label="Dashboard view" className="inline-flex rounded-full bg-fill p-1">
                            {([['overview', 'Overview'], ['new', 'Add a listing']] as const).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    role="tab"
                                    id={`tab-${key}`}
                                    aria-selected={tab === key}
                                    aria-controls={`panel-${key}`}
                                    onClick={() => setTab(key)}
                                    className={`rounded-full px-3 py-1.5 text-footnote transition-colors ${tab === key ? 'bg-surface-3 font-semibold text-label shadow-card' : 'text-label-2 hover:text-label'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </header>

                {/* Landlord: new listing form (kept mounted so a half-filled form survives tab switches) */}
                {isLandlord && (
                    <section id="panel-new" role="tabpanel" aria-labelledby="tab-new" hidden={tab !== 'new'} className="mt-10">
                        <div className="card mx-auto max-w-3xl p-6 sm:p-10">
                            <h2 className="text-title-2">List your flat</h2>
                            <p className="mt-2 text-callout text-label-2">
                                Takes about three minutes. No brokerage. Once it&apos;s live, we compare your rent with similar flats nearby.
                            </p>

                            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                                <fieldset className="space-y-5">
                                    <legend className="mb-4 text-headline">The flat</legend>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="area_id" className="field-label">Area</label>
                                            <div className="relative">
                                                <select id="area_id" name="area_id" value={formData.area_id} onChange={handleChange} className="field cursor-pointer appearance-none pr-10" required>
                                                    <option value="">Choose an area</option>
                                                    {areas.map(area => (
                                                        <option key={area.area_id} value={area.area_id}>{area.area_name}</option>
                                                    ))}
                                                </select>
                                                <SelectChevron />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="property_type" className="field-label">Type</label>
                                            <div className="relative">
                                                <select id="property_type" name="property_type" value={formData.property_type} onChange={handleChange} className="field cursor-pointer appearance-none pr-10" required>
                                                    <option value="1BHK">1 bedroom (1BHK)</option>
                                                    <option value="2BHK">2 bedrooms (2BHK)</option>
                                                    <option value="3BHK">3 bedrooms (3BHK)</option>
                                                    <option value="1RK">Studio (1RK)</option>
                                                    <option value="PG">Shared room (PG)</option>
                                                </select>
                                                <SelectChevron />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="address" className="field-label">Address</label>
                                        <input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Building, street, landmark" className="field" autoComplete="street-address" required />
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-3">
                                        <div>
                                            <label htmlFor="size" className="field-label">Size (sq ft)</label>
                                            <input id="size" name="size" type="number" inputMode="numeric" value={formData.size} onChange={handleChange} className="field num" required />
                                        </div>
                                        <div>
                                            <label htmlFor="bathrooms" className="field-label">Bathrooms <span className="font-normal text-label-3">(optional)</span></label>
                                            <input id="bathrooms" name="bathrooms" type="number" inputMode="numeric" min="1" max="9" value={formData.bathrooms} onChange={handleChange} className="field num" />
                                        </div>
                                        <div>
                                            <label htmlFor="furnishing_status" className="field-label">Furnishing</label>
                                            <div className="relative">
                                                <select id="furnishing_status" name="furnishing_status" value={formData.furnishing_status} onChange={handleChange} className="field cursor-pointer appearance-none pr-10">
                                                    <option value="">Not specified</option>
                                                    <option value="Furnished">Furnished</option>
                                                    <option value="Semi-Furnished">Semi-furnished</option>
                                                    <option value="Unfurnished">Unfurnished</option>
                                                </select>
                                                <SelectChevron />
                                            </div>
                                        </div>
                                    </div>
                                </fieldset>

                                <fieldset className="space-y-5 border-t border-separator pt-8">
                                    <legend className="sr-only">Rent and terms</legend>
                                    <p aria-hidden className="text-headline">Rent and terms</p>
                                    <div className="grid gap-5 sm:grid-cols-3">
                                        <div>
                                            <label htmlFor="rent" className="field-label">Monthly rent (₹)</label>
                                            <input id="rent" name="rent" type="number" inputMode="numeric" value={formData.rent} onChange={handleChange} className="field num" required />
                                        </div>
                                        <div>
                                            <label htmlFor="deposit" className="field-label">Deposit (₹) <span className="font-normal text-label-3">(optional)</span></label>
                                            <input id="deposit" name="deposit" type="number" inputMode="numeric" value={formData.deposit} onChange={handleChange} className="field num" />
                                        </div>
                                        <div>
                                            <label htmlFor="parking" className="field-label">Parking</label>
                                            <div className="relative">
                                                <select id="parking" name="parking" value={formData.parking} onChange={handleChange} className="field cursor-pointer appearance-none pr-10">
                                                    <option value="">Not specified</option>
                                                    <option value="yes">Yes</option>
                                                    <option value="no">No</option>
                                                </select>
                                                <SelectChevron />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="preferences" className="field-label">Tenant preferences <span className="font-normal text-label-3">(optional)</span></label>
                                        <input id="preferences" name="preferences" value={formData.preferences} onChange={handleChange} placeholder="For example: family preferred, pets OK" className="field" />
                                    </div>
                                    <div>
                                        <label htmlFor="description" className="field-label">Description <span className="font-normal text-label-3">(optional)</span></label>
                                        <input id="description" name="description" value={formData.description} onChange={handleChange} placeholder="What makes this a good place to live?" className="field" />
                                    </div>
                                </fieldset>

                                <fieldset className="space-y-5 border-t border-separator pt-8">
                                    <legend className="sr-only">Contact and location</legend>
                                    <p aria-hidden className="text-headline">Contact and location</p>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="landlord_phone" className="field-label">Phone</label>
                                            <input id="landlord_phone" name="landlord_phone" type="tel" autoComplete="tel" value={formData.landlord_phone} onChange={handleChange} placeholder="+91 98765 43210" className="field num" aria-describedby="phone-hint" />
                                            <p id="phone-hint" className="mt-1.5 text-footnote text-label-2">Shared only with tenants who apply.</p>
                                        </div>
                                        <div>
                                            <label htmlFor="google_maps_link" className="field-label">Google Maps link <span className="font-normal text-label-3">(optional)</span></label>
                                            <input id="google_maps_link" name="google_maps_link" type="url" inputMode="url" value={formData.google_maps_link} onChange={handleChange} placeholder="https://maps.app.goo.gl/…" className="field" />
                                        </div>
                                    </div>
                                </fieldset>

                                <fieldset className="border-t border-separator pt-8">
                                    <legend className="sr-only">Photo</legend>
                                    <p aria-hidden className="text-headline">Photo <span className="text-callout font-normal text-label-2">(optional)</span></p>
                                    {imagePreview ? (
                                        <div className="relative mt-4 aspect-[4/3] w-full max-w-sm overflow-hidden rounded-[var(--radius-card)] bg-fill">
                                            <img src={imagePreview} alt="Selected listing photo" className="h-full w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                className="material absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-label transition-transform duration-150 ease-[var(--ease-out)] active:scale-95"
                                                aria-label="Remove photo"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            {imageFile && <p className="sr-only">{imageFile.name}</p>}
                                        </div>
                                    ) : (
                                        <label className="relative mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-separator px-6 py-10 text-center transition-colors hover:bg-fill focus-within:border-accent">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-label-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5M16.5 7.5L12 3m0 0L7.5 7.5M12 3v13.5" />
                                            </svg>
                                            <span className="text-callout"><span className="text-accent">Choose a photo</span> or drop it here</span>
                                            <span className="text-footnote text-label-2">JPG or PNG, up to 5 MB</span>
                                            <input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Listing photo" />
                                        </label>
                                    )}
                                </fieldset>

                                <div className="border-t border-separator pt-8">
                                    <button type="submit" className="btn btn-primary btn-lg w-full sm:w-auto" disabled={isLoading}>
                                        {isLoading ? 'Publishing…' : 'Publish listing'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                )}

                <div
                    id={isLandlord ? 'panel-overview' : undefined}
                    role={isLandlord ? 'tabpanel' : undefined}
                    aria-labelledby={isLandlord ? 'tab-overview' : undefined}
                    hidden={isLandlord && tab !== 'overview'}
                    className="mt-10 space-y-14"
                >
                    {isLandlord && (
                        <dl className="grid grid-cols-3 gap-3 sm:gap-5">
                            {[
                                { label: 'Listings', value: myProperties.length },
                                { label: 'Times saved', value: totalFavorites },
                                { label: 'Applications', value: totalLeads },
                            ].map(stat => (
                                <div key={stat.label} className="card p-4 sm:p-6">
                                    <dt className="text-footnote text-label-2">{stat.label}</dt>
                                    <dd className="mt-1 text-title-1 num">{stat.value}</dd>
                                </div>
                            ))}
                        </dl>
                    )}

                    {isLandlord && userId && <LandlordApplications landlord_id={userId} />}
                    {!isLandlord && userId && <TenantApplications tenant_id={userId} />}

                    <section aria-labelledby="listed-heading">
                        <h2 id="listed-heading" className="text-title-3">
                            {isLandlord ? 'Listings' : 'Saved flats'}
                            {!isFetchingProperties && listed.length > 0 && <span className="ml-2 font-normal text-label-2 num">{listed.length}</span>}
                        </h2>

                        {isFetchingProperties ? (
                            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
                                {[0, 1, 2].map(i => <div key={i} className="card aspect-[4/5] animate-pulse" />)}
                            </div>
                        ) : listed.length === 0 ? (
                            <div className="card mt-5 px-6 py-14 text-center">
                                <p className="text-title-3">{isLandlord ? 'No listings yet' : 'No saved flats yet'}</p>
                                <p className="mx-auto mt-2 max-w-md text-label-2">
                                    {isLandlord
                                        ? 'Add your flat and we’ll show how its rent compares to similar flats nearby.'
                                        : 'Tap the heart on any flat to keep it here.'}
                                </p>
                                {isLandlord ? (
                                    <button type="button" onClick={() => setTab('new')} className="btn btn-primary mt-6">Add a listing</button>
                                ) : (
                                    <Link href="/properties" className="btn btn-primary mt-6">Browse flats</Link>
                                )}
                            </div>
                        ) : (
                            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {listed.map(property => (
                                    <div key={property.property_id} className="flex flex-col gap-2">
                                        <PropertyCard property={property} />
                                        {isLandlord && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(property.property_id)}
                                                className="btn btn-secondary btn-sm self-start text-bad"
                                            >
                                                Delete listing
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </Container>
        </div>
    );
}

function SelectChevron() {
    return (
        <svg aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-label-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}
