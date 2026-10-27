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
            <div className="bg-[#111] border border-[#00A699]/30 p-8 text-center">
                <p className="text-[10px] font-mono font-bold text-[#00A699] uppercase tracking-widest mb-2">Thank you</p>
                <p className="text-gray-300 text-sm">Your rent is counted anonymously. It shows up as an aggregate once 3 people report the same area &amp; BHK.</p>
            </div>
        );
    }

    const field = 'px-3 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] text-sm';
    return (
        <form onSubmit={submit} className="bg-[#111] border border-white/10 p-6 sm:p-8">
            <h2 className="text-sm font-bold text-[#00A699] uppercase tracking-widest mb-2">What do you actually pay?</h2>
            <p className="text-gray-300 text-sm mb-6 max-w-xl">Asking rent isn&apos;t what people pay. Add yours anonymously — no account, no email — and help everyone negotiate.</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                <div className="col-span-2 md:col-span-1 flex flex-col">
                    <label htmlFor="pr-area" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Area</label>
                    <select id="pr-area" required value={areaId} onChange={e => setAreaId(e.target.value)} className={`${field} appearance-none`}>
                        <option value="" className="bg-[#111]">Select</option>
                        {areas.map(a => <option key={a.area_id} value={a.area_id} className="bg-[#111]">{a.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="pr-bhk" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">BHK</label>
                    <select id="pr-bhk" value={bhk} onChange={e => setBhk(e.target.value)} className={`${field} appearance-none`}>
                        {['1RK', '1BHK', '2BHK', '3BHK', '4BHK'].map(b => <option key={b} value={b} className="bg-[#111]">{b}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="pr-rent" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Monthly rent ₹</label>
                    <input id="pr-rent" required type="number" inputMode="numeric" value={rent} onChange={e => setRent(e.target.value)} className={field} />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="pr-dep" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Deposit ₹ (optional)</label>
                    <input id="pr-dep" type="number" inputMode="numeric" value={deposit} onChange={e => setDeposit(e.target.value)} className={field} />
                </div>
                <button disabled={busy} className="col-span-2 md:col-span-1 py-3 px-6 bg-[#00A699] text-white font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50">
                    {busy ? 'Saving…' : 'Add my rent'}
                </button>
            </div>
        </form>
    );
}
