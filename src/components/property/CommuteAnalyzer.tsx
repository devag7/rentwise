'use client'

import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';

interface Props {
    propertyArea: string;
}

export default function CommuteAnalyzer({ propertyArea }: Props) {
    const [workplace, setWorkplace] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    const [result, setResult] = useState<{ drive: number, transit: number, distance: number } | null>(null);

    const handleCalculate = (e: FormEvent) => {
        e.preventDefault();
        if (!workplace.trim()) {
            toast.error("Enter a valid workplace coordinate.");
            return;
        }

        setIsCalculating(true);
        setResult(null);

        // Mock a complex routing calculation delay
        setTimeout(() => {
            // Generate deterministic but pseudo-random values based on string length
            const seed = workplace.length + propertyArea.length;
            const distance = (seed * 0.7) % 25 + 2; // 2km to 27km
            const drive = Math.round(distance * 3.5); // avg 3.5 mins per km in bangalore traffic
            const transit = Math.round(distance * 5.2);

            setResult({
                distance: parseFloat(distance.toFixed(1)),
                drive,
                transit
            });
            setIsCalculating(false);
        }, 1500);
    };

    return (
        <div className="mb-10 bg-[#0A0A0A] border border-white/5 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#FF385C]"></div>

            <h4 className="text-[10px] font-bold text-[#FF385C] uppercase tracking-widest mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Commute Distance Matrix
            </h4>

            <form onSubmit={handleCalculate} className="mb-0">
                <div className="flex flex-col mb-4">
                    <input
                        type="text"
                        value={workplace}
                        onChange={(e) => setWorkplace(e.target.value)}
                        placeholder="Enter Corporate HQ / Zone..."
                        className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#FF385C] transition-colors placeholder-gray-700 font-mono text-xs uppercase tracking-widest"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isCalculating}
                    className="w-full py-2 bg-white/5 border border-white/10 hover:bg-[#FF385C] hover:border-[#FF385C] hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest text-gray-400 disabled:opacity-50"
                >
                    {isCalculating ? 'Computing Vector...' : 'Calculate Route'}
                </button>
            </form>

            {result && (
                <div className="mt-6 pt-6 border-t border-white/10 animate-fade-in grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 mt-1">Distance</p>
                        <p className="text-xl font-black text-white">{result.distance} <span className="text-xs text-gray-500">KM</span></p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Drive Time
                        </p>
                        <p className="text-xl font-black text-[#FF385C]">{result.drive} <span className="text-xs text-gray-500">MIN</span></p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#00A699]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            Public Transit
                        </p>
                        <p className="text-sm font-bold text-white tracking-widest">{result.transit} <span className="text-xs text-[#00A699]">MIN</span></p>
                    </div>
                </div>
            )}

        </div>
    );
}
