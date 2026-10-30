'use client'

import { useState } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import { track, getSessionId } from '@/utils/analytics';

/**
 * Anonymous "what do you actually pay?" — crowdsourced paid rents, shown
 * only as aggregates once 3+ people report the same area & BHK.
 */
export default function PaidRentForm({ areas }: { areas: { area_id: number; name: string }[] }) {
    const [areaId, setAreaId] = useState('');
    const [bhk, setBhk] = useState('2BHK');
    const [rent, setRent] = useState('');
    const [deposit, setDeposit] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const rentNum = parseInt(rent);
        if (!areaId || !(rentNum >= 2000 && rentNum <= 1000000)) {
            toast.error('Pick an area and enter a monthly rent between ₹2,000 and ₹10,00,000.');
            return;
        }
        setBusy(true);
        const { error } = await createClient().from('rent_submissions').insert({
            area_id: parseInt(areaId),
            property_type: bhk,
            rent: rentNum,
            deposit: deposit ? parseInt(deposit) : null,
            submitter_session: getSessionId(),
        });
        setBusy(false);
        if (error && error.code !== '23505') {
            toast.error('Could not save. Try again.');
            return;
        }
        track('paid_rent_submitted', { area_id: parseInt(areaId), bhk });
        setDone(true);
    };

    if (done) {
        return (
            <div className="card p-8 text-center" role="status">
                <p className="text-title-3">Thanks — your rent is counted.</p>
                <p className="mt-2 text-label-2">It stays anonymous and shows up as part of the median once 3 people report the same area and BHK.</p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="card p-6 sm:p-8">
            <h2 className="text-title-3">What do you actually pay?</h2>
            <p className="mt-2 max-w-xl text-callout text-label-2">
                Asking rent isn&apos;t always what people pay. Add yours anonymously — no account, no email — and help everyone negotiate.
            </p>
            <div className="mt-6 grid grid-cols-2 items-end gap-4 md:grid-cols-5">
                <div className="col-span-2 md:col-span-1">
                    <label htmlFor="pr-area" className="field-label">Area</label>
                    <select id="pr-area" required value={areaId} onChange={e => setAreaId(e.target.value)} className="field">
                        <option value="">Choose an area</option>
                        {areas.map(a => <option key={a.area_id} value={a.area_id}>{a.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="pr-bhk" className="field-label">BHK</label>
                    <select id="pr-bhk" value={bhk} onChange={e => setBhk(e.target.value)} className="field">
                        {['1RK', '1BHK', '2BHK', '3BHK', '4BHK'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="pr-rent" className="field-label">Monthly rent (₹)</label>
                    <input id="pr-rent" required type="number" inputMode="numeric" value={rent} onChange={e => setRent(e.target.value)} className="field num" />
                </div>
                <div>
                    <label htmlFor="pr-dep" className="field-label">Deposit (₹, optional)</label>
                    <input id="pr-dep" type="number" inputMode="numeric" value={deposit} onChange={e => setDeposit(e.target.value)} className="field num" />
                </div>
                <button disabled={busy} className="btn btn-secondary col-span-2 md:col-span-1">
                    {busy ? 'Saving…' : 'Add my rent'}
                </button>
            </div>
        </form>
    );
}
