import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-200">

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-b from-blue-600/30 to-purple-600/30 blur-3xl opacity-50 mix-blend-screen"></div>
          <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-t from-indigo-500/20 to-teal-400/20 blur-3xl opacity-50 mix-blend-screen"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-blue-200 mb-6 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-400"></span>
              AI-Powered Matchmaking
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              Find your perfect <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                rental in Bangalore
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl">
              RentWise combines smart analytics with premium listings to help you find a home that fits your lifestyle. No more endless scrolling. No more overpriced apartments.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/properties" className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-full bg-white text-gray-900 hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Explore Properties
              </Link>
              <Link href="/register" className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all duration-300 backdrop-blur-md">
                List as Landlord
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-3">Why RentWise?</h2>
            <h3 className="text-4xl font-extrabold text-gray-900">A Smarter Way to Rent</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-blue-100 hover:bg-blue-50/50 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-6 transform group-hover:-translate-y-2 transition-transform duration-500 shadow-lg shadow-blue-600/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-gray-900">Smart Price Analytics</h4>
              <p className="text-gray-600 leading-relaxed">
                Our algorithm analyzes thousands of data points to ensure you never overpay. Instantly see if a property is priced fairly for its area.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-purple-100 hover:bg-purple-50/50 hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white mb-6 transform group-hover:-translate-y-2 transition-transform duration-500 shadow-lg shadow-purple-600/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-gray-900">Verified Listings</h4>
              <p className="text-gray-600 leading-relaxed">
                Every property on RentWise goes through a rigorous verification process. What you see is exactly what you get.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-teal-100 hover:bg-teal-50/50 hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center text-white mb-6 transform group-hover:-translate-y-2 transition-transform duration-500 shadow-lg shadow-teal-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-2xl font-bold mb-4 text-gray-900">Direct Connections</h4>
              <p className="text-gray-600 leading-relaxed">
                Cut out the middleman. Connect directly with landlords to negotiate terms, schedule viewings, and close deals faster.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full blur-3xl opacity-50 z-0"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8">Ready to upgrade your living standard?</h2>
          <p className="text-xl text-gray-600 mb-10">
            Join thousands of users who have found their dream homes in Bangalore through RentWise.
          </p>
          <Link href="/register" className="inline-flex justify-center items-center px-10 py-4 text-lg font-bold rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:shadow-[0_10px_40px_-10px_rgba(37,99,235,0.7)] hover:-translate-y-1 transition-all duration-300">
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
          <p className="font-medium text-lg mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 inline-block font-extrabold tracking-tight">RentWise.</p>
          <p>&copy; {new Date().getFullYear()} RentWise Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
