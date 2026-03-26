import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#FF385C] selection:text-white">

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 lg:pt-56 lg:pb-48 overflow-hidden">

        {/* Abstract Architectural Background Hint */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute right-0 top-0 w-1/2 h-full border-l border-white/10 skew-x-12 translate-x-32"></div>
          <div className="absolute left-1/4 bottom-0 w-px h-1/2 bg-white/10"></div>
          <div className="absolute right-1/4 top-1/4 w-32 h-32 rounded-full border border-[#FF385C]/30 blur-sm"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 px-3 py-1.5 border border-white/10 text-xs font-bold tracking-widest text-[#FF385C] uppercase mb-8 backdrop-blur-sm">
              <span className="flex h-1.5 w-1.5 bg-[#FF385C] rounded-full animate-pulse"></span>
              Proprietary Pricing Model 2.0
            </div>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1] text-white">
              Stop guessing. <br />
              <span className="text-gray-500">KNOW what it's worth.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-400 mb-12 leading-relaxed max-w-2xl font-light">
              RentWise uses billions of data points to evaluate properties in Bangalore. Find underpriced luxury and verified inventory instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/properties" className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold tracking-widest uppercase bg-white text-black hover:bg-[#FF385C] hover:text-white transition-all duration-300">
                Browse Collection
              </Link>
              <Link href="/register" className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold tracking-widest uppercase border border-white/20 text-white hover:border-white transition-all duration-300 backdrop-blur-md">
                Landlord Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-32 bg-white text-black relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-200 pb-8">
            <div className="max-w-2xl">
              <h2 className="text-sm font-bold tracking-widest text-[#FF385C] uppercase mb-4">The Advantage</h2>
              <h3 className="text-5xl font-black tracking-tighter text-black">Data-Driven Rentals.</h3>
            </div>
            <p className="text-gray-500 max-w-sm text-lg font-light">We strip away the marketing fluff to show you raw metrics and verified assets.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-x-12 gap-y-16">
            {/* Feature 1 */}
            <div className="group">
              <div className="mb-6 font-mono text-[#FF385C] text-sm">01 / ANALYTICS</div>
              <h4 className="text-2xl font-extrabold mb-4 tracking-tight">Algorithmic Valuation</h4>
              <p className="text-gray-600 leading-relaxed font-light text-lg">
                Our model cross-references square footage, exact latitude/longitude, and current market velocity to determine the exact fair value of every listing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="mb-6 font-mono text-gray-400 text-sm">02 / VERIFICATION</div>
              <h4 className="text-2xl font-extrabold mb-4 tracking-tight">Zero Tolerance</h4>
              <p className="text-gray-600 leading-relaxed font-light text-lg">
                Fake photos and bait-and-switch tactics are eliminated. What you see on the platform matches reality, guaranteed by our strict intake protocol.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="mb-6 font-mono text-gray-400 text-sm">03 / TRANSACT</div>
              <h4 className="text-2xl font-extrabold mb-4 tracking-tight">Peer-to-Peer</h4>
              <p className="text-gray-600 leading-relaxed font-light text-lg">
                We connect high-intent renters directly with asset owners. No brokers. No hidden fees. Just efficient, transparent communication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-[#0A0A0A] border-t border-white/10 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8">Ready to move?</h2>
          <p className="text-xl text-gray-400 mb-12 font-light max-w-2xl mx-auto">
            Join the elite network of renters and landlords who demand transparency and speed in the Bangalore market.
          </p>
          <Link href="/register" className="inline-flex justify-center items-center px-12 py-5 text-sm font-bold uppercase tracking-widest bg-[#FF385C] text-white hover:bg-white hover:text-black transition-all duration-300">
            Initialize Access
          </Link>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-[#050505] py-16">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 font-mono text-sm">
          <p className="font-bold text-white mb-4 tracking-widest">RENTWISE<span className="text-[#FF385C]">.</span></p>
          <p>&copy; {new Date().getFullYear()} RENTWISE TECHNOLOGIES. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
