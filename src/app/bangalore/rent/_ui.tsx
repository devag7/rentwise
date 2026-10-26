import Link from 'next/link';

/** JSON-LD script; escapes `<` so DB-sourced strings can't break out of the tag. */
export function JsonLd({ data }: { data: unknown }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
        />
    );
}

export interface Crumb {
    name: string;
    path: string;
}

export function breadcrumbJsonLd(baseUrl: string, crumbs: Crumb[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.name,
            item: `${baseUrl}${c.path}`,
        })),
    };
}

export interface Faq {
    q: string;
    a: string;
}

export function faqJsonLd(faqs: Faq[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
    };
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold tracking-widest uppercase text-gray-400">
                {crumbs.map((c, i) => (
                    <li key={c.path} className="flex items-center gap-2">
                        {i > 0 && <span aria-hidden className="text-gray-600">/</span>}
                        {i === crumbs.length - 1 ? (
                            <span aria-current="page" className="text-gray-300">{c.name}</span>
                        ) : (
                            <Link href={c.path} className="hover:text-white transition-colors">{c.name}</Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
    return <h2 className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-6">{children}</h2>;
}

export function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
    return (
        <div className="bg-[#111] border border-white/10 p-5 min-w-0">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">{label}</p>
            <p className={`text-2xl sm:text-3xl font-black tracking-tighter break-words ${accent ? 'text-[#00A699]' : 'text-white'}`}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
        </div>
    );
}

export function FaqSection({ faqs }: { faqs: Faq[] }) {
    if (faqs.length === 0) return null;
    return (
        <section className="mt-16" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-6">Questions, answered with the numbers above</h2>
            <div className="divide-y divide-white/10 border-y border-white/10">
                {faqs.map(f => (
                    <div key={f.q} className="py-5">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-2">{f.q}</h3>
                        <p className="text-gray-300 leading-relaxed">{f.a}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function CheckCta() {
    return (
        <section className="mt-16 border border-[#FF385C]/40 bg-[#FF385C]/5 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#FF385C] mb-2">Fair-rent checker</p>
                <p className="text-xl font-black tracking-tight text-white">Found a flat? Check if the rent is fair.</p>
                <p className="text-gray-400 text-sm mt-1">Paste a listing link or type “2BHK HSR 42k”. Real comparables, no estimates.</p>
            </div>
            <Link
                href="/check"
                className="shrink-0 inline-flex justify-center items-center px-8 py-4 text-sm font-bold tracking-widest uppercase bg-[#FF385C] text-white hover:bg-white hover:text-black transition-colors"
            >
                Check a rent
            </Link>
        </section>
    );
}
