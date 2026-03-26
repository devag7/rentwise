'use client'

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

interface Props {
    property_id: number;
    landlord_id: string;
    rent: number;
    landlord_phone: string | null;
    predictedPrice: number;
    isGoodDeal: boolean;
    differencePercent: string;
    source?: string;
    source_url?: string;
    contact_name?: string;
    contact_phone?: string;
}

export default function ApplicationCard({ property_id, landlord_id, rent, landlord_phone, predictedPrice, isGoodDeal, differencePercent, source, source_url, contact_name, contact_phone }: Props) {
    const supabase = createClient();
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [intent, setIntent] = useState('');
    const [moveDate, setMoveDate] = useState('');
    const [kycFile, setKycFile] = useState<File | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUserId(session.user.id);
                setUserRole(session.user.user_metadata?.role || 'tenant');
            }
        };
        checkUser();
    }, [supabase]);

    const handleKycChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('KYC Document must be less than 2MB');
                e.target.value = '';
                return;
            }
            if (!file.type.match(/image\/(jpeg|jpg|png)|application\/pdf/)) {
                toast.error('Only JPG/PNG or PDF documents allowed');
                e.target.value = '';
                return;
            }
            setKycFile(file);
        }
    };

    const submitApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            toast.error("You must be logged in as a Tenant to apply.");
            return;
        }

        setIsApplying(true);
        const loadingToast = toast.loading('Encrypting and submitting application...');

        try {
            let kyc_document_url = null;

            if (kycFile) {
                const fileName = `${userId}-${property_id}-${Date.now()}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('kyc_documents')
                    .upload(fileName, kycFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('kyc_documents')
                    .getPublicUrl(uploadData.path);

                kyc_document_url = publicUrl;
            }

            const { error } = await supabase
                .from('applications')
                .insert({
                    property_id,
                    tenant_id: userId,
                    intent_description: intent,
                    move_in_date: moveDate,
                    kyc_document_url
                });

            if (error) throw error;

            toast.success('Official application submitted to Landlord.', { id: loadingToast });
            setIsModalOpen(false);
            setIntent('');
            setMoveDate('');
            setKycFile(null);

        } catch (err: unknown) {
            toast.error(((err as Error).message || 'Something went wrong'), { id: loadingToast });
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="bg-[#050505] p-8 border border-white/10 h-fit flex flex-col mt-12 md:mt-0">

            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Asking Valuation</p>
            <div className="flex items-end mb-8">
                <span className="text-5xl font-black text-white tracking-tighter leading-none">
                    ₹{rent.toLocaleString('en-IN')}
                </span>
                <span className="text-gray-500 font-bold text-xs tracking-widest uppercase ml-2 mb-1">/ Month</span>
            </div>

            {/* AI Analysis Block */}
            <div className="mb-10 bg-[#0A0A0A] border border-white/5 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#00A699]"></div>
                <h4 className="text-[10px] font-bold text-[#00A699] uppercase tracking-widest mb-4 flex items-center">
                    <span className="w-2 h-2 bg-[#00A699] rounded-full animate-pulse mr-2"></span>
                    AI Market Analysis
                </h4>

                <div className="flex justify-between items-end mb-4">
                    <span className="text-gray-400 font-medium text-sm">Estimated Fair Value</span>
                    <span className="text-2xl font-bold text-white tracking-tight">₹{predictedPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className={`flex items-center p-3 border text-[10px] font-bold tracking-widest uppercase ${isGoodDeal
                    ? 'bg-[#00A699]/10 text-[#00A699] border-[#00A699]/30'
                    : 'bg-[#FF385C]/10 text-[#FF385C] border-[#FF385C]/30'
                    }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isGoodDeal
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        }
                    </svg>
                    <span>
                        {isGoodDeal ? `Priced ${differencePercent}% Below Market` : `Priced ${differencePercent}% Above Market`}
                    </span>
                </div>
            </div>

            {/* Action Area */}
            <div className="flex flex-col gap-3">
                {source === 'scraped' ? (
                    <>
                        {/* External listing — no Apply/Message */}
                        <div className="w-full py-4 px-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1">External Listing</p>
                            <p className="text-[9px] font-mono text-amber-500/70 uppercase tracking-wider">Booking unavailable — not registered on platform</p>
                        </div>
                        {source_url && (
                            <a
                                href={source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-4 px-4 bg-white text-black font-bold text-xs uppercase tracking-widest text-center transition-all duration-300 hover:bg-amber-500 hover:text-white inline-block"
                            >
                                View Original Listing →
                            </a>
                        )}
                        {/* Contact info — gated behind auth */}
                        {userId ? (
                            <div className="mt-2 p-4 bg-[#0A0A0A] border border-white/5">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Contact Information</p>
                                {contact_name && <p className="text-sm font-medium text-white">{contact_name}</p>}
                                {contact_phone && <p className="text-xs font-mono text-gray-400 mt-1">{contact_phone}</p>}
                                {landlord_phone && <p className="text-xs font-mono text-gray-400 mt-1">{landlord_phone}</p>}
                            </div>
                        ) : (
                            <div className="mt-2 p-4 bg-[#0A0A0A] border border-white/5 text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Login to view contact details</p>
                            </div>
                        )}
                    </>
                ) : userRole === 'landlord' ? (
                    <button disabled className="w-full py-5 px-4 bg-white/5 text-gray-500 font-bold text-xs uppercase tracking-widest cursor-not-allowed border border-white/10">
                        Admin Restricted Action
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full py-4 px-4 bg-white text-black font-bold text-xs uppercase tracking-widest text-center transition-all duration-300 hover:bg-[#00A699] hover:text-white inline-block"
                        >
                            Official Application
                        </button>
                        <a
                            href={`/messages?user=${landlord_id}`}
                            className="w-full py-4 px-4 bg-transparent border border-white/20 text-white font-bold text-xs uppercase tracking-widest text-center transition-all duration-300 hover:border-[#FF385C] hover:text-[#FF385C] inline-block"
                        >
                            Direct Message
                        </a>
                    </>
                )}

                {/* Contact info for platform listings — gated behind auth */}
                {source !== 'scraped' && userId && landlord_phone && (
                    <p className="text-center text-[10px] font-mono font-medium text-gray-500 uppercase tracking-widest mt-2">
                        Direct Line / Support: {landlord_phone}
                    </p>
                )}
                {source !== 'scraped' && !userId && landlord_phone && (
                    <p className="text-center text-[10px] font-mono font-medium text-gray-600 uppercase tracking-widest mt-2">
                        🔒 Login to view contact info
                    </p>
                )}
            </div>

            {/* Application Formal Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-[#111] border border-white/20 p-8 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                            <span className="w-2 h-2 bg-[#00A699] rounded-full animate-pulse"></span>
                            <span className="uppercase tracking-widest">Application Vault</span>
                        </h2>
                        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Secure Tenant Submission protocol</p>

                        <form onSubmit={submitApplication} className="space-y-6">
                            <div className="flex flex-col relative">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Intent Description</label>
                                <textarea
                                    value={intent}
                                    onChange={(e) => setIntent(e.target.value)}
                                    placeholder="Brief background and intent to rent..."
                                    className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm min-h-[100px]"
                                    required
                                />
                            </div>

                            <div className="flex flex-col relative">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Requested Move-in Date</label>
                                <input
                                    type="date"
                                    value={moveDate}
                                    onChange={(e) => setMoveDate(e.target.value)}
                                    className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col relative pt-2">
                                <label className="text-[10px] font-bold text-[#00A699] uppercase tracking-widest block mb-2">KYC Document Upload (ID / Salary Proof)</label>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer inline-flex items-center px-4 py-3 bg-white/5 border border-[#00A699]/30 hover:bg-[#00A699]/10 text-[#00A699] transition-colors font-mono uppercase tracking-widest text-[10px] font-bold">
                                        Attach File
                                        <input type="file" accept="image/jpeg, image/png, application/pdf" onChange={handleKycChange} className="hidden" />
                                    </label>
                                    <span className="text-[10px] text-gray-500 font-mono flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                        {kycFile ? kycFile.name : "Encrypted transfer enabled (Max 2MB)"}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-[#00A699] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                disabled={isApplying}
                            >
                                {isApplying ? <span className="animate-pulse">Encrypting & Routing...</span> : "Submit Application"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
