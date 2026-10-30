import Link from 'next/link';
import { createPublicClient } from '@/utils/supabase/public';
import { getMarketStats, getActiveListingCount, marketKey, areaSlug, formatINR, MIN_COMPS } from '@/utils/market';
import { getAreas } from '@/utils/listings';
import Container from '@/components/ui/Container';
import Reveal from '@/components/ui/Reveal';
import MarketBar from '@/components/ui/MarketBar';

export const revalidate = 1800;

const PRINCIPLES = [
  {
    title: 'Real comparables',
    body: 'Each flat is compared with live listings of the same size in the same area. With fewer than three, we say so instead of guessing.',
  },
  {
    title: 'Nothing invented',
    body: 'Missing details stay blank. Listings expire after two weeks unseen. Three reports from renters hide a listing.',
  },
  {
    title: 'No login to browse',
    body: 'Search, map, check a rent and get area alerts without an account. Owners list directly — no brokerage.',
  },
];

export default async function Home() {
  const supabase = createPublicClient();
  const [stats, active, areas] = await Promise.all([
    getMarketStats(supabase),
    getActiveListingCount(supabase),
    getAreas(supabase),
  ]);
  const markets = Object.values(stats).filter(s => s.count >= MIN_COMPS).length;

  // Live 2BHK medians, busiest markets first. Real numbers only.
  const twoBhk = areas
    .map(a => ({ ...a, stat: stats[marketKey(a.area_id, '2BHK')] }))
    .filter(a => a.stat && a.stat.count >= MIN_COMPS && areaSlug(a.name))
    .sort((a, b) => b.stat!.count - a.stat!.count);
  const featured = twoBhk[0];
  const list = twoBhk.slice(0, 6).sort((a, b) => b.stat!.median - a.stat!.median);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 text-center">
        <Container>
          <p className="text-eyebrow mb-4">Bangalore rent index</p>
          <h1 className="text-display mx-auto max-w-4xl text-balance">
            Know what a flat is really worth.
          </h1>
          <p className="text-lead mx-auto mt-6 max-w-2xl text-label-2 text-balance">
            Every listing is priced against real flats of the same size in the same area — under market, at market or over, with the numbers to show for it.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link href="/check" className="btn btn-primary btn-lg">Is my rent fair?</Link>
            <Link href="/properties" className="link link-chevron text-[1.0625rem]">Browse flats</Link>
          </div>
          {active > 0 && (
            <p className="mt-10 text-footnote text-label-2 num">
              {active.toLocaleString('en-IN')} live listings · {markets} markets with enough data · updated daily
            </p>
          )}
        </Container>
      </section>

      {/* Signature: a real market, drawn */}
      {featured?.stat && (
        <section className="pb-24 sm:pb-32">
          <Container>
            <Reveal className="card mx-auto max-w-3xl p-6 sm:p-10">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-title-3">2BHK in {featured.name}</h2>
                <p className="text-footnote text-label-2 num">{featured.stat.count} live listings</p>
              </div>
              <p className="mt-1 text-callout text-label-2">
                Half of these flats ask less than <span className="font-semibold text-label num">{formatINR(featured.stat.median)}</span> a month.
              </p>
              <MarketBar
                className="mt-8"
                median={featured.stat.median}
                p25={featured.stat.p25}
                p75={featured.stat.p75}
                count={featured.stat.count}
              />
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-separator pt-6">
                <p className="text-callout text-label-2">The dark band is the typical range; the line is the median.</p>
                <Link href={`/bangalore/rent/${areaSlug(featured.name)}/2bhk`} className="link link-chevron text-callout">See this market</Link>
              </div>
            </Reveal>
          </Container>
        </section>
      )}

      {/* How it works */}
      <section className="bg-surface-2 py-24 sm:py-32">
        <Container>
          <Reveal>
            <h2 className="text-title-1 max-w-2xl">Data, not broker talk.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 70} className="card p-7">
                <h3 className="text-title-3">{p.title}</h3>
                <p className="mt-3 text-label-2">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Live medians */}
      {list.length > 0 && (
        <section className="py-24 sm:py-32">
          <Container>
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-title-1">2BHK rent today.</h2>
                <p className="mt-3 text-lead text-label-2">Median asking rent in the busiest areas.</p>
              </div>
              <Link href="/bangalore/rent" className="link link-chevron">All areas</Link>
            </Reveal>
            <Reveal delay={80} className="card mt-10 overflow-hidden">
              <ul className="divide-y divide-separator">
                {list.map(a => (
                  <li key={a.area_id}>
                    <Link
                      href={`/bangalore/rent/${areaSlug(a.name)}/2bhk`}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-fill sm:px-7"
                    >
                      <span className="text-headline">{a.name}</span>
                      <span className="flex items-baseline gap-3">
                        <span className="hidden text-footnote text-label-2 num sm:inline">{a.stat!.count} listings</span>
                        <span className="text-headline num">{formatINR(a.stat!.median)}</span>
                        <span aria-hidden className="link-chevron text-label-3" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </Container>
        </section>
      )}

      {/* Closing CTA */}
      <section className="bg-surface-2 py-24 text-center sm:py-32">
        <Container narrow>
          <Reveal>
            <h2 className="text-title-1 text-balance">Got a flat in mind?</h2>
            <p className="mt-4 text-lead text-label-2 text-balance">
              Paste the listing link or type “2BHK HSR 42k”. See the market median, the comparables behind it and cheaper flats nearby.
            </p>
            <Link href="/check" className="btn btn-primary btn-lg mt-10">Check a rent</Link>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
