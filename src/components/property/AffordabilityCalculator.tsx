'use client'

import { useState } from 'react';

interface Props {
    monthlyRent: number;
}

export default function AffordabilityCalculator({ monthlyRent }: Props) {
    const [incomeStr, setIncomeStr] = useState('');

    // Parse income safely
    const income = parseInt(incomeStr.replace(/,/g, '') || '0', 10);

    // Calculate affordability metrics
    const rentToIncomeRatio = income > 0 ? (monthlyRent / income) * 100 : 0;

    let statusText = "Awaiting Data";
    let statusColor = "text-gray-500";
    let statusBg = "bg-white/5";
    let borderColor = "border-white/10";

    if (income > 0) {
        if (rentToIncomeRatio <= 30) {
            statusText = "Excellent Affordability";
            statusColor = "text-[#00A699]";
            statusBg = "bg-[#00A699]/10";
            borderColor = "border-[#00A699]/30";
        } else if (rentToIncomeRatio <= 40) {
            statusText = "Moderate Risk (Budget Cautious)";
            statusColor = "text-yellow-500";
            statusBg = "bg-yellow-500/10";
            borderColor = "border-yellow-500/30";
        } else {
            statusText = "High Risk (Exceeds 40% threshold)";
            statusColor = "text-[#FF385C]";
            statusBg = "bg-[#FF385C]/10";
            borderColor = "border-[#FF385C]/30";
        }
    }

    const formatCurrency = (val: string) => {
        const numbers = val.replace(/\D/g, '');
        if (!numbers) return '';
        return parseInt(numbers, 10).toLocaleString('en-IN');
    };

    return (
        <div className="mb-10 bg-[#0A0A0A] border border-white/5 p-6 relative overflow-hidden">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Financial Affordability Alg.
            </h4>

            <div className="flex flex-col mb-6">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Enter Net Monthly Income</label>
                <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 font-bold font-mono">₹</span>
                    <input
                        type="text"
                        value={incomeStr}
                        onChange={(e) => setIncomeStr(formatCurrency(e.target.value))}
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-3 bg-[#111] text-white border-b border-white/20 focus:outline-none focus:border-white transition-colors font-mono text-xl font-bold placeholder-gray-800"
                    />
                </div>
            </div>

            {income > 0 && (
                <div className="animate-fade-in border-t border-white/10 pt-6">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Rent-to-Income Ratio</span>
                        <span className={`text-2xl font-black ${statusColor}`}>
                            {rentToIncomeRatio.toFixed(1)}%
                        </span>
                    </div>

                    <div className={`mt-4 p-3 border text-[10px] font-bold uppercase tracking-widest ${statusBg} ${statusColor} ${borderColor} flex items-center`}>
                        <span className="w-1.5 h-1.5 rounded-full mr-2 currentColor bg-current"></span>
                        {statusText}
                    </div>

                    <div className="w-full bg-[#111] h-1.5 mt-4 overflow-hidden">
                        <div
                            className={`h-full ${statusColor.replace('text-', 'bg-')}`}
                            style={{ width: `${Math.min(rentToIncomeRatio, 100)}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
}
