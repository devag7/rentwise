'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { track } from '@/utils/analytics';

export default function RegisterLandlord() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const loadingToast = toast.loading('Creating your account…');

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username,
                        role: 'landlord'
                    }
                }
            });

            if (error) {
                if (error.status === 429) {
                    throw new Error('Too many attempts. Please wait a few minutes and try again.');
                }
                throw error;
            }

            if (data?.user?.identities?.length === 0) {
                toast.error('An account with this email already exists.', { id: loadingToast });
            } else {
                track('signup', { role: 'landlord' });
                toast.success('Account created. Check your email to confirm it, then sign in.', { id: loadingToast });
                router.push('/login/landlord');
            }

        } catch (err: unknown) {
            const msg = (err as Error).message || 'Something went wrong';
            toast.error(msg, { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-dvh bg-surface-2 pb-20 pt-28 sm:pt-32">
            <div className="mx-auto w-full max-w-sm px-5">
                <Link href="/register" className="link text-callout">‹ All accounts</Link>

                <div className="card mt-4 p-7 sm:p-8">
                    <h1 className="text-title-2">Create a landlord account</h1>
                    <p className="mt-2 text-callout text-label-2">List your flat and see how its rent compares to the market.</p>

                    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                        <div>
                            <label htmlFor="username" className="field-label">Name</label>
                            <input
                                id="username"
                                type="text"
                                autoComplete="name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="field"
                                required
                                disabled={isLoading}
                            />
                        </div>
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
                                autoComplete="new-password"
                                aria-describedby="password-hint"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="field"
                                required
                                disabled={isLoading}
                                minLength={6}
                            />
                            <p id="password-hint" className="mt-1.5 text-footnote text-label-2">At least 6 characters.</p>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading}>
                            {isLoading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>
                </div>

                <div className="mt-6 space-y-2 text-center text-callout text-label-2">
                    <p>
                        Already have an account?{' '}
                        <Link href="/login/landlord" className="link">Sign in</Link>
                    </p>
                    <p>
                        Renting?{' '}
                        <Link href="/register/tenant" className="link">Sign up as a tenant</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
