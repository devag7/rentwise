'use client'

import { useState, useEffect } from 'react';
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
export default function WatchArea() {
    const supabase = createClient();
    const [areas, setAreas] = useState<Area[]>([]);
    const [email, setEmail] = useState('');
    const [areaId, setAreaId] = useState('');
    const [maxRent, setMaxRent] = useState('');
    const [bhk, setBhk] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        supabase
            .from('areas')
            .select('area_id, name')
            .order('name')
            .then(({ data }) => {
                if (data) setAreas(data);
            });
    }, [supabase]);

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
            <div className="mt-16 bg-[#111] border border-[#00A699]/30 p-8 text-center">
                <p className="text-[10px] font-mono font-bold text-[#00A699] uppercase tracking-widest mb-2">Watch active</p>
                <p className="text-gray-400 text-sm font-light">
                    We will email you when matching flats appear in your area. One email a day, max.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-16 bg-[#111] border border-white/10 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#00A699]/5 blur-[60px] pointer-events-none rounded-full" />
            <div className="mb-6">
                <h3 className="text-sm font-bold text-[#00A699] uppercase tracking-widest mb-2 flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#00A699] rounded-full animate-pulse"></span>
                    Watch an area
                </h3>
                <p className="text-gray-400 text-sm font-light max-w-xl">
                    No account needed. Tell us where you&apos;re looking and we&apos;ll email you when
                    matching flats appear — one email a day, max.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end relative z-10">
                <div className="flex flex-col md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Area</label>
                    <select
                        required
                        value={areaId}
                        onChange={e => setAreaId(e.target.value)}
                        className="px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors font-mono text-sm appearance-none cursor-pointer"
                    >
                        <option value="" className="bg-[#111]">Select</option>
                        {areas.map(a => (
                            <option key={a.area_id} value={a.area_id} className="bg-[#111]">{a.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Max rent (optional)</label>
                    <input
                        type="number"
                        value={maxRent}
                        onChange={e => setMaxRent(e.target.value)}
                        placeholder="₹"
                        className="px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">BHK (optional)</label>
                    <select
                        value={bhk}
                        onChange={e => setBhk(e.target.value)}
                        className="px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors font-mono text-sm appearance-none cursor-pointer"
                    >
                        <option value="" className="bg-[#111]">Any</option>
                        <option value="1BHK" className="bg-[#111]">1BHK</option>
                        <option value="2BHK" className="bg-[#111]">2BHK</option>
                        <option value="3BHK" className="bg-[#111]">3BHK</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="md:col-span-5 lg:col-span-1 lg:col-start-5 mt-2 py-3 px-6 bg-[#00A699] text-white font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                >
                    {submitting ? 'Saving…' : 'Watch area'}
                </button>
            </form>
            <p className="mt-4 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                Private — never shown publicly. Delete anytime by replying to any alert.
            </p>
        </div>
    );
}
