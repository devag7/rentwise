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
        <nav className="fixed w-full z-50 glass-dark text-white p-4 shadow-xl transition-all duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                    RentWise
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
                <ul className={`absolute top-full left-0 w-full bg-gray-900 md:bg-transparent md:static md:w-auto md:flex items-center space-y-4 md:space-y-0 md:space-x-8 text-lg font-medium transition-all duration-300 ${isOpen ? 'block p-6 border-b border-gray-700 shadow-2xl' : 'hidden md:flex'}`}>
                    <li>
                        <Link href="/" className={pathname === '/' ? "text-blue-400 block" : "hover:text-blue-400 transition block"}>
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link href="/properties" className={pathname === '/properties' ? "text-blue-400 block" : "hover:text-blue-400 transition block"}>
                            Properties
                        </Link>
                    </li>

                    {!loading && user && user.user_metadata?.role === 'landlord' && (
                        <li>
                            <Link href="/dashboard" className={pathname === '/dashboard' ? "text-blue-400 block" : "hover:text-blue-400 transition block"}>
                                Dashboard
                            </Link>
                        </li>
                    )}

                    {!loading && (
                        user ? (
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white px-6 py-2 rounded-full transition-all duration-300 w-full md:w-auto"
                                >
                                    Logout
                                </button>
                            </li>
                        ) : (
                            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                                <li>
                                    <Link href="/login" className="block text-center px-6 py-2 border border-gray-600 rounded-full hover:border-gray-400 hover:bg-gray-800 transition-all duration-300">
                                        Login
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/register" className="block text-center px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5">
                                        Register
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
