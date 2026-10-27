import type { SupabaseClient } from '@supabase/supabase-js';

type Cell = string | number | null | undefined;

function escapeCell(v: Cell): string {
    if (v == null) return '';
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: Cell[][]): string {
    return [header, ...rows].map(r => r.map(escapeCell).join(',')).join('\r\n') + '\r\n';
}

export function csvResponse(body: string, filename: string, status = 200): Response {
    return new Response(body, {
        status,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `inline; filename=${filename}`,
            'Access-Control-Allow-Origin': '*',
        },
    });
}

/** area_id → name; empty map if the table can't be read. */
export async function getAreaNames(supabase: SupabaseClient): Promise<Map<number, string>> {
    const { data } = await supabase.from('areas').select('area_id, name');
    return new Map(((data || []) as { area_id: number; name: string }[]).map(a => [a.area_id, a.name]));
}

/** Today's date in IST (YYYY-MM-DD). */
export function todayIST(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}
