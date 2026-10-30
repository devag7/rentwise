'use client'

import { ChangeEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Area {
    area_id: number;
    name: string;
}

const VERDICTS = [
    { value: '', label: 'Any price' },
    { value: 'under', label: 'Under market' },
    { value: 'at', label: 'At market' },
    { value: 'over', label: 'Over market' },
];

const BHKS = [
    { value: '', label: 'Any size' },
    { value: '1BHK', label: '1BHK' },
    { value: '2BHK', label: '2BHK' },
    { value: '3BHK', label: '3BHK' },
];

const fieldCls = 'field text-callout';

/** Apple-style segmented control: a pill track with one selected item. */
function Segmented({
    label,
    options,
    value,
    onSelect,
}: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onSelect: (value: string) => void;
}) {
    return (
        <div role="group" aria-label={label} className="scrollbar-hide max-w-full overflow-x-auto">
            <div className="inline-flex rounded-full bg-fill p-1">
                {options.map(o => {
                    const selected = value === o.value;
                    return (
                        <button
                            key={o.value || 'any'}
                            type="button"
                            onClick={() => onSelect(o.value)}
                            aria-pressed={selected}
                            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-footnote transition-colors duration-200 ${
                                selected ? 'bg-surface-3 font-semibold text-label shadow-card' : 'text-label-2 hover:text-label'
                            }`}
                        >
                            {o.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function FilterBar({ areas }: { areas: Area[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);

    const get = (k: string) => searchParams.get(k) || '';
    const activeCount = ['area_id', 'property_type', 'min_rent', 'max_rent', 'verdict', 'posted_within', 'source', 'furnishing_status', 'parking']
        .filter(k => searchParams.get(k)).length;

    const update = (name: string, value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.delete('page');
        if (value && !(name === 'sort_by' && value === 'newest')) current.set(name, value);
        else current.delete(name);
        const qs = current.toString();
        router.push(`/properties${qs ? `?${qs}` : ''}`, { scroll: false });
    };

    const onChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const t = e.target as HTMLInputElement;
        update(t.name, t.type === 'checkbox' ? (t.checked ? 'true' : '') : t.value);
    };

    // Number inputs commit on blur/Enter instead of navigating per keystroke.
    const onNumberCommit = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
        if ('key' in e && e.key !== 'Enter') return;
        const t = e.currentTarget;
        if (t.value !== get(t.name)) update(t.name, t.value);
    };

    return (
        <section aria-label="Filters" className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
                <Segmented label="Price compared with market" options={VERDICTS} value={get('verdict')} onSelect={v => update('verdict', v)} />
                <Segmented label="Size" options={BHKS} value={get('property_type')} onSelect={v => update('property_type', v)} />
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="btn btn-secondary btn-sm md:hidden"
                    aria-expanded={open}
                    aria-controls="more-filters"
                >
                    More filters{activeCount ? <span className="num"> · {activeCount}</span> : null}
                </button>
            </div>

            <div
                id="more-filters"
                className={`${open ? 'grid' : 'hidden'} mt-4 grid-cols-2 items-end gap-x-4 gap-y-4 border-t border-separator pt-4 md:grid md:grid-cols-4 lg:grid-cols-6`}
            >
                <div className="col-span-2">
                    <label className="field-label" htmlFor="f-area">Area</label>
                    <select id="f-area" name="area_id" value={get('area_id')} onChange={onChange} className={fieldCls}>
                        <option value="">All areas ({areas.length})</option>
                        {areas.map(a => (
                            <option key={a.area_id} value={a.area_id}>{a.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="field-label" htmlFor="f-min">Min rent (₹)</label>
                    <input id="f-min" name="min_rent" type="number" inputMode="numeric" defaultValue={get('min_rent')} key={`min-${get('min_rent')}`}
                        onBlur={onNumberCommit} onKeyDown={onNumberCommit} placeholder="0"
                        className={`${fieldCls} num`} />
                </div>
                <div>
                    <label className="field-label" htmlFor="f-max">Max rent (₹)</label>
                    <input id="f-max" name="max_rent" type="number" inputMode="numeric" defaultValue={get('max_rent')} key={`max-${get('max_rent')}`}
                        onBlur={onNumberCommit} onKeyDown={onNumberCommit} placeholder="Any"
                        className={`${fieldCls} num`} />
                </div>

                <div>
                    <label className="field-label" htmlFor="f-posted">Listed</label>
                    <select id="f-posted" name="posted_within" value={get('posted_within')} onChange={onChange} className={fieldCls}>
                        <option value="">Any time</option>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                    </select>
                </div>

                <div>
                    <label className="field-label" htmlFor="f-source">Listed by</label>
                    <select id="f-source" name="source" value={get('source')} onChange={onChange} className={fieldCls}>
                        <option value="">Anyone</option>
                        <option value="platform">Owner on RentWise</option>
                        <option value="scraped">Other listing sites</option>
                    </select>
                </div>

                <div>
                    <label className="field-label" htmlFor="f-furn">Furnishing</label>
                    <select id="f-furn" name="furnishing_status" value={get('furnishing_status')} onChange={onChange} className={fieldCls}>
                        <option value="">Any</option>
                        <option value="Furnished">Furnished</option>
                        <option value="Semi-Furnished">Semi-furnished</option>
                        <option value="Unfurnished">Unfurnished</option>
                    </select>
                </div>

                <div>
                    <label className="field-label" htmlFor="f-sort">Sort by</label>
                    <select id="f-sort" name="sort_by" value={get('sort_by') || 'newest'} onChange={onChange} className={fieldCls}>
                        <option value="newest">Newest</option>
                        <option value="price_asc">Rent: low to high</option>
                        <option value="price_desc">Rent: high to low</option>
                        <option value="size_desc">Size: largest first</option>
                    </select>
                </div>

                <label className="col-span-2 flex min-h-[44px] cursor-pointer items-center gap-2.5 md:col-span-1">
                    <input type="checkbox" name="parking" checked={get('parking') === 'true'} onChange={onChange} className="h-[18px] w-[18px] accent-accent" />
                    <span className="text-callout">Has parking</span>
                </label>
            </div>
        </section>
    );
}
