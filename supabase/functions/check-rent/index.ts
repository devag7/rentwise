/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />
/**
 * check-rent — "Is this rent fair?"
 * Called from the browser: supabase.functions.invoke('check-rent', { body }).
 * verify_jwt = false (anon callers). Read-only.
 *
 * Input:  { text?: string, area_id?: number, property_type?: string, rent?: number }
 *   Structured fields win; anything missing is parsed from `text` (pasted listing
 *   URL or free text like "2bhk hsr layout 42k"). URLs are never fetched — only
 *   their slug words are read.
 *   Optional LLM fallback (ANTHROPIC_API_KEY secret) only *parses* text into
 *   {bhk, rent, area}; medians always come from market_stats, never from a model.
 *
 * Verdict matches src/utils/market.ts: within ±5% of median = AT MARKET.
 */
import { adminClient } from '../_shared/supabase.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

const MAX_TEXT = 2000;
const AT_MARKET_BAND = 0.05;
const MIN_RENT = 1000;
const MAX_RENT = 10_000_000;
const TYPE_RE = /^(1RK|[1-9]BHK)$/;

// ─── Area cache (per isolate, 10 min) ───────────────────────────────────────
interface Area { area_id: number; name: string }
let areaCache: { at: number; areas: Area[] } | null = null;

async function loadAreas(): Promise<Area[]> {
    if (areaCache && Date.now() - areaCache.at < 10 * 60_000) return areaCache.areas;
    const { data, error } = await adminClient().from('areas').select('area_id, name');
    if (error) throw new Error(error.message);
    const areas = ((data ?? []) as Area[]).filter((a) => a.name);
    areaCache = { at: Date.now(), areas };
    return areas;
}

// ─── Parsing ────────────────────────────────────────────────────────────────
const normWords = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Common short forms → canonical area names (used only if that name exists in `areas`). */
const ALIASES: Record<string, string> = {
    'hsr': 'HSR Layout',
    'btm': 'BTM Layout',
    'ecity': 'Electronic City',
    'e city': 'Electronic City',
    'jpnagar': 'JP Nagar',
    'kormangala': 'Koramangala',
    'indira nagar': 'Indiranagar',
    'kr puram': 'KR Puram',
    'malleswaram': 'Malleshwaram',
    'yeshwantpur': 'Yeshwanthpur',
    'sarjapur': 'Sarjapur Road',
    'bannerghatta': 'Bannerghatta Road',
    'kanakapura': 'Kanakapura Road',
};

/** Turn a pasted URL into its slug words; leave free text alone. */
function textForParsing(text: string): { words: string; isUrl: boolean } {
    const t = text.trim();
    if (/^https?:\/\//i.test(t) || /^www\./i.test(t)) {
        try {
            const u = new URL(/^www\./i.test(t) ? `https://${t}` : t);
            const slug = decodeURIComponent(u.pathname + ' ' + u.search).replace(/[-_/+=&?.]+/g, ' ');
            return { words: slug, isUrl: true };
        } catch {
            // not a valid URL, treat as text
        }
    }
    return { words: t, isUrl: false };
}

function matchArea(text: string, areas: Area[]): Area | null {
    const words = normWords(text);
    const flat = compact(text);
    let best: Area | null = null;
    let bestLen = 0;
    for (const a of areas) {
        const n = normWords(a.name);
        const c = compact(a.name);
        const hit = words.includes(n) || (c.length >= 6 && flat.includes(c));
        if (hit && c.length > bestLen) {
            best = a;
            bestLen = c.length;
        }
    }
    if (best) return best;
    for (const [alias, canonical] of Object.entries(ALIASES)) {
        if (words.includes(` ${alias} `)) {
            const a = areas.find((x) => x.name.toLowerCase() === canonical.toLowerCase());
            if (a) return a;
        }
    }
    return null;
}

function parseType(text: string): string | null {
    const t = text.toLowerCase();
    if (/\b1\s*-?\s*rk\b/.test(t) || /\bstudio\b/.test(t)) return '1RK';
    const m = t.match(/\b([1-9])\s*-?\s*bhk\b/) || t.match(/\b([1-9])\s*-?\s*bed(?:room)?s?\b/);
    return m ? `${m[1]}BHK` : null;
}

function inRange(n: number): number | null {
    return Number.isFinite(n) && n >= MIN_RENT && n <= MAX_RENT ? Math.round(n) : null;
}

function parseRent(text: string, isUrl: boolean): number | null {
    const t = text.toLowerCase();
    // 1.2L / 1.2 lakh / 42k / ₹42k
    const suffixed = t.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(k|l|lac|lacs|lakh|lakhs)\b/);
    if (suffixed) {
        const n = parseFloat(suffixed[1]) * (suffixed[2] === 'k' ? 1_000 : 100_000);
        const r = inRange(n);
        if (r) return r;
    }
    // ₹42,000 / Rs. 42000 / INR 42000
    const currency = t.match(/(?:₹|rs\.?|inr)\s*(\d[\d,]*)/);
    if (currency) {
        const r = inRange(parseInt(currency[1].replace(/,/g, ''), 10));
        if (r) return r;
    }
    if (isUrl) return null; // bare numbers in URLs are usually ids
    // Bare number not followed by an area unit: 42,000 / 42000
    for (const m of t.matchAll(/(?<![\d.])(\d{1,3}(?:,\d{2,3})+|\d{4,8})(?![\d,])(?!\s*(?:sq|sqft|sft|square))/g)) {
        const r = inRange(parseInt(m[1].replace(/,/g, ''), 10));
        if (r) return r;
    }
    return null;
}

// ─── LLM fallback (parse only) ──────────────────────────────────────────────
const llmCalls = new Map<string, number[]>();
function llmAllowed(ip: string): boolean {
    const now = Date.now();
    const recent = (llmCalls.get(ip) ?? []).filter((t) => now - t < 60_000);
    if (recent.length >= 10) return false;
    recent.push(now);
    llmCalls.set(ip, recent);
    if (llmCalls.size > 5000) llmCalls.clear();
    return true;
}

async function llmParse(text: string, key: string): Promise<{ bhk?: string; rent?: number; area?: string } | null> {
    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-haiku-5-5',
                max_tokens: 150,
                system:
                    'Extract rental listing fields from the user text (Bangalore, India). ' +
                    'Reply with ONLY a JSON object: {"bhk": "1RK"|"1BHK"|"2BHK"|"3BHK"|"4BHK"|null, ' +
                    '"rent": monthly rent in rupees as an integer or null, "area": Bangalore locality name or null}. ' +
                    'Use null for anything not stated. Never guess or estimate values.',
                messages: [{ role: 'user', content: text }],
            }),
            signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) {
            await res.body?.cancel();
            return null;
        }
        const body = await res.json();
        const out = (body?.content ?? []).find((c: { type: string }) => c.type === 'text')?.text ?? '';
        const m = out.match(/\{[\s\S]*\}/);
        if (!m) return null;
        const parsed = JSON.parse(m[0]);
        return {
            bhk: typeof parsed.bhk === 'string' ? parsed.bhk.toUpperCase().replace(/\s+/g, '') : undefined,
            rent: typeof parsed.rent === 'number' ? parsed.rent : undefined,
            area: typeof parsed.area === 'string' ? parsed.area : undefined,
        };
    } catch {
        return null;
    }
}

// ─── Handler ────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

    let body: Record<string, unknown>;
    try {
        body = await req.json();
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    } catch {
        return json({ error: 'Body must be a JSON object' }, 400);
    }

    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (text.length > MAX_TEXT) return json({ error: `text must be at most ${MAX_TEXT} characters` }, 400);

    // Structured inputs (validated; invalid values are ignored, not trusted).
    let areaId: number | null = Number.isInteger(body.area_id) && (body.area_id as number) > 0 ? body.area_id as number : null;
    let propertyType: string | null = typeof body.property_type === 'string' && TYPE_RE.test(body.property_type.toUpperCase())
        ? body.property_type.toUpperCase() : null;
    let rent: number | null = typeof body.rent === 'number' ? inRange(body.rent) : null;

    if (!text && areaId == null && propertyType == null && rent == null) {
        return json({ error: 'Provide text, or area_id + property_type + rent' }, 400);
    }

    try {
        const sb = adminClient();
        const areas = await loadAreas();

        if (text) {
            const { words, isUrl } = textForParsing(text);
            if (areaId == null) areaId = matchArea(words, areas)?.area_id ?? null;
            if (propertyType == null) propertyType = parseType(words);
            if (rent == null) rent = parseRent(words, isUrl);

            const key = Deno.env.get('ANTHROPIC_API_KEY');
            const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
            if (key && (areaId == null || propertyType == null || rent == null) && llmAllowed(ip)) {
                const llm = await llmParse(text, key);
                if (llm) {
                    if (areaId == null && llm.area) areaId = matchArea(llm.area, areas)?.area_id ?? null;
                    if (propertyType == null && llm.bhk && TYPE_RE.test(llm.bhk)) propertyType = llm.bhk;
                    if (rent == null && llm.rent != null) rent = inRange(llm.rent);
                }
            }
        }

        const area = areaId != null ? areas.find((a) => a.area_id === areaId) ?? null : null;
        if (areaId != null && !area) areaId = null;

        const parsed = { area_id: areaId, area_name: area?.name ?? null, property_type: propertyType, rent };

        const missing: string[] = [];
        if (areaId == null) missing.push('the area (e.g. "HSR Layout")');
        if (propertyType == null) missing.push('the size (e.g. "2BHK")');
        if (areaId == null || propertyType == null) {
            if (rent == null) missing.push('the monthly rent (e.g. "42k")');
            return json({
                parsed, stat: null, verdict: null, alternatives: [], paid: null,
                message: `Couldn't work out ${missing.join(', ')}. Try something like "2BHK in HSR Layout for ₹42,000".`,
            });
        }

        const [statRes, paidRes, altRes] = await Promise.all([
            sb.from('market_stats').select('median, p25, p75, count')
                .eq('area_id', areaId).eq('property_type', propertyType).maybeSingle(),
            sb.from('paid_rent_stats').select('median, deposit_months, count')
                .eq('area_id', areaId).eq('property_type', propertyType).maybeSingle(),
            rent != null
                ? sb.from('properties').select('property_id, address, rent, image_url')
                    .eq('is_active', true).eq('area_id', areaId).eq('property_type', propertyType)
                    .gt('rent', 0).lt('rent', rent)
                    .order('rent', { ascending: true }).limit(3)
                : Promise.resolve({ data: [], error: null }),
        ]);
        if (statRes.error) throw new Error(statRes.error.message);

        const stat = statRes.data as { median: number; p25: number; p75: number; count: number } | null;
        const paid = (paidRes.data as { median: number; deposit_months: number | null; count: number } | null) ?? null;
        const alternatives = (altRes.data ?? []) as Array<{ property_id: number; address: string; rent: number; image_url: string }>;

        let verdict: { label: 'UNDER MARKET' | 'AT MARKET' | 'OVER MARKET'; percent: number } | null = null;
        let message: string | undefined;
        if (!stat || !stat.median) {
            message = `Not enough active ${propertyType} listings in ${area!.name} to call a fair price yet (we need at least 3 comparables).`;
        } else if (rent == null) {
            message = `Add the monthly rent to get a verdict — ${propertyType} in ${area!.name} has a median of ₹${stat.median.toLocaleString('en-IN')}.`;
        } else {
            const deviation = (rent - stat.median) / stat.median;
            verdict = {
                label: Math.abs(deviation) <= AT_MARKET_BAND ? 'AT MARKET' : deviation < 0 ? 'UNDER MARKET' : 'OVER MARKET',
                percent: Math.round(Math.abs(deviation) * 100),
            };
        }

        return json({
            parsed,
            stat: stat ? { median: stat.median, p25: stat.p25, p75: stat.p75, count: stat.count } : null,
            verdict,
            alternatives,
            paid,
            ...(message ? { message } : {}),
        });
    } catch (e) {
        console.error('[check-rent]', (e as Error).message);
        return json({ error: 'Something went wrong checking this rent. Please try again.' }, 500);
    }
});
