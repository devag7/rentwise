'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('tenant');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const loadingToast = toast.loading('Initializing Account...');

        try {
            // Create user via Supabase Auth with custom user_metadata for role and username
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username,
                        role: role
                    }
                }
            });

            if (signUpError) throw signUpError;

            toast.success('Registration successful.', { id: loadingToast });
            router.push('/login');
        } catch (err: unknown) {
            toast.error(((err as Error).message || 'Something went wrong'), { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A] text-white pt-20 selection:bg-[#00A699] selection:text-white">
            <div className="w-full max-w-sm bg-[#111] rounded-none p-10 border border-white/10">

                {/* Title */}
                <h2 className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-8 flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#00A699] rounded-full animate-pulse"></span>
                    Create Agent File
                </h2>

                {/* Registration Form */}
                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-5">
                        <div className="relative">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Registry Name</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm"
                                required
                                disabled={isLoading}
                                placeholder="J. Doe"
                            />
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Comm Link (Email)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm"
                                required
                                disabled={isLoading}
                                placeholder="agent@rentwise.com"
                            />
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Security Key</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm"
                                required
                                disabled={isLoading}
                                minLength={6}
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-2 relative">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Clearance Level</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-3 text-white bg-[#111] border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors font-mono text-sm cursor-pointer appearance-none"
                                disabled={isLoading}
                            >
                                <option value="tenant">Tenant (Seeker)</option>
                                <option value="landlord">Landlord (Provider)</option>
                            </select>
                            {/* Custom select arrow since appearance-none removes default */}
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 top-6">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-[#00A699] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="animate-pulse">Constructing...</span>
                        ) : "Initialize Record"}
                    </button>
                </form>

                {/* Login Redirect */}
                <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-left text-gray-500 text-[10px] uppercase font-bold tracking-widest">
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
