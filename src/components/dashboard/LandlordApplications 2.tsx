'use client'

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { generateLeaseDocument } from '@/utils/generateLease';

interface Application {
    application_id: number;
    property_id: number;
    tenant_id: string;
    status: string;
    intent_description: string;
    move_in_date: string;
    kyc_document_url: string | null;
    created_at: string;
    properties: {
        address: string;
        rent: number;
    } | null;
}

export default function LandlordApplications({ landlord_id }: { landlord_id: string }) {
    const supabase = createClient();
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchApplications = useCallback(async () => {
        setIsLoading(true);
        // Supabase RLS policies already restrict Landlords to viewing only applications for their properties
        const { data, error } = await supabase
            .from('applications')
            .select(`
                *,
                properties ( address, rent )
            `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setApplications(data as Application[]);
        }
        setIsLoading(false);
    }, [supabase]);

    useEffect(() => {
        if (landlord_id) fetchApplications();
    }, [landlord_id, fetchApplications]);

    const handleUpdateStatus = async (appId: number, status: 'approved' | 'rejected') => {
        const loadingToast = toast.loading('Executing status update...');
        const { error } = await supabase
            .from('applications')
            .update({ status })
            .eq('application_id', appId);

        if (error) {
            toast.error(error.message, { id: loadingToast });
        } else {
            toast.success(`Application ${status.toUpperCase()} successfully`, { id: loadingToast });
            setApplications(apps => apps.map(a => a.application_id === appId ? { ...a, status } : a));
        }
    };

    if (isLoading) {
        return <div className="animate-pulse h-32 bg-[#111] border border-white/10 w-full mt-6"></div>;
    }

    if (applications.length === 0) {
        return null;
    }

    return (
        <div className="w-full mx-auto bg-[#111] border border-white/10 rounded-none p-6 mt-6">
            <h3 className="text-sm font-bold text-[#00A699] uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-[#00A699] rounded-full animate-pulse"></span>
                Application Review Vault
            </h3>

            <div className="grid grid-cols-1 gap-4">
                {applications.map((app) => (
                    <div key={app.application_id} className="border border-white/10 bg-[#050505] p-5 flex flex-col md:flex-row justify-between gap-4">

                        {/* Context Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white ${app.status === 'pending' ? 'bg-yellow-600' :
                                    app.status === 'approved' ? 'bg-[#00A699]' : 'bg-[#FF385C]'
                                    }`}>
                                    {app.status}
                                </span>
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                                    {new Date(app.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <h4 className="text-white font-bold text-lg leading-tight mb-2">
                                {app.properties?.address}
                            </h4>

                            <p className="text-gray-400 text-sm font-medium italic mb-3">"{app.intent_description}"</p>

                            <div className="flex gap-6 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">
                                <span>Move In: {new Date(app.move_in_date).toLocaleDateString()}</span>
                                {app.kyc_document_url && (
                                    <a href={app.kyc_document_url} target="_blank" rel="noopener noreferrer" className="text-[#00A699] hover:underline flexItems-center">
                                        View Encrypted KYC
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        {app.status === 'pending' && (
                            <div className="flex flex-col gap-2 shrink-0 md:w-32 justify-center">
                                <button
                                    onClick={() => handleUpdateStatus(app.application_id, 'approved')}
                                    className="px-4 py-2 bg-white/5 border border-[#00A699]/30 text-[#00A699] hover:bg-[#00A699] hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(app.application_id, 'rejected')}
                                    className="px-4 py-2 bg-white/5 border border-[#FF385C]/30 text-[#FF385C] hover:bg-[#FF385C] hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest"
                                >
                                    Reject
                                </button>
                            </div>
                        )}

                        {app.status === 'approved' && app.properties && (
                            <div className="flex flex-col shrink-0 md:w-40 justify-center">
                                <button
                                    onClick={() => generateLeaseDocument({
                                        propertyAddress: app.properties!.address,
                                        rent: app.properties!.rent,
                                        tenantId: app.tenant_id,
                                        landlordId: landlord_id,
                                        moveInDate: app.move_in_date
                                    })}
                                    className="w-full px-4 py-3 bg-[#00A699]/10 text-[#00A699] border border-[#00A699]/30 hover:bg-[#00A699] hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Issue Lease PDF
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
