'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { track } from '@/utils/analytics';

export default function LoginLandlord() {
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
        const loadingToast = toast.loading('Signing in…');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.status === 429) {
                    throw new Error('Too many login attempts. Please wait a few minutes.');
                }
                if (error.message === 'Invalid login credentials') {
                    throw new Error('Incorrect email or password.');
                }
                throw error;
            }

            router.refresh();

            track('login', { role: 'landlord' });
            toast.success('Welcome back.', { id: loadingToast });
            router.push('/dashboard');

        } catch (err: unknown) {
            const msg = (err as Error).message || 'Could not sign in. Try again.';
            toast.error(msg, { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-dvh bg-surface-2 pb-20 pt-28 sm:pt-32">
            <div className="mx-auto w-full max-w-sm px-5">
                <Link href="/login" className="link text-callout">‹ All accounts</Link>

                <div className="card mt-4 p-7 sm:p-8">
                    <h1 className="text-title-2">Sign in as a landlord</h1>
                    <p className="mt-2 text-callout text-label-2">Manage your listings and the applications they get.</p>

                    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                        <div>
                            <label htmlFor="email" className="field-label">Email</label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="field"
                                required
                                disabled={isLoading}
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="field-label">Password</label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="field"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading}>
                            {isLoading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                </div>

                <div className="mt-6 space-y-2 text-center text-callout text-label-2">
                    <p>
                        New to RentWise?{' '}
                        <Link href="/register/landlord" className="link">Create an account</Link>
                    </p>
                    <p>
                        Renting?{' '}
                        <Link href="/login/tenant" className="link">Sign in as a tenant</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
