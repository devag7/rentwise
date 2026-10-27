/**
 * Parses free text or a pasted listing URL into { bhk, rent, area }.
 * e.g. "2bhk hsr layout 42k", "₹42,000 2 BHK in Koramangala",
 * "https://www.nobroker.in/property/2-bhk-apartment-for-rent-in-hsr-layout-bangalore/...".
 * Pure function — no network, never invents a value it didn't find.
 */
export interface ParsedRentQuery {
    propertyType: string | null;
    rent: number | null;
    areaId: number | null;
    areaName: string | null;
}

const ALIASES: Record<string, string[]> = {
    'Electronic City': ['ecity', 'e city', 'electronics city'],
    'Koramangala': ['kormangala', 'koramangla'],
    'Indiranagar': ['indira nagar'],
    'Old Airport Road': ['old airport rd'],
    'Rajarajeshwari Nagar': ['rr nagar'],
    'KR Puram': ['k r puram'],
};

export function parseRentQuery(input: string, areas: { area_id: number; name: string }[]): ParsedRentQuery {
    const raw = input.slice(0, 2000);
    let text = raw.toLowerCase();
    // URL slugs: turn "2-bhk-apartment-in-hsr-layout" into words.
    if (/^https?:\/\//.test(text.trim())) {
        try {
            const u = new URL(text.trim());
            text = decodeURIComponent(u.pathname + ' ' + u.search).replace(/[-_/+=?&]+/g, ' ');
        } catch { /* keep text */ }
    }

    // BHK
    let propertyType: string | null = null;
    if (/\b1\s*rk\b/.test(text)) propertyType = '1RK';
    const bhk = text.match(/\b([1-4])\s*(?:bhk|bed(?:room)?s?|b\s*h\s*k)\b/);
    if (bhk) propertyType = `${bhk[1]}BHK`;

    // Rent: "42k", "42,000", "₹42000", "1.2 l", "1.2 lakh", "rs 42000"
    let rent: number | null = null;
    const cleaned = text.replace(/\b[1-4]\s*(?:bhk|bed(?:room)?s?)\b/g, ' ').replace(/\b\d{3,5}\s*(?:sq\.?\s*ft|sqft|sft)\b/g, ' ');
    const lakh = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:l|lac|lakh|lakhs)\b/);
    const k = cleaned.match(/(\d+(?:\.\d+)?)\s*k\b/);
    const plain = cleaned.match(/(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+|\d{4,7})\b/);
    if (lakh) rent = Math.round(parseFloat(lakh[1]) * 100000);
    else if (k) rent = Math.round(parseFloat(k[1]) * 1000);
    else if (plain) rent = parseInt(plain[1].replace(/,/g, ''), 10);
    if (rent !== null && (rent < 2000 || rent > 1000000)) rent = null;

    // Area: longest area name contained in the text (word-normalised).
    const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
    const hay = norm(text);
    let best: { area_id: number; name: string } | null = null;
    let bestLen = 0;
    for (const a of areas) {
        // Full name, plus the short form people actually type ("btm", "hsr", "sarjapur").
        const candidates = [a.name, a.name.replace(/\s+(layout|road|main road)$/i, ''), ...(ALIASES[a.name] || [])];
        for (const c of candidates) {
            const n = norm(c);
            if (n.trim().length >= 3 && hay.includes(n) && n.length > bestLen) {
                best = a;
                bestLen = n.length;
            }
        }
    }

    return { propertyType, rent, areaId: best?.area_id ?? null, areaName: best?.name ?? null };
}
