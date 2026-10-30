export const metadata = { title: 'Sign up — tenants & landlords', alternates: { canonical: '/register' } };
import Link from 'next/link';

export default function RegisterHub() {
    return (
        <div className="min-h-dvh bg-surface-2 pb-20 pt-28 sm:pt-32">
            <div className="mx-auto w-full max-w-2xl px-5 sm:px-6">
                <div className="text-center">
                    <h1 className="text-title-1 text-balance">Create your account</h1>
                    <p className="mt-3 text-lead text-label-2 text-balance">It&apos;s free. Tell us how you&apos;ll use RentWise.</p>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    <Link href="/register/tenant" className="card pressable flex flex-col p-7">
                        <span className="text-title-3">I&apos;m renting</span>
                        <span className="mt-2 text-callout text-label-2">Save flats, get rent alerts and apply to listings.</span>
                        <span className="link link-chevron mt-6 text-callout">Sign up as a tenant</span>
                    </Link>
                    <Link href="/register/landlord" className="card pressable flex flex-col p-7">
                        <span className="text-title-3">I own a flat</span>
                        <span className="mt-2 text-callout text-label-2">List your flat, see how it compares and review applications.</span>
                        <span className="link link-chevron mt-6 text-callout">Sign up as a landlord</span>
                    </Link>
                </div>

                <p className="mt-10 text-center text-callout text-label-2">
                    Already have an account?{' '}
                    <Link href="/login" className="link link-chevron">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
