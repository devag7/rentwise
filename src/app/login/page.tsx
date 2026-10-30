export const metadata = { title: 'Log in', alternates: { canonical: '/login' } };
import Link from 'next/link';

export default function LoginHub() {
    return (
        <div className="min-h-dvh bg-surface-2 pb-20 pt-28 sm:pt-32">
            <div className="mx-auto w-full max-w-2xl px-5 sm:px-6">
                <div className="text-center">
                    <h1 className="text-title-1 text-balance">Sign in to RentWise</h1>
                    <p className="mt-3 text-lead text-label-2 text-balance">Choose the account you use.</p>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    <Link href="/login/tenant" className="card pressable flex flex-col p-7">
                        <span className="text-title-3">I&apos;m renting</span>
                        <span className="mt-2 text-callout text-label-2">Your saved flats, rent alerts and applications.</span>
                        <span className="link link-chevron mt-6 text-callout">Sign in as a tenant</span>
                    </Link>
                    <Link href="/login/landlord" className="card pressable flex flex-col p-7">
                        <span className="text-title-3">I own a flat</span>
                        <span className="mt-2 text-callout text-label-2">Your listings, applications from tenants and messages.</span>
                        <span className="link link-chevron mt-6 text-callout">Sign in as a landlord</span>
                    </Link>
                </div>

                <p className="mt-10 text-center text-callout text-label-2">
                    New to RentWise?{' '}
                    <Link href="/register" className="link link-chevron">Create an account</Link>
                </p>
            </div>
        </div>
    );
}
