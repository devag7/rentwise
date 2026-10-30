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
                setError('We couldn\'t find that place in Bangalore. Try a company or landmark name.');
                return;
            }
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin.join(',')};${dest.coords.join(',')}?access_token=${TOKEN}&overview=false`;
            const res = await fetch(url);
            const json = await res.json();
            const route = json.routes?.[0];
            if (!route) {
                setError('No driving route found to that place. Try a nearby landmark.');
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
            setError('Couldn\'t get directions right now. Try again in a minute.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="card p-6" aria-labelledby="commute-heading">
            <h2 id="commute-heading" className="text-headline">Commute</h2>
            <form onSubmit={handleCalculate} className="mt-4">
                <label htmlFor="commute-to" className="field-label">Where do you work?</label>
                <div className="flex gap-2">
                    <input
                        id="commute-to"
                        value={workplace}
                        onChange={e => setWorkplace(e.target.value)}
                        placeholder="e.g. Manyata Tech Park"
                        className="field min-w-0 flex-1"
                    />
                    <button type="submit" disabled={busy} className="btn btn-secondary shrink-0">
                        {busy ? 'Checking…' : 'Check'}
                    </button>
                </div>
            </form>
            {error && <p role="alert" className="mt-3 text-footnote text-bad">{error}</p>}
            {result && (
                <div className="pop-in mt-5" aria-live="polite">
                    <p className="text-title-2 num">{result.minutes} min</p>
                    <p className="text-callout text-label-2">
                        By car in current traffic · <span className="num">{result.km} km</span> to {result.to}
                    </p>
                    {result.approx && (
                        <p className="mt-2 text-caption text-label-2">
                            Measured from the centre of {propertyArea}; the exact address isn&apos;t published.
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}
