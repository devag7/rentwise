/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />
/**
 * send-alerts — daily "new listings in your area" emails for area_watches.
 * Invoked by pg_cron (phase 16) with the service role key.
 *
 * Secrets: RESEND_API_KEY (if missing → {skipped}),
 *          SITE_URL (default https://rentwise.devshipit.com).
 *
 * For each active watch: active listings in its area (+ property_type, rent <= max_rent
 * when set) created after coalesce(last_notified_at, watch.created_at). Watches are
 * grouped by email → one email per address, up to 10 listings, one unsubscribe link
 * per watch. Emailed watches get last_notified_at = run start time.
 */
import { adminClient, requireServiceRole } from '../_shared/supabase.ts';
import { json } from '../_shared/cors.ts';

// RentWise sends from and receives at this one address only (inbound is
// forwarded by Cloudflare Email Routing).
const RENTWISE_EMAIL = 'rentwise@devshipit.com';
const MAX_EMAILS = 200;
const MAX_LISTINGS_PER_EMAIL = 10;
const RESEND_BATCH = 100; // Resend /emails/batch limit
// Tags alert clicks in page_view analytics (and Vercel Analytics).
const UTM = 'utm_source=alert&utm_medium=email';

interface Watch {
    id: number;
    email: string;
    area_id: number | null;
    property_type: string | null;
    max_rent: number | null;
    created_at: string;
    last_notified_at: string | null;
    unsubscribe_token: string;
}

interface Listing {
    property_id: number;
    address: string | null;
    rent: number;
    property_type: string | null;
    area_id: number;
    created_at: string;
}

const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

Deno.serve(async (req) => {
    const denied = requireServiceRole(req);
    if (denied) return denied;

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) return json({ skipped: 'no RESEND_API_KEY' });
    const from = `RentWise <${RENTWISE_EMAIL}>`;
    const site = (Deno.env.get('SITE_URL') || 'https://rentwise.devshipit.com').replace(/\/+$/, '');

    const runStartedAt = new Date().toISOString();
    const sb = adminClient();

    const [watchesRes, areasRes, statsRes] = await Promise.all([
        sb.from('area_watches')
            .select('id, email, area_id, property_type, max_rent, created_at, last_notified_at, unsubscribe_token')
            .eq('active', true)
            .not('area_id', 'is', null),
        sb.from('areas').select('area_id, name'),
        sb.from('market_stats').select('area_id, property_type, median'),
    ]);
    if (watchesRes.error) return json({ error: watchesRes.error.message }, 500);

    const areaName = new Map<number, string>();
    for (const a of (areasRes.data ?? []) as Array<{ area_id: number; name: string }>) areaName.set(a.area_id, a.name);
    const median = new Map<string, number>();
    for (const s of (statsRes.data ?? []) as Array<{ area_id: number; property_type: string; median: number }>) {
        median.set(`${s.area_id}|${s.property_type}`, s.median);
    }

    // Group watches by (normalised) email.
    const byEmail = new Map<string, Watch[]>();
    for (const w of (watchesRes.data ?? []) as Watch[]) {
        const key = w.email.trim().toLowerCase();
        const list = byEmail.get(key);
        if (list) list.push(w);
        else byEmail.set(key, [w]);
    }

    async function newListingsFor(w: Watch): Promise<Listing[]> {
        let q = sb.from('properties')
            .select('property_id, address, rent, property_type, area_id, created_at')
            .eq('is_active', true)
            .eq('area_id', w.area_id!)
            .gt('created_at', w.last_notified_at ?? w.created_at)
            .order('created_at', { ascending: false })
            .limit(MAX_LISTINGS_PER_EMAIL);
        if (w.property_type) q = q.eq('property_type', w.property_type);
        if (w.max_rent) q = q.lte('rent', w.max_rent);
        const { data, error } = await q;
        if (error) {
            console.warn(`[send-alerts] watch ${w.id}: ${error.message}`);
            return [];
        }
        return (data ?? []) as Listing[];
    }

    type Outgoing = { to: string; watchIds: number[]; payload: Record<string, unknown> };
    const outgoing: Outgoing[] = [];

    async function buildEmail(email: string, watches: Watch[]): Promise<Outgoing | null> {
        const results = await Promise.all(watches.map(async (w) => ({ w, listings: await newListingsFor(w) })));
        const matched = results.filter((r) => r.listings.length > 0);
        if (!matched.length) return null;

        const seen = new Set<number>();
        const listings = matched
            .flatMap((r) => r.listings)
            .filter((l) => (seen.has(l.property_id) ? false : (seen.add(l.property_id), true)))
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .slice(0, MAX_LISTINGS_PER_EMAIL);

        const rows = listings.map((l) => {
            const area = areaName.get(l.area_id) ?? '';
            const med = l.property_type ? median.get(`${l.area_id}|${l.property_type}`) : undefined;
            const price = med
                ? `${inr(l.rent)} <span style="color:#666">vs ${inr(med)} median</span>`
                : inr(l.rent);
            const title = [l.property_type, area].filter(Boolean).join(' · ');
            return `<tr><td style="padding:12px 0;border-bottom:1px solid #eee">
<a href="${site}/properties/${l.property_id}?${UTM}" style="color:#111;font-weight:600;text-decoration:none">${esc(title || 'New listing')}</a><br>
<span style="color:#444;font-size:14px">${esc(l.address ?? '')}</span><br>
<span style="font-size:15px">${price}</span></td></tr>`;
        }).join('\n');

        const unsubLinks = watches.map((w) => {
            const label = [w.property_type ?? 'All types', areaName.get(w.area_id!) ?? 'area'].join(' in ');
            return `<a href="${site}/unsubscribe?token=${encodeURIComponent(w.unsubscribe_token)}" style="color:#888">${esc(label)}</a>`;
        }).join(' · ');

        const areasInMail = [...new Set(listings.map((l) => areaName.get(l.area_id)).filter(Boolean))] as string[];
        const subject = `${listings.length} new rental${listings.length === 1 ? '' : 's'} in ${
            areasInMail.length === 1 ? areasInMail[0] : 'your watched areas'
        }`;

        const html = `<!doctype html><html><body style="margin:0;background:#fff;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<h1 style="font-size:20px;margin:0 0 4px">${esc(subject)}</h1>
<p style="color:#555;margin:0 0 16px;font-size:14px">New on RentWise since your last alert. Medians are from current active listings.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
<p style="margin:20px 0 0"><a href="${site}/properties?${UTM}" style="color:#111">Browse all listings →</a></p>
<p style="color:#888;font-size:12px;margin-top:32px;line-height:1.6">You're getting this because you watched these areas on RentWise.<br>Unsubscribe: ${unsubLinks}</p>
</div></body></html>`;

        const first = watches[0];
        return {
            to: email,
            watchIds: matched.map((r) => r.w.id),
            payload: {
                from,
                to: [first.email.trim()],
                reply_to: RENTWISE_EMAIL,
                subject,
                html,
                headers: {
                    'List-Unsubscribe': `<${site}/unsubscribe?token=${encodeURIComponent(first.unsubscribe_token)}>`,
                },
            },
        };
    }

    // Query in parallel groups of 10 addresses until MAX_EMAILS have matches.
    const groups = [...byEmail];
    for (let i = 0; i < groups.length && outgoing.length < MAX_EMAILS; i += 10) {
        const built = await Promise.all(groups.slice(i, i + 10).map(([email, ws]) => buildEmail(email, ws)));
        for (const b of built) if (b && outgoing.length < MAX_EMAILS) outgoing.push(b);
    }

    let sent = 0;
    const errors: string[] = [];
    const notifiedIds: number[] = [];
    for (let i = 0; i < outgoing.length; i += RESEND_BATCH) {
        const batch = outgoing.slice(i, i + RESEND_BATCH);
        try {
            const res = await fetch('https://api.resend.com/emails/batch', {
                method: 'POST',
                headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(batch.map((o) => o.payload)),
                signal: AbortSignal.timeout(30_000),
            });
            if (!res.ok) {
                errors.push(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
                continue;
            }
            await res.body?.cancel();
            sent += batch.length;
            for (const o of batch) notifiedIds.push(...o.watchIds);
        } catch (e) {
            errors.push((e as Error).message);
        }
    }

    for (let i = 0; i < notifiedIds.length; i += 200) {
        const { error } = await sb.from('area_watches')
            .update({ last_notified_at: runStartedAt })
            .in('id', notifiedIds.slice(i, i + 200));
        if (error) errors.push(`last_notified_at update failed: ${error.message}`);
    }

    const out = { watches: watchesRes.data?.length ?? 0, emails_sent: sent, watches_notified: notifiedIds.length, errors };
    console.log('[send-alerts]', JSON.stringify(out));
    return json(out, errors.length && !sent ? 502 : 200);
});
