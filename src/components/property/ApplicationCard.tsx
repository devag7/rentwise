'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { useAppContext } from '@/components/providers/AppContext';
import { track } from '@/utils/analytics';
import { formatINR, type Verdict } from '@/utils/market';
import MarketBar from '@/components/ui/MarketBar';
import VerdictPill from '@/components/ui/VerdictPill';

interface Props {
    property_id: number;
    landlord_id: string | null;
    rent: number;
    landlord_phone: string | null;
    verdict: Verdict | null;
    p25?: number;
    p75?: number;
    source?: string;
    source_url?: string;
}

const MAX_KYC_BYTES = 2 * 1024 * 1024;

export default function ApplicationCard({ property_id, landlord_id, rent, landlord_phone, verdict, p25, p75, source, source_url }: Props) {
    const { user, role } = useAppContext();
    const [isApplying, setIsApplying] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [intent, setIntent] = useState('');
    const [moveDate, setMoveDate] = useState('');
    const [kycFile, setKycFile] = useState<File | null>(null);
    const [phoneShown, setPhoneShown] = useState(false);

    const handleKycChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_KYC_BYTES) {
            toast.error('That file is over 2 MB. Choose a smaller one.');
            e.target.value = '';
            return;
        }
        if (!/^(image\/(jpeg|png)|application\/pdf)$/.test(file.type)) {
            toast.error('Use a JPG, PNG or PDF file.');
            e.target.value = '';
            return;
        }
        setKycFile(file);
    };

    const submitApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Log in as a tenant to apply.');
            return;
        }
        const supabase = createClient();
        setIsApplying(true);
        const t = toast.loading('Sending application…');
        try {
            let kyc_document_url: string | null = null;
            if (kycFile) {
                // Private bucket: store the object path; landlords open it via a signed URL.
                const ext = kycFile.name.split('.').pop()?.toLowerCase() || 'bin';
                const path = `${user.id}/${property_id}-${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('kyc_documents').upload(path, kycFile);
                if (uploadError) throw uploadError;
                kyc_document_url = path;
            }
            const { error } = await supabase.from('applications').insert({
                property_id,
                tenant_id: user.id,
                intent_description: intent,
                move_in_date: moveDate,
                kyc_document_url,
            });
            if (error) throw error;
            track('application_submitted', { property_id });
            toast.success('Application sent to the landlord.', { id: t });
            setIsModalOpen(false);
            setIntent('');
            setMoveDate('');
            setKycFile(null);
        } catch (err) {
            toast.error((err as Error).message || 'Could not send the application. Try again.', { id: t });
        } finally {
            setIsApplying(false);
        }
    };

    const revealPhone = () => {
        setPhoneShown(true);
        track('contact_revealed', { property_id });
    };

    return (
        <div className="card flex h-fit flex-col p-6">
            <p className="text-footnote text-label-2">Asking rent</p>
            <p className="mt-0.5 text-title-1 num">
                {formatINR(rent)}<span className="text-callout font-normal text-label-2">/mo</span>
            </p>

            <section aria-labelledby="fair-rent-heading" className="mt-6 border-t border-separator pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 id="fair-rent-heading" className="text-headline">Is this rent fair?</h2>
                    {verdict && <VerdictPill verdict={verdict} />}
                </div>
                {verdict ? (
                    <>
                        <MarketBar
                            className="mt-5"
                            median={verdict.median}
                            p25={p25 ?? null}
                            p75={p75 ?? null}
                            rent={rent}
                            count={verdict.count}
                        />
                        <p className="mt-3 text-footnote text-label-2">
                            Compared with <span className="num">{verdict.count}</span> live listings of the same size in this area.
                            {p25 && p75 ? ' The darker band is the typical range; the dot is this flat.' : ' The dot is this flat; the line is the median.'}
                        </p>
                    </>
                ) : (
                    <p className="mt-2 text-callout text-label-2">
                        Too few similar listings in this area to judge the price yet. We only give a verdict when at least 3 real flats can be compared.
                    </p>
                )}
            </section>

            <div className="mt-6 flex flex-col gap-3">
                {source === 'scraped' ? (
                    <>
                        <p className="text-footnote text-label-2">
                            This flat is listed on another site. Contact the owner and book visits there.
                        </p>
                        {source_url && (
                            <a
                                href={source_url}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                onClick={() => track('source_clicked', { property_id })}
                                className="btn btn-primary w-full"
                            >
                                View original listing
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M9 7h8v8" />
                                </svg>
                                <span className="sr-only">(opens in a new tab)</span>
                            </a>
                        )}
                    </>
                ) : role === 'landlord' ? (
                    <p className="rounded-[var(--radius-control)] bg-fill px-4 py-3 text-center text-footnote text-label-2">Landlord accounts can&apos;t apply to listings.</p>
                ) : (
                    <>
                        <button
                            onClick={() => (user ? setIsModalOpen(true) : toast.error('Log in as a tenant to apply.'))}
                            className="btn btn-primary w-full"
                        >
                            Apply to rent
                        </button>
                        {landlord_id && (
                            <Link href={`/messages?user=${landlord_id}`} className="btn btn-secondary w-full">
                                Message landlord
                            </Link>
                        )}
                        {landlord_phone && (user ? (
                            phoneShown
                                ? <a href={`tel:${landlord_phone}`} className="link mx-auto mt-1 text-headline num">{landlord_phone}</a>
                                : <button onClick={revealPhone} className="link mx-auto mt-1 text-callout">Show phone number</button>
                        ) : (
                            <Link href="/login/tenant" className="link mx-auto mt-1 text-callout">Log in to see the phone number</Link>
                        ))}
                    </>
                )}
            </div>

            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-[250ms] ease-[var(--ease-out)] starting:opacity-0"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="apply-title"
                >
                    <div className="relative w-full max-w-md rounded-[var(--radius-panel)] bg-surface-3 p-6 shadow-raised transition-[opacity,transform] duration-[250ms] ease-[var(--ease-out)] starting:scale-[0.96] starting:opacity-0 sm:p-8">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-fill text-label-2 transition-colors hover:bg-fill-strong hover:text-label"
                            aria-label="Close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                            </svg>
                        </button>
                        <h2 id="apply-title" className="text-title-3 pr-10">Apply to rent</h2>
                        <form onSubmit={submitApplication} className="mt-6 space-y-5">
                            <div>
                                <label htmlFor="apply-intent" className="field-label">About you</label>
                                <textarea id="apply-intent" value={intent} onChange={e => setIntent(e.target.value)} required maxLength={1000}
                                    placeholder="Who's moving in, where you work, how long you plan to stay…"
                                    className="field min-h-[110px] resize-y" />
                            </div>
                            <div>
                                <label htmlFor="apply-date" className="field-label">Move-in date</label>
                                <input id="apply-date" type="date" value={moveDate} onChange={e => setMoveDate(e.target.value)} required
                                    className="field num" />
                            </div>
                            <div>
                                <span id="apply-kyc-label" className="field-label">ID or salary proof (optional)</span>
                                <label className="btn btn-secondary btn-sm cursor-pointer" aria-describedby="apply-kyc-hint">
                                    {kycFile ? 'Choose a different file' : 'Attach a file'}
                                    <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={handleKycChange} className="sr-only" aria-labelledby="apply-kyc-label" />
                                </label>
                                <p id="apply-kyc-hint" className="mt-2 text-footnote text-label-2">
                                    {kycFile ? kycFile.name : 'JPG, PNG or PDF, up to 2 MB. Only this landlord can open it.'}
                                </p>
                            </div>
                            <button type="submit" disabled={isApplying} className="btn btn-primary w-full">
                                {isApplying ? 'Sending…' : 'Send application'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
