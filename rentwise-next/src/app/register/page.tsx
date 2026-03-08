'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('tenant');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Create user via Supabase Auth with custom user_metadata for role and username
            const { data, error: signUpError } = await supabase.auth.signUp({
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

            alert('✅ Registration Successful! You can now log in.');
            router.push('/login');
        } catch (err: any) {
            setError('❌ Registration Failed: ' + (err.message || 'Something went wrong'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#121212] text-white pt-20">
            <div className="relative w-full max-w-md bg-[#1E1E1E] bg-opacity-80 backdrop-blur-md rounded-2xl shadow-2xl p-10 border border-gray-800">

                {/* Glowing Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-3xl rounded-2xl -z-10"></div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-8">Join RentWise 🎉</h2>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleRegister} className="space-y-4 relative z-10">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-5 py-3.5 text-white bg-[#252525] border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder-gray-500"
                        required
                        disabled={isLoading}
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-3.5 text-white bg-[#252525] border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder-gray-500"
                        required
                        disabled={isLoading}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-5 py-3.5 text-white bg-[#252525] border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder-gray-500"
                        required
                        disabled={isLoading}
                        minLength={6}
                    />

                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-400 mb-2">I am registering as a:</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-5 py-3.5 text-white bg-[#252525] border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all cursor-pointer"
                            disabled={isLoading}
                        >
                            <option value="tenant">Tenant (Looking to rent)</option>
                            <option value="landlord">Landlord (Listing properties)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Account...
                            </div>
                        ) : "Create Account"}
                    </button>
                </form>

                {/* Login Redirect */}
                <p className="text-center text-gray-400 mt-8 text-sm">
                    Already have an account?
                    <Link href="/login" className="text-purple-400 hover:text-purple-300 hover:underline ml-1 font-medium transition-colors">
                        Log in existing
                    </Link>
                </p>
            </div>
        </div>
    );
}
