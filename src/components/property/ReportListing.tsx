'use client'

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { track } from '@/utils/analytics';

const REASONS = [
    { value: 'rented_out', label: 'Already rented out' },
    { value: 'wrong_price', label: 'Price is wrong' },
    { value: 'fake', label: 'Looks fake' },
    { value: 'spam', label: 'Spam / duplicate' },
    { value: 'other', label: 'Something else' },
] as const;

function sessionId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        let id = window.sessionStorage.getItem('rw_session_id');
        if (!id) { id = crypto.randomUUID(); window.sessionStorage.setItem('rw_session_id', id); }
        return id;
    } catch { return null; }
}

/**
 * Community trust layer (bengaluru.rent-style). Anyone can flag a listing
 * without an account; >= 3 reports hides it from listing queries.
 */
export default function ReportListing({ propertyId }: { propertyId: number }) {
    const supabase = createClient();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [detail, setDetail] = useState('');
    const [sent, setSent] = useState(false);

    const submit = async () => {
        if (!reason) return;
        const { error } = await supabase.from('listing_reports').insert({
            property_id: propertyId,
            reason,
            detail: detail.trim() || null,
            reporter_session: sessionId(),
        });
        if (error && error.code !== '23505') {
            toast.error('Could not submit. Try again.');
            return;
        }
        track('listing_reported', { property_id: propertyId, reason });
        setSent(true);
        toast.success('Thanks — flagged for review.');
    };

    if (sent) {
        return (
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                Reported · thank you
            </span>
        );
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="text-[10px] font-mono text-gray-600 hover:text-[#FF385C] uppercase tracking-widest transition-colors"
            >
                ⚐ Report this listing
            </button>
        );
    }

    return (
        <div className="bg-[#0A0A0A] border border-white/10 p-4 w-full max-w-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">What&apos;s wrong?</p>
            <div className="flex flex-col gap-2 mb-3">
                {REASONS.map(r => (
                    <label key={r.value} className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                        <input
                            type="radio"
                            name="report-reason"
                            value={r.value}
                            checked={reason === r.value}
                            onChange={() => setReason(r.value)}
                            className="accent-[#FF385C]"
                        />
                        {r.label}
                    </label>
                ))}
            </div>
            <textarea
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="Optional detail…"
                maxLength={500}
                rows={2}
                className="w-full bg-transparent border border-white/10 px-3 py-2 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-[#FF385C] mb-3 font-mono"
            />
            <div className="flex gap-2">
                <button
                    onClick={submit}
                    disabled={!reason}
                    className="flex-1 py-2 bg-[#FF385C] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-40"
                >
                    Submit
                </button>
                <button
                    onClick={() => setOpen(false)}
                    className="py-2 px-4 border border-white/20 text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
