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
        <section className="bg-[#111] border border-white/10 p-6 sm:p-10">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Tenant reviews</h2>
                    <p className="text-xs text-gray-400 mt-1">
                        {reviews.length
                            ? `${avg.toFixed(1)} / 5 from ${reviews.length} review${reviews.length > 1 ? 's' : ''}`
                            : 'No reviews yet. Only tenants who applied through RentWise can review a flat.'}
                    </p>
                </div>
                {user && role === 'tenant' && !open && (
                    <button onClick={() => setOpen(true)} className="px-4 py-2 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest hover:border-white">
                        Write a review
                    </button>
                )}
            </div>

            {open && (
                <form onSubmit={submit} className="mb-8 flex flex-col gap-4 max-w-xl">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest" htmlFor="rv-rating">Rating</label>
                    <select id="rv-rating" value={rating} onChange={e => setRating(parseInt(e.target.value))} className="bg-[#0A0A0A] text-white border border-white/20 p-2 w-32">
                        {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ★</option>)}
                    </select>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest" htmlFor="rv-text">Review</label>
                    <textarea id="rv-text" value={text} onChange={e => setText(e.target.value)} maxLength={1000}
                        className="bg-[#0A0A0A] text-white border border-white/20 p-3 min-h-[100px] text-sm" />
                    <button disabled={busy} className="self-start px-6 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest disabled:opacity-50">
                        {busy ? 'Posting…' : 'Post review'}
                    </button>
                </form>
            )}

            <ul className="flex flex-col gap-6">
                {reviews.map(r => (
                    <li key={r.review_id} className="border-t border-white/5 pt-6">
                        <p className="text-[#00A699] text-sm">{'★'.repeat(r.rating)}<span className="text-gray-700">{'★'.repeat(5 - r.rating)}</span></p>
                        {r.review_text && <p className="text-gray-300 text-sm mt-2 leading-relaxed">{r.review_text}</p>}
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-2">
                            Verified applicant · {new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
