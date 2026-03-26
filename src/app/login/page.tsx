
import Link from 'next/link';

export default function LoginHub() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A] text-white pt-20 selection:bg-[#00A699] selection:text-white">
            <div className="w-full max-w-2xl bg-[#111] rounded-none p-10 md:p-16 border border-white/10 text-center">
                <h2 className="text-3xl font-black tracking-tighter text-white uppercase mb-4 flex flex-col items-center gap-3">
                    <span className="w-3 h-3 bg-[#00A699] rounded-full animate-pulse shadow-[0_0_15px_#00A699]"></span>
                    Authenticate Session
                </h2>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-12 border-b border-white/10 pb-6">Select your operational clearance level</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/login/tenant" className="group relative block p-8 border border-white/10 hover:border-[#00A699] bg-black/50 hover:bg-[#00A699]/5 transition-all duration-500">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#00A699] scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-widest uppercase">Tenant</h3>
                        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Access Saved Coordinates & Applications</p>
                    </Link>

                    <Link href="/login/landlord" className="group relative block p-8 border border-white/10 hover:border-[#FF385C] bg-black/50 hover:bg-[#FF385C]/5 transition-all duration-500">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#FF385C] scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-widest uppercase">Landlord</h3>
                        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Manage Listings & Analytics Metrics</p>
                    </Link>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10">
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                        Unregistered Agent?
                        <Link href="/register" className="text-white hover:text-[#00A699] ml-2 transition-colors">
                            Request Credentials
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
