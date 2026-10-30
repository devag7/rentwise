'use client'

import { useState } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import { useAppContext } from '@/components/providers/AppContext';

export interface Review {
    review_id: number;
    rating: number;
    review_text: string | null;
    created_at: string;
}

/**
 * Real reviews only. Database policy allows a review only from a tenant who
 * applied to this listing, so reviews can't be farmed.
 */
export default function PropertyReviews({ propertyId, initialReviews }: { propertyId: number; initialReviews: Review[] }) {
    const { user, role } = useAppContext();
    const [reviews, setReviews] = useState(initialReviews);
    const [rating, setRating] = useState(5);
    const [text, setText] = useState('');
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setBusy(true);
        const { data, error } = await createClient()
            .from('reviews')
            .insert({ property_id: propertyId, tenant_id: user.id, rating, review_text: text.trim() || null })
            .select('review_id, rating, review_text, created_at')
            .single();
        setBusy(false);
        if (error || !data) {
            toast.error('Only tenants who applied to this flat can review it.');
            return;
        }
        setReviews([data as Review, ...reviews]);
        setOpen(false);
        setText('');
        toast.success('Review posted.');
    };

    return (
        <section className="card p-6 sm:p-8" aria-labelledby="reviews-heading">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 id="reviews-heading" className="text-title-3">Reviews from tenants</h2>
                    <p className="mt-1 text-callout text-label-2 num">
                        {reviews.length
                            ? `${avg.toFixed(1)} out of 5 from ${reviews.length} review${reviews.length > 1 ? 's' : ''}`
                            : 'No reviews yet. Only tenants who applied through RentWise can review a flat.'}
                    </p>
                </div>
                {user && role === 'tenant' && !open && (
                    <button onClick={() => setOpen(true)} className="btn btn-secondary btn-sm">
                        Write a review
                    </button>
                )}
            </div>

            {open && (
                <form onSubmit={submit} className="mt-6 flex max-w-xl flex-col gap-4 border-t border-separator pt-6">
                    <div>
                        <label className="field-label" htmlFor="rv-rating">Rating</label>
                        <select id="rv-rating" value={rating} onChange={e => setRating(parseInt(e.target.value))} className="field w-40">
                            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} out of 5</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="field-label" htmlFor="rv-text">Your review (optional)</label>
                        <textarea id="rv-text" value={text} onChange={e => setText(e.target.value)} maxLength={1000}
                            placeholder="What was the flat and the landlord like?"
                            className="field min-h-[110px] resize-y" />
                    </div>
                    <div className="flex items-center gap-3">
                        <button disabled={busy} className="btn btn-primary btn-sm">
                            {busy ? 'Posting…' : 'Post review'}
                        </button>
                        <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {reviews.length > 0 && (
                <ul className="mt-6 divide-y divide-separator border-t border-separator">
                    {reviews.map(r => (
                        <li key={r.review_id} className="py-5">
                            <p className="text-callout tracking-[0.1em]" role="img" aria-label={`${r.rating} out of 5`}>
                                <span className="text-label">{'★'.repeat(r.rating)}</span><span className="text-label-3">{'★'.repeat(5 - r.rating)}</span>
                            </p>
                            {r.review_text && <p className="mt-2 max-w-2xl">{r.review_text}</p>}
                            <p className="mt-2 text-footnote text-label-2">
                                Verified applicant · {new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
