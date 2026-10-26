import { NextResponse } from 'next/server';
import { createPublicClient } from '@/utils/supabase/public';
import { parseRentQuery } from '@/utils/parseRentQuery';
import { getMarketStats, marketKey, getVerdict } from '@/utils/market';
import { getAreas, queryActive } from '@/utils/listings';

/**
 * Fallback for the `check-rent` Supabase Edge Function (same contract), so
 * /check works even before the function is deployed.
 */
export async function POST(req: Request) {
    let body: { text?: string; area_id?: number; property_type?: string; rent?: number };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
    }

    const supabase = createPublicClient();
    const areas = await getAreas(supabase);
    const parsed = parseRentQuery(String(body.text || ''), areas);
    const areaId = Number(body.area_id) || parsed.areaId;
    const propertyType = body.property_type || parsed.propertyType;
    const rent = Number(body.rent) || parsed.rent;
    const areaName = areas.find(a => a.area_id === areaId)?.name ?? null;

    const out = {
        parsed: { area_id: areaId, area_name: areaName, property_type: propertyType, rent },
        stat: null as null | { median: number; p25?: number; p75?: number; count: number },
        verdict: null as null | { label: string; percent: number },
        alternatives: [] as { property_id: number; address: string; rent: number; image_url: string | null }[],
        paid: null as null | { median: number; deposit_months: number | null; count: number },
        message: undefined as string | undefined,
    };

    if (!areaId || !propertyType) {
        out.message = `Couldn't tell the ${!areaId ? 'area' : 'BHK'}. Try something like "2BHK HSR Layout 42k".`;
        return NextResponse.json(out);
    }

    const [stats, { data: alts }, { data: paid }] = await Promise.all([
        getMarketStats(supabase, { areaId, propertyType }),
        queryActive((activeOnly) => {
            let q = supabase.from('properties').select('property_id, address, rent, image_url')
                .eq('area_id', areaId).eq('property_type', propertyType);
            if (activeOnly) q = q.eq('is_active', true);
            if (rent) q = q.lt('rent', rent);
            return q.order('rent', { ascending: true }).limit(3);
        }),
        supabase.from('paid_rent_stats').select('median, deposit_months, count')
            .eq('area_id', areaId).eq('property_type', propertyType).maybeSingle(),
    ]);

    const stat = stats[marketKey(areaId, propertyType)];
    out.stat = stat ?? null;
    out.alternatives = (alts || []) as typeof out.alternatives;
    out.paid = (paid as typeof out.paid) ?? null;
    if (!stat) {
        out.message = `Fewer than 3 live ${propertyType} listings in ${areaName} right now, so we won't guess a fair price.`;
    } else if (rent) {
        const v = getVerdict(rent, stat);
        out.verdict = v ? { label: v.label, percent: v.percent } : null;
    } else {
        out.message = 'Add the rent (e.g. "42k") to get a verdict.';
    }
    return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
