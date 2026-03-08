'use client'

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            setLoading(false);

            const { data: authListener } = supabase.auth.onAuthStateChange(
                (event, session) => {
                    setUser(session?.user || null);
                }
            );

            return () => {
                authListener.subscription.unsubscribe();
            };
        };

        fetchUser();
    }, [supabase.auth]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <nav className="fixed w-full z-50 glass-dark text-white p-4 transition-all duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#FF385C] rounded-lg rotate-3"></div>
                    RENTWISE<span className="text-[#FF385C]">.</span>
                </Link>
                <div className="md:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none hover:text-blue-400 transition" aria-label="Toggle Navigation">
                        {isOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
                            </svg>
                        )}
                    </button>
                </div>
                <ul className={`absolute top-full left-0 w-full bg-[#0A0A0A] md:bg-transparent md:static md:w-auto md:flex items-center space-y-4 md:space-y-0 md:space-x-8 text-sm font-semibold tracking-wide uppercase transition-all duration-300 ${isOpen ? 'block p-6 border-b border-gray-800' : 'hidden md:flex'}`}>
                    <li>
                        <Link href="/" className={pathname === '/' ? "text-white block" : "text-gray-400 hover:text-white transition-colors block"}>
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link href="/properties" className={pathname === '/properties' ? "text-white block" : "text-gray-400 hover:text-white transition-colors block"}>
                            Properties
                        </Link>
                    </li>

                    {!loading && user && user.user_metadata?.role === 'landlord' && (
                        <li>
                            <Link href="/dashboard" className={pathname === '/dashboard' ? "text-[#FF385C] block" : "text-gray-400 hover:text-[#FF385C] transition-colors block"}>
                                Dashboard
                            </Link>
                        </li>
                    )}

                    {!loading && user && user.user_metadata?.role === 'tenant' && (
                        <li>
                            <Link href="/dashboard" className={pathname === '/dashboard' ? "text-[#00A699] block" : "text-gray-400 hover:text-[#00A699] transition-colors block"}>
                                Dashboard
                            </Link>
                        </li>
                    )}

                    {!loading && user && (
                        <li>
                            <Link href="/messages" className={pathname === '/messages' ? "text-[#FF385C] block" : "text-gray-400 hover:text-white transition-colors block"}>
                                Messages
                            </Link>
                        </li>
                    )}

                    {!loading && (
                        user ? (
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-400 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-all duration-300 w-full md:w-auto text-left md:text-center"
                                >
                                    LOGOUT
                                </button>
                            </li>
                        ) : (
                            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center pl-4 md:border-l border-gray-800">
                                <li>
                                    <Link href="/login" className="block text-center text-gray-400 hover:text-white transition-colors">
                                        LOGIN
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/register" className="block text-center px-6 py-2.5 bg-[#FF385C] text-white rounded-lg hover:bg-[#D90B38] transition-all duration-300 font-bold uppercase tracking-widest text-xs">
                                        GET STARTED
                                    </Link>
                                </li>
                            </div>
                        )
                    )}
                </ul>
            </div>
        </nav>
    );
}
