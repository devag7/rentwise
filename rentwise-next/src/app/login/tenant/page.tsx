'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

export default function LoginTenant() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                if (session.user.user_metadata?.role === 'landlord') {
                    router.push('/dashboard');
                } else {
                    router.push('/properties');
                }
            }
        };
        checkUser();
    }, [router, supabase.auth]);
    

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const loadingToast = toast.loading('Authenticating...');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.refresh();

            toast.success('Welcome back.', { id: loadingToast });
            router.push('/properties');

        } catch (err: unknown) {
            toast.error(((err as Error).message || 'Invalid credentials'), { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A] text-white pt-20 selection:bg-[#00A699] selection:text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#00A699]/5 blur-[120px] pointer-events-none rounded-full" />
            
            <div className="w-full max-w-sm bg-[#111] rounded-none p-10 border border-white/10 relative z-10 shadow-2xl">
                <div className="mb-6 flex justify-start">
                    <Link href="/login" className="text-gray-500 hover:text-white text-[10px] tracking-widest uppercase font-bold flex items-center transition-colors">
                        ← Back to Selector
                    </Link>
                </div>

                <h2 className="text-sm font-bold tracking-widest text-[#00A699] uppercase mb-8 flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#00A699] rounded-full animate-pulse"></span>
                    Tenant Access
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        
                        <div className="relative">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#00A699] transition-colors placeholder-gray-700 font-mono text-sm"
                                required
                                disabled={isLoading}
                                placeholder="tenant@rentwise.com"
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
                                placeholder="••••••••"
                                
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-[#00A699] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="animate-pulse">Authenticating...</span>
                        ) : (
                            "Initialize Session"
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-left text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                        Unregistered Agent?
                        <Link href="/register/tenant" className="text-white hover:text-[#00A699] ml-2 transition-colors">
                            Request Credentials
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
