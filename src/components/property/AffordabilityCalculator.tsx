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

    const tone = rentToIncomeRatio <= 30
        ? { text: 'Comfortable: rent is 30% of your pay or less.', fg: 'text-good', bar: 'bg-good' }
        : rentToIncomeRatio <= 40
            ? { text: 'A stretch: rent is 30–40% of your pay.', fg: 'text-warn', bar: 'bg-warn' }
            : { text: 'Too high: rent is over 40% of your pay.', fg: 'text-bad', bar: 'bg-bad' };

    const formatCurrency = (val: string) => {
        const numbers = val.replace(/\D/g, '');
        if (!numbers) return '';
        return parseInt(numbers, 10).toLocaleString('en-IN');
    };

    return (
        <section className="card p-6" aria-labelledby="afford-heading">
            <h2 id="afford-heading" className="text-headline">Can you afford it?</h2>

            <div className="mt-4">
                <label htmlFor="afford-income" className="field-label">Your monthly take-home pay</label>
                <div className="relative">
                    <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-label-2">₹</span>
                    <input
                        id="afford-income"
                        type="text"
                        inputMode="numeric"
                        value={incomeStr}
                        onChange={(e) => setIncomeStr(formatCurrency(e.target.value))}
                        placeholder="0"
                        className="field pl-8 num"
                    />
                </div>
            </div>

            {income > 0 && (
                <div className="mt-5 border-t border-separator pt-5" aria-live="polite">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-callout text-label-2">Rent as share of pay</span>
                        <span className={`text-title-3 num ${tone.fg}`}>{rentToIncomeRatio.toFixed(1)}%</span>
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-fill">
                        <div
                            className={`h-full w-full origin-left rounded-full transition-transform duration-[250ms] ease-[var(--ease-out)] ${tone.bar}`}
                            style={{ transform: `scaleX(${Math.min(rentToIncomeRatio, 100) / 100})` }}
                        />
                    </div>
                    <p className={`mt-3 text-footnote font-semibold ${tone.fg}`}>{tone.text}</p>
                </div>
            )}
        </section>
    );
}
