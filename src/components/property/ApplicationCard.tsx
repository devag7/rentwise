'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { useAppContext } from '@/components/providers/AppContext';
import { track } from '@/utils/analytics';
import { formatINR, type Verdict } from '@/utils/market';

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
            toast.error('Document must be under 2MB.');
            e.target.value = '';
            return;
        }
        if (!/^(image\/(jpeg|png)|application\/pdf)$/.test(file.type)) {
            toast.error('Only JPG, PNG or PDF.');
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
        const t = toast.loading('Submitting application…');
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
            toast.error((err as Error).message || 'Something went wrong', { id: t });
        } finally {
            setIsApplying(false);
        }
    };

    const revealPhone = () => {
        setPhoneShown(true);
        track('contact_revealed', { property_id });
    };

    const verdictTone = !verdict ? '' : verdict.label === 'OVER MARKET'
        ? 'bg-[#FF385C]/10 text-[#FF385C] border-[#FF385C]/30'
        : verdict.label === 'UNDER MARKET'
            ? 'bg-[#00A699]/10 text-[#00A699] border-[#00A699]/30'
            : 'bg-white/5 text-gray-200 border-white/20';

    return (
        <div className="bg-[#050505] p-6 sm:p-8 border border-white/10 h-fit flex flex-col">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Asking rent</p>
            <div className="flex items-end mb-8">
                <span className="text-5xl font-black text-white tracking-tighter leading-none">{formatINR(rent)}</span>
                <span className="text-gray-400 font-bold text-xs tracking-widest uppercase ml-2 mb-1">/ month</span>
            </div>

            <div className="mb-8 bg-[#0A0A0A] border border-white/5 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#00A699]" />
                <h2 className="text-[10px] font-bold text-[#00A699] uppercase tracking-widest mb-4">Fair-rent check</h2>
                {verdict ? (
                    <>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-gray-400 text-sm">Market median</span>
                            <span className="text-2xl font-bold text-white tracking-tight">{formatINR(verdict.median)}</span>
                        </div>
                        {p25 && p75 ? (
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-gray-400 text-xs">Typical range</span>
                                <span className="text-sm font-mono text-gray-300">{formatINR(p25)} – {formatINR(p75)}</span>
                            </div>
                        ) : null}
                        <div className={`p-3 border text-[10px] font-bold tracking-widest uppercase ${verdictTone}`}>
                            {verdict.label === 'AT MARKET' ? 'Priced at market' : `Priced ${verdict.percent}% ${verdict.label === 'UNDER MARKET' ? 'below' : 'above'} market`}
                        </div>
                        <p className="mt-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest">Based on {verdict.count} comparable listings, same area &amp; BHK</p>
                    </>
                ) : (
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Not enough comparable listings in this area and configuration to call a fair price yet. We only show a verdict when at least 3 real comps exist.
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {source === 'scraped' ? (
                    <>
                        <p className="text-[11px] text-amber-400/90 leading-relaxed">
                            Listed on an external portal. Contact and booking happen on the original listing.
                        </p>
                        {source_url && (
                            <a
                                href={source_url}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                onClick={() => track('source_clicked', { property_id })}
                                className="w-full py-4 px-4 bg-white text-black font-bold text-xs uppercase tracking-widest text-center hover:bg-amber-500 hover:text-white transition-colors"
                            >
                                View original listing →
                            </a>
                        )}
                    </>
                ) : role === 'landlord' ? (
                    <p className="w-full py-4 px-4 bg-white/5 text-gray-400 text-xs text-center border border-white/10">Landlord accounts can&apos;t apply to listings.</p>
                ) : (
                    <>
                        <button
                            onClick={() => (user ? setIsModalOpen(true) : toast.error('Log in as a tenant to apply.'))}
                            className="w-full py-4 px-4 bg-white text-black font-bold text-xs uppercase tracking-widest text-center hover:bg-[#00A699] hover:text-white transition-colors"
                        >
                            Apply to rent
                        </button>
                        {landlord_id && (
                            <Link
                                href={`/messages?user=${landlord_id}`}
                                className="w-full py-4 px-4 border border-white/20 text-white font-bold text-xs uppercase tracking-widest text-center hover:border-[#FF385C] hover:text-[#FF385C] transition-colors"
                            >
                                Message landlord
                            </Link>
                        )}
                        {landlord_phone && (user ? (
                            phoneShown
                                ? <a href={`tel:${landlord_phone}`} className="text-center text-sm font-mono text-white mt-2">{landlord_phone}</a>
                                : <button onClick={revealPhone} className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-2 hover:text-white">Show phone number</button>
                        ) : (
                            <Link href="/login/tenant" className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 hover:text-white">Log in to see the phone number</Link>
                        ))}
                    </>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby="apply-title">
                    <div className="w-full max-w-md bg-[#111] border border-white/20 p-8 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close">✕</button>
                        <h2 id="apply-title" className="text-xl font-bold text-white mb-6 uppercase tracking-widest">Apply to rent</h2>
                        <form onSubmit={submitApplication} className="space-y-6">
                            <div>
                                <label htmlFor="apply-intent" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">About you</label>
                                <textarea id="apply-intent" value={intent} onChange={e => setIntent(e.target.value)} required maxLength={1000}
                                    placeholder="Who's moving in, work, how long you plan to stay…"
                                    className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] placeholder-gray-600 text-sm min-h-[100px]" />
                            </div>
                            <div>
                                <label htmlFor="apply-date" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Move-in date</label>
                                <input id="apply-date" type="date" value={moveDate} onChange={e => setMoveDate(e.target.value)} required
                                    className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] text-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-[#00A699] uppercase tracking-widest block mb-2">ID / salary proof (optional)</label>
                                <label className="cursor-pointer inline-flex items-center px-4 py-3 bg-white/5 border border-[#00A699]/30 text-[#00A699] text-[10px] font-bold uppercase tracking-widest">
                                    Attach file
                                    <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={handleKycChange} className="hidden" />
                                </label>
                                <p className="text-[10px] text-gray-400 font-mono mt-2">{kycFile ? kycFile.name : 'Private — only this landlord can open it. Max 2MB.'}</p>
                            </div>
                            <button type="submit" disabled={isApplying}
                                className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-[#00A699] hover:text-white disabled:opacity-50 transition-colors">
                                {isApplying ? 'Submitting…' : 'Submit application'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
