import { createPublicClient } from '@/utils/supabase/public';
import { parseRentQuery } from '@/utils/parseRentQuery';
import { getMarketStats, marketKey, getVerdict } from '@/utils/market';
import { getAreas, queryActive } from '@/utils/listings';

export interface CheckRentInput {
    text?: string;
    area_id?: number;
    property_type?: string;
    rent?: number;
}

export interface CheckRentResult {
    parsed: { area_id: number | null; area_name: string | null; property_type: string | null; rent: number | null };
    stat: null | { median: number; p25?: number; p75?: number; count: number };
    verdict: null | { label: string; percent: number };
    alternatives: { property_id: number; address: string; rent: number; image_url: string | null }[];
    paid: null | { median: number; deposit_months: number | null; count: number };
    message: string | undefined;
}

/**
 * Fair-rent check: parse the text, look up the live median for that area + BHK,
 * and return a verdict only when there are enough real comps. Shared by
 * /api/check-rent and the /check share-preview image.
 */
export async function checkRent(body: CheckRentInput): Promise<CheckRentResult> {
    const supabase = createPublicClient();
    const areas = await getAreas(supabase);
    const parsed = parseRentQuery(String(body.text || ''), areas);
    const areaId = Number(body.area_id) || parsed.areaId;
    const propertyType = body.property_type || parsed.propertyType;
    const rent = Number(body.rent) || parsed.rent;
    const areaName = areas.find(a => a.area_id === areaId)?.name ?? null;

    const out: CheckRentResult = {
        parsed: { area_id: areaId || null, area_name: areaName, property_type: propertyType || null, rent: rent || null },
        stat: null,
        verdict: null,
        alternatives: [],
        paid: null,
        message: undefined,
    };

    if (!areaId || !propertyType) {
        out.message = `Couldn't tell the ${!areaId ? 'area' : 'BHK'}. Try something like "2BHK HSR Layout 42k".`;
        return out;
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
    out.alternatives = (alts || []) as CheckRentResult['alternatives'];
    out.paid = (paid as CheckRentResult['paid']) ?? null;
    if (!stat) {
        out.message = `Fewer than 3 live ${propertyType} listings in ${areaName} right now, so we won't guess a fair price.`;
    } else if (rent) {
        const v = getVerdict(rent, stat);
        out.verdict = v ? { label: v.label, percent: v.percent } : null;
    } else {
        out.message = 'Add the rent (e.g. "42k") to get a verdict.';
    }
    return out;
}
