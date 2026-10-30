'use client'

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { track } from '@/utils/analytics';

const REASONS = [
    { value: 'rented_out', label: 'Already rented out' },
    { value: 'wrong_price', label: 'Price is wrong' },
    { value: 'fake', label: 'Looks fake' },
    { value: 'spam', label: 'Spam or duplicate' },
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
            toast.error('Couldn\'t send the report. Try again.');
            return;
        }
        track('listing_reported', { property_id: propertyId, reason });
        setSent(true);
        toast.success('Thanks. We\'ll review this listing.');
    };

    if (sent) {
        return (
            <p className="text-footnote text-label-2" role="status">
                Reported. Thanks — we&apos;ll review this listing.
            </p>
        );
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 self-start text-footnote text-label-2 transition-colors hover:text-label"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V4m0 0h11l-1.5 4L15 12H4" />
                </svg>
                Report this listing
            </button>
        );
    }

    return (
        <div className="card pop-in w-full max-w-sm p-5">
            <fieldset>
                <legend className="text-headline">What&apos;s wrong with this listing?</legend>
                <div className="mt-3 flex flex-col gap-1">
                    {REASONS.map(r => (
                        <label key={r.value} className="flex min-h-[36px] cursor-pointer items-center gap-2.5 text-callout">
                            <input
                                type="radio"
                                name="report-reason"
                                value={r.value}
                                checked={reason === r.value}
                                onChange={() => setReason(r.value)}
                                className="h-4 w-4 accent-accent"
                            />
                            {r.label}
                        </label>
                    ))}
                </div>
            </fieldset>
            <label htmlFor="report-detail" className="field-label mt-3">Details (optional)</label>
            <textarea
                id="report-detail"
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="Anything that helps us check it"
                maxLength={500}
                rows={2}
                className="field text-callout"
            />
            <div className="mt-4 flex gap-2">
                <button onClick={submit} disabled={!reason} className="btn btn-secondary btn-sm">
                    Send report
                </button>
                <button onClick={() => setOpen(false)} className="btn btn-sm text-label-2 hover:text-label">
                    Cancel
                </button>
            </div>
        </div>
    );
}
