
import Link from 'next/link';

export default function RegisterHub() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A] text-white pt-20 selection:bg-[#00A699] selection:text-white">
            <div className="w-full max-w-2xl bg-[#111] rounded-none p-10 md:p-16 border border-white/10 text-center">
                <h2 className="text-3xl font-black tracking-tighter text-white uppercase mb-4 flex flex-col items-center gap-3">
                    <span className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_15px_#ffffff]"></span>
                    Initialize Registry
                </h2>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-12 border-b border-white/10 pb-6">Establish new operational clearance</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/register/tenant" className="group relative block p-8 border border-white/10 hover:border-[#00A699] bg-black/50 hover:bg-[#00A699]/5 transition-all duration-500">
                        <div className="absolute top-0 left-0 w-file h-full bg-[#00A699] scale-x-0 group-hover:scale-x-100 transition-transform origin-left opacity-10"></div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-widest uppercase">Register as Tenant</h3>
                        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Seek & Apply to Premium Properties</p>
                    </Link>

                    <Link href="/register/landlord" className="group relative block p-8 border border-white/10 hover:border-[#FF385C] bg-black/50 hover:bg-[#FF385C]/5 transition-all duration-500">
                        <div className="absolute top-0 left-0 w-full h-full bg-[#FF385C] scale-x-0 group-hover:scale-x-100 transition-transform origin-left opacity-10"></div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-widest uppercase">Register as Landlord</h3>
                        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Publish Leads & Review Applications</p>
                    </Link>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10">
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                        Existing Agent?
                        <Link href="/login" className="text-white hover:text-[#00A699] ml-2 transition-colors">
                            Authenticate
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
