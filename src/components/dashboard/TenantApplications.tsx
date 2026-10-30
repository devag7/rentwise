'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { generateLeaseDocument } from '@/utils/generateLease';
import { formatINR } from '@/utils/market';

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

    useEffect(() => {
        if (!tenant_id) return;
        let cancelled = false;
        supabase
            .from('applications')
            .select(`
                *,
                properties ( address, rent, landlord_id )
            `)
            .eq('tenant_id', tenant_id)
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (cancelled) return;
                if (!error && data) {
                    setApplications(data as unknown as Application[]);
                }
                setIsLoading(false);
            });
        return () => { cancelled = true; };
    }, [supabase, tenant_id]);

    if (isLoading) {
        return <div className="card h-24 animate-pulse" aria-busy="true" aria-label="Loading applications" />;
    }

    if (applications.length === 0) {
        return null;
    }

    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <section aria-labelledby="applications-heading">
            <h2 id="applications-heading" className="text-title-3">
                Applications <span className="ml-1 font-normal text-label-2 num">{applications.length}</span>
            </h2>

            <ul className="card mt-5 divide-y divide-separator overflow-hidden">
                {applications.map((app) => (
                    <li key={app.application_id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-4">
                                <h3 className="truncate text-headline">{app.properties?.address}</h3>
                                {app.properties?.rent ? (
                                    <p className="shrink-0 text-headline num">
                                        {formatINR(app.properties.rent)}<span className="text-footnote font-normal text-label-2">/mo</span>
                                    </p>
                                ) : null}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-footnote text-label-2">
                                <StatusChip status={app.status} />
                                <span className="num">Applied {fmtDate(app.created_at)}</span>
                                <span className="num">Moving in {fmtDate(app.move_in_date)}</span>
                            </div>
                        </div>

                        {app.status === 'approved' && app.properties && (
                            <button
                                type="button"
                                onClick={() => generateLeaseDocument({
                                    propertyAddress: app.properties!.address,
                                    rent: app.properties!.rent,
                                    tenantId: tenant_id,
                                    landlordId: app.properties!.landlord_id,
                                    moveInDate: app.move_in_date
                                })}
                                className="btn btn-secondary btn-sm shrink-0 self-start sm:self-auto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Download draft agreement
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
