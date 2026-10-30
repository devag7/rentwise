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
        <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-footnote text-label-2">
                {crumbs.map((c, i) => (
                    <li key={c.path} className="flex items-center gap-1.5">
                        {i > 0 && <span aria-hidden className="text-label-3">›</span>}
                        {i === crumbs.length - 1 ? (
                            <span aria-current="page" className="text-label">{c.name}</span>
                        ) : (
                            <Link href={c.path} className="hover:text-label hover:underline underline-offset-2">{c.name}</Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
    return <h2 className="text-title-2 mb-5">{children}</h2>;
}

export function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
    return (
        <div className="card min-w-0 p-5">
            <p className="text-footnote text-label-2">{label}</p>
            <p className={`mt-1 text-title-2 num break-words ${accent ? 'text-accent' : ''}`}>{value}</p>
            {sub && <p className="mt-1 text-caption text-label-2">{sub}</p>}
        </div>
    );
}

export function FaqSection({ faqs }: { faqs: Faq[] }) {
    if (faqs.length === 0) return null;
    return (
        <section className="mt-16" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-title-2 mb-5">Questions, answered with the numbers above</h2>
            <div className="card divide-y divide-separator overflow-hidden">
                {faqs.map(f => (
                    <details key={f.q} className="group px-5 py-4 sm:px-6 [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-headline">
                            {f.q}
                            <span aria-hidden className="text-label-3 transition-transform duration-200 group-open:rotate-90">›</span>
                        </summary>
                        <p className="mt-2 text-label-2">{f.a}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}

export function CheckCta() {
    return (
        <section className="mt-16 rounded-[var(--radius-panel)] bg-surface-2 p-7 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
                <p className="text-title-3">Found a flat? Check if the rent is fair.</p>
                <p className="mt-1 text-callout text-label-2">Paste a listing link or type “2BHK HSR 42k”. Real comparables, no estimates.</p>
            </div>
            <Link href="/check" className="btn btn-primary shrink-0">Check a rent</Link>
        </section>
    );
}
