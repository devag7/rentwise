'use client'

import { ChangeEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Area {
    area_id: number;
    name: string;
}

const selectCls =
    'w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-[#00A699] transition-colors text-sm font-medium appearance-none cursor-pointer';
const labelCls = 'text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block';

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
        <div className="bg-[#0A0A0A] border-y border-white/5 py-6 mb-8">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="md:hidden w-full flex justify-between items-center px-1 text-xs font-bold tracking-widest uppercase text-white"
                aria-expanded={open}
            >
                <span>Filters{activeCount ? ` · ${activeCount}` : ''}</span>
                <span className="text-gray-400">{open ? 'Hide' : 'Show'}</span>
            </button>

            <div className={`${open ? 'grid' : 'hidden'} md:grid mt-6 md:mt-0 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end`}>
                <div className="col-span-2 md:col-span-1">
                    <label className={labelCls} htmlFor="f-area">Location</label>
                    <select id="f-area" name="area_id" value={get('area_id')} onChange={onChange} className={selectCls}>
                        <option value="" className="bg-[#111]">All areas ({areas.length})</option>
                        {areas.map(a => (
                            <option key={a.area_id} value={a.area_id} className="bg-[#111]">{a.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={labelCls} htmlFor="f-type">BHK</label>
                    <select id="f-type" name="property_type" value={get('property_type')} onChange={onChange} className={selectCls}>
                        <option value="" className="bg-[#111]">Any</option>
                        <option value="1BHK" className="bg-[#111]">1BHK</option>
                        <option value="2BHK" className="bg-[#111]">2BHK</option>
                        <option value="3BHK" className="bg-[#111]">3BHK</option>
                    </select>
                </div>

                <div>
                    <label className={`${labelCls} text-[#00A699]`} htmlFor="f-verdict">Market verdict</label>
                    <select id="f-verdict" name="verdict" value={get('verdict')} onChange={onChange} className={selectCls}>
                        <option value="" className="bg-[#111]">Any price</option>
                        <option value="under" className="bg-[#111]">↓ Under market</option>
                        <option value="at" className="bg-[#111]">≈ At market</option>
                        <option value="over" className="bg-[#111]">↑ Over market</option>
                    </select>
                </div>

                <div>
                    <label className={labelCls} htmlFor="f-min">Min (₹)</label>
                    <input id="f-min" name="min_rent" type="number" inputMode="numeric" defaultValue={get('min_rent')} key={`min-${get('min_rent')}`}
                        onBlur={onNumberCommit} onKeyDown={onNumberCommit} placeholder="0"
                        className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-[#00A699] text-sm placeholder-gray-700" />
                </div>
                <div>
                    <label className={labelCls} htmlFor="f-max">Max (₹)</label>
                    <input id="f-max" name="max_rent" type="number" inputMode="numeric" defaultValue={get('max_rent')} key={`max-${get('max_rent')}`}
                        onBlur={onNumberCommit} onKeyDown={onNumberCommit} placeholder="Any"
                        className="w-full bg-transparent text-white border-b border-gray-800 pb-2 focus:outline-none focus:border-[#00A699] text-sm placeholder-gray-700" />
                </div>

                <div>
                    <label className={labelCls} htmlFor="f-posted">Posted</label>
                    <select id="f-posted" name="posted_within" value={get('posted_within')} onChange={onChange} className={selectCls}>
                        <option value="" className="bg-[#111]">Any time</option>
                        <option value="7" className="bg-[#111]">Last 7 days</option>
                        <option value="30" className="bg-[#111]">Last 30 days</option>
                        <option value="90" className="bg-[#111]">Last 90 days</option>
                    </select>
                </div>

                <div>
                    <label className={labelCls} htmlFor="f-source">Source</label>
                    <select id="f-source" name="source" value={get('source')} onChange={onChange} className={selectCls}>
                        <option value="" className="bg-[#111]">All sources</option>
                        <option value="platform" className="bg-[#111]">Owner-listed</option>
                        <option value="scraped" className="bg-[#111]">External portals</option>
                    </select>
                </div>

                <div>
                    <label className={labelCls} htmlFor="f-furn">Furnishing</label>
                    <select id="f-furn" name="furnishing_status" value={get('furnishing_status')} onChange={onChange} className={selectCls}>
                        <option value="" className="bg-[#111]">Any</option>
                        <option value="Furnished" className="bg-[#111]">Furnished</option>
                        <option value="Semi-Furnished" className="bg-[#111]">Semi-Furnished</option>
                        <option value="Unfurnished" className="bg-[#111]">Unfurnished</option>
                    </select>
                </div>

                <div>
                    <label className={labelCls} htmlFor="f-sort">Sort</label>
                    <select id="f-sort" name="sort_by" value={get('sort_by') || 'newest'} onChange={onChange} className={selectCls}>
                        <option value="newest" className="bg-[#111]">Newest</option>
                        <option value="price_asc" className="bg-[#111]">Price: low → high</option>
                        <option value="price_desc" className="bg-[#111]">Price: high → low</option>
                        <option value="size_desc" className="bg-[#111]">Size: largest</option>
                    </select>
                </div>

                <label className="flex items-center gap-3 cursor-pointer pb-2">
                    <input type="checkbox" name="parking" checked={get('parking') === 'true'} onChange={onChange} className="h-4 w-4 accent-[#00A699]" />
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Parking</span>
                </label>
            </div>
        </div>
    );
}
