'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import PropertyCard, { Property } from '@/components/PropertyCard';
import LandlordApplications from '@/components/dashboard/LandlordApplications';
import TenantApplications from '@/components/dashboard/TenantApplications';
import toast from 'react-hot-toast';

export default function Dashboard() {
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
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
            const formattedData: Property[] = data.map((item: any) => ({
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
            if (file.size > 500 * 1024) {
                toast.error('Image size must be less than 500KB');
                e.target.value = '';
                return;
            }
            if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
                toast.error('Only JPG/PNG images are allowed');
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
        const loadingToast = toast.loading('Publishing Listing...');

        try {
            let base64Image = null;
            if (imageFile) {
                const buffer = await imageFile.arrayBuffer();
                base64Image = Buffer.from(buffer).toString('base64');
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
                    image_data: base64Image
                });

            if (error) throw error;

            toast.success('Property added successfully.', { id: loadingToast });

            setFormData({
                area_id: '',
                address: '',
                property_type: '1BHK',
                size: '',
                rent: '',
                preferences: '',
                landlord_phone: '',
                google_maps_link: ''
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
        if (!confirm('Confirm deletion of this property listing.')) return;

        try {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('property_id', property_id);

            if (error) throw error;

            toast.success('Property deleted.');
            if (userId) fetchMyProperties(userId);
        } catch (err: unknown) {
            toast.error(((err as Error).message || 'Something went wrong'));
        }
    };

    if (!userId || !userRole) return null;

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white pt-28 pb-20 px-4 md:px-6 transition-colors duration-300 selection:bg-[#00A699] selection:text-white">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Conditionally Render Landlord Form Layer */}
                {userRole === 'landlord' && (
                    <div className="space-y-6">
                        {/* Analytics Engine Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#111] border border-white/10 p-6 flex flex-col justify-center items-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-[#00A699]/10 blur-[30px] rounded-full group-hover:scale-150 transition-transform"></div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Active Properties</span>
                                <span className="text-4xl font-black text-white">{myProperties.length}</span>
                            </div>
                            <div className="bg-[#111] border border-white/10 p-6 flex flex-col justify-center items-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF385C]/10 blur-[30px] rounded-full group-hover:scale-150 transition-transform"></div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Total Bookmark Saves</span>
                                <span className="text-4xl font-black text-[#FF385C]">{totalFavorites}</span>
                            </div>
                            <div className="bg-[#111] border border-white/10 p-6 flex flex-col justify-center items-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 blur-[30px] rounded-full group-hover:scale-150 transition-transform"></div>
                                <span className="text-[10px] text-[00A699] font-bold uppercase tracking-widest mb-2 text-[#00A699]">Active App Leads</span>
                                <span className="text-4xl font-black text-[#00A699]">{totalLeads}</span>
                            </div>
                        </div>

                        <div className="w-full max-w-3xl mx-auto bg-[#111] border border-white/10 rounded-none p-6 md:p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF385C]/10 blur-[50px] pointer-events-none rounded-full" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00A699]/10 blur-[50px] pointer-events-none rounded-full" />

                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                <span className="w-2 h-2 bg-[#FF385C] rounded-full animate-pulse"></span>
                                <span className="uppercase tracking-widest text-[#FF385C]">Terminal Upload</span>
                            </h2>
                            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Initialize New Property Record</p>

                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col relative">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Sector / Zone</label>
                                        <select
                                            name="area_id"
                                            value={formData.area_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors font-mono text-sm cursor-pointer appearance-none"
                                            required
                                        >
                                            <option value="" className="bg-[#111]">Select Sector</option>
                                            {areas.map(area => (
                                                <option key={area.area_id} value={area.area_id} className="bg-[#111]">{area.area_name}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 top-6">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>

                                    <div className="flex flex-col relative">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Layout Typology</label>
                                        <select
                                            name="property_type"
                                            value={formData.property_type}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors font-mono text-sm cursor-pointer appearance-none"
                                            required
                                        >
                                            <option value="1BHK" className="bg-[#111]">1 Bedroom (1BHK)</option>
                                            <option value="2BHK" className="bg-[#111]">2 Bedroom (2BHK)</option>
                                            <option value="3BHK" className="bg-[#111]">3 Bedroom (3BHK)</option>
                                            <option value="1RK" className="bg-[#111]">Studio (1RK)</option>
                                            <option value="PG" className="bg-[#111]">Shared Space (PG)</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 top-6">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Physical Address Coordinates</label>
                                    <input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Full designation..."
                                        className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Area (SQ FT)</label>
                                        <input
                                            name="size"
                                            type="number"
                                            value={formData.size}
                                            onChange={handleChange}
                                            placeholder="000"
                                            className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Valuation (₹)</label>
                                        <input
                                            name="rent"
                                            type="number"
                                            value={formData.rent}
                                            onChange={handleChange}
                                            placeholder="00000"
                                            className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#FF385C] transition-colors placeholder-gray-700 font-mono text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Occupant Protocols</label>
                                    <input
                                        name="preferences"
                                        value={formData.preferences}
                                        onChange={handleChange}
                                        placeholder="E.g., No syntax errors, pure logic expected."
                                        className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Comm Link (Phone)</label>
                                        <input
                                            name="landlord_phone"
                                            value={formData.landlord_phone}
                                            onChange={handleChange}
                                            placeholder="+91 XXXXX XXXXX"
                                            className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Map Vector</label>
                                        <input
                                            name="google_maps_link"
                                            value={formData.google_maps_link}
                                            onChange={handleChange}
                                            placeholder="https://maps..."
                                            className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Visual Feed (MAX 500KB JPEG/PNG)</label>
                                    <div className="flex items-center gap-4">
                                        <label className="cursor-pointer inline-flex items-center px-4 py-3 bg-white/5 border border-white/20 hover:bg-white/10 text-white transition-colors font-mono uppercase tracking-widest text-[10px] font-bold">
                                            Capture Matrix
                                            <input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} className="hidden" />
                                        </label>
                                        <span className="text-xs text-gray-500 font-mono">{imageFile ? imageFile.name : "[AWAITING DATA PING]"}</span>
                                    </div>

                                    {imagePreview && (
                                        <div className="mt-4 relative w-full max-w-sm h-48 overflow-hidden border border-white/20 rounded-none shadow-sm">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover grayscale opacity-90 contrast-125 hover:grayscale-0 transition-all duration-700" />
                                            <button
                                                type="button"
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                className="absolute top-2 right-2 p-1.5 bg-black/80 text-white hover:text-[#FF385C] border border-white/20 transition-colors"
                                                aria-label="Remove image"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8">
                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-[#FF385C] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <span className="animate-pulse">Uploading to Matrix...</span> : "Execute Transmission"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* User Properties Section */}
                <div className="w-full mx-auto">
                    {userRole === 'landlord' && userId && (
                        <div className="mb-12">
                            <LandlordApplications landlord_id={userId} />
                        </div>
                    )}

                    {userRole === 'tenant' && userId && (
                        <div className="mb-12">
                            <TenantApplications tenant_id={userId} />
                        </div>
                    )}

                    <h3 className="text-sm font-bold text-[#00A699] uppercase tracking-widest mb-6 flex items-center gap-3">
                        <span className="w-2 h-2 bg-[#00A699] rounded-full animate-pulse"></span>
                        {userRole === 'landlord' ? 'Active Records' : 'Saved Coordinates'}
                    </h3>

                    <div className="border border-white/10 bg-[#111] p-6 rounded-none relative overflow-hidden">
                        {isFetchingProperties ? (
                            <div className="flex justify-center p-12">
                                <div className="animate-spin rounded-none h-8 w-8 border-t-2 border-b-2 border-white"></div>
                            </div>
                        ) : (userRole === 'landlord' && myProperties.length === 0) || (userRole === 'tenant' && savedProperties.length === 0) ? (
                            <div className="text-center py-16">
                                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                                    {userRole === 'landlord'
                                        ? "No active property nodes discovered within your sector."
                                        : "You have not saved any properties yet."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {(userRole === 'landlord' ? myProperties : savedProperties).map(property => (
                                    <div key={property.property_id} className="relative group">
                                        <PropertyCard property={property} />

                                        {userRole === 'landlord' && (
                                            <button
                                                onClick={() => handleDelete(property.property_id)}
                                                className="absolute top-4 left-4 z-20 bg-black/80 border border-white/20 hover:border-[#FF385C] hover:text-[#FF385C] text-white p-2 rounded-none shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                                                title="Purge Record"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div >
        </div >
    );
}
