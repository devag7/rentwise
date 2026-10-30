'use client'

import { useState, useEffect } from 'react';
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

    // KYC files live in a private bucket; older rows stored a (broken) public URL.
    const openKyc = async (ref: string) => {
        const path = ref.includes('/kyc_documents/') ? ref.split('/kyc_documents/')[1] : ref;
        const { data, error } = await supabase.storage.from('kyc_documents').createSignedUrl(path, 300);
        if (error || !data) {
            toast.error('Could not open the document.');
            return;
        }
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    };

    useEffect(() => {
        if (!landlord_id) return;
        let cancelled = false;
        // Supabase RLS policies already restrict Landlords to viewing only applications for their properties
        supabase
            .from('applications')
            .select(`
                *,
                properties ( address, rent )
            `)
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (cancelled) return;
                if (!error && data) {
                    setApplications(data as unknown as Application[]);
                }
                setIsLoading(false);
            });
        return () => { cancelled = true; };
    }, [landlord_id, supabase]);

    const handleUpdateStatus = async (appId: number, status: 'approved' | 'rejected') => {
        const loadingToast = toast.loading('Updating application…');
        const { error } = await supabase
            .from('applications')
            .update({ status })
            .eq('application_id', appId);

        if (error) {
            toast.error(error.message, { id: loadingToast });
        } else {
            toast.success(status === 'approved' ? 'Application approved.' : 'Application declined.', { id: loadingToast });
            setApplications(apps => apps.map(a => a.application_id === appId ? { ...a, status } : a));
        }
    };

    if (isLoading) {
        return <div className="card h-32 animate-pulse" aria-busy="true" aria-label="Loading applications" />;
    }

    if (applications.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="applications-heading">
            <h2 id="applications-heading" className="text-title-3">
                Applications <span className="ml-1 font-normal text-label-2 num">{applications.length}</span>
            </h2>

            <ul className="card mt-5 divide-y divide-separator overflow-hidden">
                {applications.map((app) => (
                    <li key={app.application_id} className="flex flex-col gap-4 px-5 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusChip status={app.status} />
                                <span className="text-footnote text-label-2 num">
                                    Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>

                            <h3 className="mt-2 text-headline">{app.properties?.address}</h3>

                            {app.intent_description && (
                                <p className="mt-1 max-w-2xl text-callout text-label-2">&ldquo;{app.intent_description}&rdquo;</p>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-footnote text-label-2">
                                <span className="num">Moves in {new Date(app.move_in_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                {app.kyc_document_url && (
                                    <button type="button" onClick={() => openKyc(app.kyc_document_url!)} className="link">
                                        View ID document
                                    </button>
                                )}
                            </div>
                        </div>

                        {app.status === 'pending' && (
                            <div className="flex shrink-0 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(app.application_id, 'approved')}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(app.application_id, 'rejected')}
                                    className="btn btn-secondary btn-sm text-bad"
                                >
                                    Decline
                                </button>
                            </div>
                        )}

                        {app.status === 'approved' && app.properties && (
                            <button
                                type="button"
                                onClick={() => generateLeaseDocument({
                                    propertyAddress: app.properties!.address,
                                    rent: app.properties!.rent,
                                    tenantId: app.tenant_id,
                                    landlordId: landlord_id,
                                    moveInDate: app.move_in_date
                                })}
                                className="btn btn-secondary btn-sm shrink-0 self-start md:self-auto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Download lease (PDF)
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}

function StatusChip({ status }: { status: string }) {
    if (status === 'approved') return <span className="chip bg-good/12 text-good">Approved</span>;
    if (status === 'rejected') return <span className="chip bg-bad/12 text-bad">Declined</span>;
    if (status === 'pending') return <span className="chip bg-warn/12 text-warn">Pending</span>;
    return <span className="chip">{status}</span>;
}
