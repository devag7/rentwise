'use client'

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { generateLeaseDocument } from '@/utils/generateLease';
import PaymentModal from '@/components/property/PaymentModal';

interface Application {
    application_id: number;
    property_id: number;
    status: string;
    intent_description: string;
    move_in_date: string;
    created_at: string;
    properties: {
        address: string;
        rent: number;
        landlord_id: string;
    } | null;
}

export default function TenantApplications({ tenant_id }: { tenant_id: string }) {
    const supabase = createClient();
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [paymentModalApp, setPaymentModalApp] = useState<Application | null>(null);

    const fetchApplications = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('applications')
            .select(`
                *,
                properties ( address, rent, landlord_id )
            `)
            .eq('tenant_id', tenant_id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setApplications(data as Application[]);
        }
        setIsLoading(false);
    }, [supabase, tenant_id]);

    useEffect(() => {
        if (tenant_id) fetchApplications();
    }, [tenant_id, fetchApplications]);

    if (isLoading) {
        return <div className="animate-pulse h-24 bg-[#111] border border-white/10 w-full mb-12"></div>;
    }

    if (applications.length === 0) {
        return null;
    }

    return (
        <div className="w-full mx-auto bg-[#111] border border-white/10 rounded-none p-6">
            <h3 className="text-sm font-bold text-[#FF385C] uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-[#FF385C] rounded-full animate-pulse"></span>
                My Submitted Applications
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {applications.map((app) => (
                    <div key={app.application_id} className="border border-white/10 bg-[#050505] p-5 flex flex-col justify-between">

                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white ${app.status === 'pending' ? 'bg-yellow-600' :
                                    app.status === 'approved' ? 'bg-[#00A699]' : 'bg-[#FF385C]'
                                    }`}>
                                    {app.status}
                                </span>
                                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                    {new Date(app.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <h4 className="text-white font-bold text-sm leading-tight mb-1 truncate">
                                {app.properties?.address}
                            </h4>

                            <p className="text-[#00A699] font-black text-lg mb-4 tracking-tighter">
                                ₹{app.properties?.rent?.toLocaleString('en-IN') || '---'}
                            </p>
                        </div>

                        <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-auto text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                            <span>Req. Move In:</span>
                            <span className="font-bold text-white">{new Date(app.move_in_date).toLocaleDateString()}</span>
                        </div>

                        {app.status === 'approved' && app.properties && (
                            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
                                <button
                                    onClick={() => generateLeaseDocument({
                                        propertyAddress: app.properties!.address,
                                        rent: app.properties!.rent,
                                        tenantId: tenant_id,
                                        landlordId: app.properties!.landlord_id,
                                        moveInDate: app.move_in_date
                                    })}
                                    className="w-full px-4 py-3 bg-[#00A699]/10 text-[#00A699] border border-[#00A699]/30 hover:bg-[#00A699] hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Generate Official Lease
                                </button>

                                <button
                                    onClick={() => setPaymentModalApp(app)}
                                    className="w-full px-4 py-3 bg-[#FF385C]/10 text-[#FF385C] border border-[#FF385C]/30 hover:bg-[#FF385C] hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                    Pay Security Deposit
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {paymentModalApp && paymentModalApp.properties && (
                <PaymentModal
                    amount={paymentModalApp.properties.rent * 2} // 2 months deposit
                    address={paymentModalApp.properties.address}
                    onClose={() => setPaymentModalApp(null)}
                    onSuccess={() => {
                        // In a real app we'd update deposit_paid status in DB
                        console.log("Mock Payment Recorded for", paymentModalApp.application_id);
                    }}
                />
            )}
        </div>
    );
}
