import { ImageResponse } from 'next/og';

/**
 * Link-preview cards (WhatsApp, X, Slack). One layout for every page so
 * shared links look the same. Every number passed in must be real data —
 * callers show "not enough comps" text rather than a guessed figure.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const BRAND = '#FF385C';
const TEAL = '#00A699';

export interface OgCardProps {
    /** Small label above the title, e.g. "BANGALORE RENT INDEX". */
    eyebrow: string;
    title: string;
    /** Headline figure, e.g. "₹42,000". */
    big?: string;
    /** Line under the figure, e.g. "median asking rent · 18 live listings". */
    sub?: string;
    /** Side-by-side figures, e.g. one column per BHK. */
    columns?: Array<{ label: string; value: string }>;
    /** Coloured pill, e.g. "12% OVER MARKET". */
    badge?: { text: string; tone: 'good' | 'bad' | 'neutral' };
}

export function ogCard({ eyebrow, title, big, sub, columns, badge }: OgCardProps): ImageResponse {
    const badgeColor = badge?.tone === 'good' ? TEAL : badge?.tone === 'bad' ? BRAND : '#9CA3AF';
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', background: '#0A0A0A', color: '#fff',
                    padding: '64px 72px', fontFamily: 'sans-serif',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', fontSize: 26, letterSpacing: 4, color: TEAL, fontWeight: 700 }}>
                        {eyebrow.toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', fontSize: title.length > 40 ? 56 : 68, fontWeight: 800, marginTop: 20, lineHeight: 1.1, letterSpacing: -2 }}>
                        {title}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {badge && (
                        <div style={{ display: 'flex' }}>
                            <div style={{
                                display: 'flex', fontSize: 30, fontWeight: 800, color: '#0A0A0A',
                                background: badgeColor, padding: '8px 22px', borderRadius: 999, marginBottom: 20,
                            }}>
                                {badge.text}
                            </div>
                        </div>
                    )}
                    {big && <div style={{ display: 'flex', fontSize: big.length > 30 ? 52 : big.length > 14 ? 76 : 110, fontWeight: 900, letterSpacing: big.length > 14 ? -1 : -4, lineHeight: 1 }}>{big}</div>}
                    {columns && columns.length > 0 && (
                        <div style={{ display: 'flex', gap: 64 }}>
                            {columns.map((c) => (
                                <div key={c.label} style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', fontSize: 28, color: '#9CA3AF', letterSpacing: 2 }}>{c.label}</div>
                                    <div style={{ display: 'flex', fontSize: 72, fontWeight: 900, letterSpacing: -2, lineHeight: 1.1 }}>{c.value}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {sub && <div style={{ display: 'flex', fontSize: 32, color: '#D1D5DB', marginTop: 16 }}>{sub}</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26, color: '#9CA3AF' }}>
                    <div style={{ display: 'flex', fontWeight: 800, color: '#fff', letterSpacing: 3 }}>
                        RENTWISE<span style={{ color: BRAND }}>.</span>
                    </div>
                    <div style={{ display: 'flex' }}>rentwise.devshipit.com · real listings, no estimates</div>
                </div>
            </div>
        ),
        OG_SIZE,
    );
}
