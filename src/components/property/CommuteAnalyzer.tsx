'use client'

import { useState, FormEvent } from 'react';
import { track } from '@/utils/analytics';

interface Props {
    propertyArea: string;
    latitude?: number | null;
    longitude?: number | null;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
// Bangalore metro bounding box — keeps geocoding results local.
const BBOX = '77.30,12.70,77.95,13.25';
const PROXIMITY = '77.5946,12.9716';

async function geocode(query: string): Promise<{ coords: [number, number]; label: string } | null> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&country=in&bbox=${BBOX}&proximity=${PROXIMITY}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const f = json.features?.[0];
    return f ? { coords: f.center as [number, number], label: f.place_name as string } : null;
}

/** Real routing via Mapbox Directions (live traffic). Hidden when no token. */
export default function CommuteAnalyzer({ propertyArea, latitude, longitude }: Props) {
    const [workplace, setWorkplace] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ minutes: number; km: number; to: string; approx: boolean } | null>(null);

    if (!TOKEN) return null;

    const handleCalculate = async (e: FormEvent) => {
        e.preventDefault();
        if (!workplace.trim()) return;
        setBusy(true);
        setError(null);
        setResult(null);
        try {
            const origin: [number, number] | null = latitude && longitude
                ? [longitude, latitude]
                : (await geocode(`${propertyArea}, Bengaluru`))?.coords ?? null;
            const dest = await geocode(workplace.trim());
            if (!origin || !dest) {
                setError('Could not find that place in Bangalore. Try a company or landmark name.');
                return;
            }
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin.join(',')};${dest.coords.join(',')}?access_token=${TOKEN}&overview=false`;
            const res = await fetch(url);
            const json = await res.json();
            const route = json.routes?.[0];
            if (!route) {
                setError('No driving route found.');
                return;
            }
            setResult({
                minutes: Math.round(route.duration / 60),
                km: Math.round(route.distance / 100) / 10,
                to: dest.label.split(',').slice(0, 2).join(','),
                approx: !(latitude && longitude),
            });
            track('commute_checked', { area: propertyArea });
        } catch {
            setError('Routing service unavailable. Try again shortly.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="bg-[#0A0A0A] border border-white/5 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#FF385C]" />
            <h2 className="text-[10px] font-bold text-[#FF385C] uppercase tracking-widest mb-4">Commute check</h2>
            <form onSubmit={handleCalculate} className="flex gap-2">
                <label htmlFor="commute-to" className="sr-only">Workplace</label>
                <input
                    id="commute-to"
                    value={workplace}
                    onChange={e => setWorkplace(e.target.value)}
                    placeholder="Office, e.g. Manyata Tech Park"
                    className="flex-1 min-w-0 px-3 py-2 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#FF385C] placeholder-gray-600 text-sm"
                />
                <button type="submit" disabled={busy} className="px-4 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest disabled:opacity-50">
                    {busy ? '…' : 'Go'}
                </button>
            </form>
            {error && <p className="mt-4 text-xs text-gray-400">{error}</p>}
            {result && (
                <div className="mt-5">
                    <p className="text-3xl font-black text-white tracking-tighter">{result.minutes} min <span className="text-sm font-bold text-gray-400">by car, current traffic</span></p>
                    <p className="text-xs text-gray-400 mt-1">{result.km} km to {result.to}</p>
                    {result.approx && <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">From the {propertyArea} area centre — exact location not published</p>}
                </div>
            )}
        </div>
    );
}
