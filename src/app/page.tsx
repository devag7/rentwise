import Link from 'next/link';
import { createPublicClient } from '@/utils/supabase/public';
import { getMarketStats, getActiveListingCount } from '@/utils/market';

export const revalidate = 1800;

export default async function Home() {
  const supabase = createPublicClient();
  const [stats, active] = await Promise.all([getMarketStats(supabase), getActiveListingCount(supabase)]);
  const markets = Object.keys(stats).length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#FF385C] selection:text-white">
      <section className="relative pt-36 pb-24 lg:pt-48 lg:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-3 px-3 py-1.5 border border-white/10 text-xs font-bold tracking-widest text-[#FF385C] uppercase mb-8">
              <span className="h-1.5 w-1.5 bg-[#FF385C] rounded-full" />
              Bangalore rent intelligence
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.05]">
              Stop guessing. <br />
              <span className="text-gray-500">KNOW what it&apos;s worth.</span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-10 leading-relaxed max-w-2xl font-light">
              Every Bangalore listing priced against real comparable listings in the same area and BHK — under market, at market, or over — with the comps count to prove it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/check" className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold tracking-widest uppercase bg-[#00A699] text-white hover:bg-white hover:text-black transition-colors">
                Is my rent fair?
              </Link>
              <Link href="/properties" className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold tracking-widest uppercase bg-white text-black hover:bg-[#FF385C] hover:text-white transition-colors">
                Browse flats
              </Link>
              <Link href="/insights" className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold tracking-widest uppercase border border-white/20 text-white hover:border-white transition-colors">
                Rent index
              </Link>
            </div>
            {active > 0 && (
              <p className="mt-10 text-xs font-mono text-gray-400 uppercase tracking-widest">
                {active.toLocaleString('en-IN')} live listings · {markets} area·BHK markets priced · refreshed twice daily
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 border-b border-gray-200 pb-8 max-w-2xl">
            <p className="text-sm font-bold tracking-widest text-[#FF385C] uppercase mb-4">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">Data, not broker talk.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-x-12 gap-y-12">
            <div>
              <p className="mb-4 font-mono text-[#FF385C] text-sm">01 / COMPS</p>
              <h3 className="text-2xl font-extrabold mb-3 tracking-tight">Median of real listings</h3>
              <p className="text-gray-600 leading-relaxed text-lg">We compare each flat with live listings of the same BHK in the same area. Fewer than 3 comparables? We say so instead of guessing.</p>
            </div>
            <div>
              <p className="mb-4 font-mono text-[#FF385C] text-sm">02 / HONEST DATA</p>
              <h3 className="text-2xl font-extrabold mb-3 tracking-tight">Nothing invented</h3>
              <p className="text-gray-600 leading-relaxed text-lg">Missing fields stay blank. Stale listings expire after two weeks. Anyone can flag a fake listing; three flags hide it.</p>
            </div>
            <div>
              <p className="mb-4 font-mono text-[#FF385C] text-sm">03 / NO LOGIN</p>
              <h3 className="text-2xl font-extrabold mb-3 tracking-tight">No data hostage</h3>
              <p className="text-gray-600 leading-relaxed text-lg">Browse, map, check rents and watch an area by email without an account. Owners can list directly, no brokerage.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#0A0A0A] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-6">Got a flat in mind?</h2>
          <p className="text-lg text-gray-300 mb-10 font-light max-w-2xl mx-auto">
            Paste the listing link or just type &ldquo;2BHK HSR 42k&rdquo; — get the market median, the comps behind it, and cheaper flats nearby.
          </p>
          <Link href="/check" className="inline-flex justify-center items-center px-12 py-5 text-sm font-bold uppercase tracking-widest bg-[#FF385C] text-white hover:bg-white hover:text-black transition-colors">
            Check a rent
          </Link>
        </div>
      </section>

      <footer className="bg-[#050505] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row gap-6 justify-between text-gray-400 font-mono text-xs">
          <p className="font-bold text-white tracking-widest">RENTWISE<span className="text-[#FF385C]">.</span></p>
          <nav className="flex flex-wrap gap-6 uppercase tracking-widest">
            <Link href="/insights" className="hover:text-white">Rent index</Link>
            <Link href="/data" className="hover:text-white">Open data</Link>
            <Link href="/register/landlord" className="hover:text-white">List your flat</Link>
            <a href="https://github.com/devag7/rentwise" className="hover:text-white">GitHub</a>
            <a href="mailto:rentwise@devshipit.com" className="hover:text-white">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
