'use client'

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { track } from '@/utils/analytics';

interface Area {
    area_id: number;
    name: string;
}

/**
 * Frictionless retention hook: watch an area without creating an account.
 * Stores the intent in area_watches (insert-only RLS); alert emails ship
 * when the mailer lands (SCALE_PLAN Phase 2).
 */
export default function WatchArea({ areas }: { areas: Area[] }) {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [areaId, setAreaId] = useState('');
    const [maxRent, setMaxRent] = useState('');
    const [bhk, setBhk] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !areaId) return;
        setSubmitting(true);

        const { error } = await supabase.from('area_watches').insert({
            email: email.trim().toLowerCase(),
            area_id: parseInt(areaId),
            max_rent: maxRent ? parseInt(maxRent) : null,
            property_type: bhk || null,
        });

        setSubmitting(false);
        if (error) {
            if (error.code === '23505') {
                toast.success('You are already watching this area.');
                setDone(true);
            } else {
                toast.error('Could not save the watch. Try again.');
            }
            return;
        }
        track('area_watch_created', { area_id: parseInt(areaId), bhk: bhk || null });
        toast.success('Watching. You will hear from us when matching flats appear.');
        setDone(true);
    };

    if (done) {
        return (
            <div className="card mt-16 p-8 text-center" role="status">
                <p className="text-title-3">You&apos;re watching this area.</p>
                <p className="mt-2 text-label-2">
                    We&apos;ll email you when matching flats appear. One email a day at most.
                </p>
            </div>
        );
    }

    return (
        <div className="card mt-16 p-6 sm:p-8">
            <h3 className="text-title-3">Watch an area</h3>
            <p className="mt-2 max-w-xl text-callout text-label-2">
                No account needed. Tell us where you&apos;re looking and we&apos;ll email you when
                matching flats appear — one email a day at most.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="sm:col-span-2">
                    <label htmlFor="wa-email" className="field-label">Email</label>
                    <input
                        id="wa-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="field"
                    />
                </div>
                <div>
                    <label htmlFor="wa-area" className="field-label">Area</label>
                    <select
                        id="wa-area"
                        required
                        value={areaId}
                        onChange={e => setAreaId(e.target.value)}
                        className="field"
                    >
                        <option value="">Choose an area</option>
                        {areas.map(a => (
                            <option key={a.area_id} value={a.area_id}>{a.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="wa-max" className="field-label">Max rent (₹, optional)</label>
                    <input
                        id="wa-max"
                        type="number"
                        inputMode="numeric"
                        value={maxRent}
                        onChange={e => setMaxRent(e.target.value)}
                        placeholder="Any"
                        className="field num"
                    />
                </div>
                <div>
                    <label htmlFor="wa-bhk" className="field-label">BHK (optional)</label>
                    <select
                        id="wa-bhk"
                        value={bhk}
                        onChange={e => setBhk(e.target.value)}
                        className="field"
                    >
                        <option value="">Any</option>
                        <option value="1BHK">1BHK</option>
                        <option value="2BHK">2BHK</option>
                        <option value="3BHK">3BHK</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-secondary sm:col-span-2 lg:col-span-5 lg:justify-self-start"
                >
                    {submitting ? 'Saving…' : 'Watch this area'}
                </button>
            </form>
            <p className="mt-4 text-footnote text-label-2">
                Your email is private and never shown. Every alert has a one-click unsubscribe link.
            </p>
        </div>
    );
}
