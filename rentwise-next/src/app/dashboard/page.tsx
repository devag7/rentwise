'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function Dashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [userId, setUserId] = useState<string | null>(null);
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

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else if (session.user.user_metadata?.role !== 'landlord') {
                router.push('/properties');
            } else {
                setUserId(session.user.id);
            }
        };
        fetchUser();
    }, [router, supabase.auth]);

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
                alert('Image size must be less than 500KB');
                e.target.value = '';
                return;
            }
            if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
                alert('Only JPG/PNG images are allowed');
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

        try {
            let base64Image = null;
            if (imageFile) {
                const buffer = await imageFile.arrayBuffer();
                base64Image = Buffer.from(buffer).toString('base64');
            }

            // Insert into Supabase directly from client (for demonstration simplicity)
            // Standard approach would use a Route Handler
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

            alert('Property added successfully!');

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
        } catch (err: any) {
            alert('Failed to add property: ' + (err.message || 'Something went wrong'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!userId) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-28 px-6 transition-colors duration-300 flex justify-center items-start">
            <div className="w-full max-w-2xl bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 md:p-12">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Landlord Dashboard</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">List a new property for rent</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Area</label>
                            <select
                                name="area_id"
                                value={formData.area_id}
                                onChange={handleChange}
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                required
                            >
                                <option value="">Select Area</option>
                                {areas.map(area => (
                                    <option key={area.area_id} value={area.area_id}>{area.area_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Property Type</label>
                            <select
                                name="property_type"
                                value={formData.property_type}
                                onChange={handleChange}
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                required
                            >
                                <option value="1BHK">1BHK</option>
                                <option value="2BHK">2BHK</option>
                                <option value="3BHK">3BHK</option>
                                <option value="1RK">1RK</option>
                                <option value="PG">PG</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                        <input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Full property address"
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Size (sq ft)</label>
                            <input
                                name="size"
                                type="number"
                                value={formData.size}
                                onChange={handleChange}
                                placeholder="e.g. 800"
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                required
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monthly Rent (₹)</label>
                            <input
                                name="rent"
                                type="number"
                                value={formData.rent}
                                onChange={handleChange}
                                placeholder="e.g. 15000"
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tenant Preferences</label>
                        <input
                            name="preferences"
                            value={formData.preferences}
                            onChange={handleChange}
                            placeholder="e.g. Family preferred, no pets"
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Number</label>
                            <input
                                name="landlord_phone"
                                value={formData.landlord_phone}
                                onChange={handleChange}
                                placeholder="+91..."
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Google Maps Link</label>
                            <input
                                name="google_maps_link"
                                value={formData.google_maps_link}
                                onChange={handleChange}
                                placeholder="https://maps.google.com/..."
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Property Photo (Max 500KB)</label>
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-blue-400 border border-blue-200 dark:border-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors font-medium text-sm">
                                Choose Image
                                <input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} className="hidden" />
                            </label>
                            <span className="text-xs text-gray-500">{imageFile ? imageFile.name : "No file chosen"}</span>
                        </div>

                        {imagePreview && (
                            <div className="mt-4 relative w-full max-w-sm h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    aria-label="Remove image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center"
                            disabled={isLoading}
                        >
                            {isLoading ? "Publishing Listing..." : "Publish Listing"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
