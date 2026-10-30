'use client'

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

const LINKS = [
    { href: '/properties', label: 'Flats' },
    { href: '/insights', label: 'Rent index' },
    { href: '/bangalore/rent', label: 'Areas' },
    { href: '/data', label: 'Open data' },
];

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
            setLoading(false);
        });
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });
        return () => authListener.subscription.unsubscribe();
    }, []);

    // Scroll edge: the bar gets its hairline only once content scrolls under it.
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close the menu on navigation and on Escape.
    const [lastPath, setLastPath] = useState(pathname);
    if (pathname !== lastPath) {
        setLastPath(pathname);
        setIsOpen(false);
    }
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
    };

    const role = user?.user_metadata?.role as string | undefined;
    const isActive = (href: string) => pathname === href || (href !== '/' && pathname?.startsWith(`${href}/`));
    const linkCls = (href: string) =>
        `rounded-full px-3 py-1.5 text-footnote transition-colors ${isActive(href) ? 'text-label font-semibold' : 'text-label-2 hover:text-label'}`;

    const mobileCls = (href: string) =>
        `py-3 text-title-3 ${isActive(href) ? 'text-label' : 'text-label-2'}`;

    const accountLinks = (mobile: boolean) => {
        const cls = mobile ? mobileCls : linkCls;
        if (loading) return null;
        if (!user) return <Link href="/login" className={cls('/login')}>Sign in</Link>;
        return (
            <>
                {(role === 'landlord' || role === 'tenant') && (
                    <Link href="/dashboard" className={cls('/dashboard')} aria-current={isActive('/dashboard') ? 'page' : undefined}>Dashboard</Link>
                )}
                <Link href="/messages" className={cls('/messages')} aria-current={isActive('/messages') ? 'page' : undefined}>Messages</Link>
                <button onClick={handleLogout} className={`text-left ${cls('/__signout')}`}>Sign out</button>
            </>
        );
    };

    return (
        <header
            className={`material fixed inset-x-0 top-0 z-50 transition-[box-shadow] duration-200 ${scrolled || isOpen ? 'shadow-[0_1px_0_var(--material-border)]' : ''}`}
        >
            <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-6">
                <Link href="/" className="flex items-center gap-2 text-[1.0625rem] font-semibold tracking-[-0.02em] text-label" aria-label="RentWise home">
                    <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" className="text-accent">
                        <path fill="currentColor" d="M12 2.5 2.5 10v11.5h7v-7h5v7h7V10z" opacity=".18" />
                        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M3.5 10.5 12 3.5l8.5 7V20.5h-6v-6.5h-5v6.5h-6z" />
                    </svg>
                    RentWise
                </Link>

                <div className="hidden items-center gap-1 md:flex">
                    {LINKS.map(l => (
                        <Link key={l.href} href={l.href} className={linkCls(l.href)} aria-current={isActive(l.href) ? 'page' : undefined}>
                            {l.label}
                        </Link>
                    ))}
                    <span aria-hidden className="mx-2 h-4 w-px bg-separator" />
                    {accountLinks(false)}
                    <Link href="/check" className="btn btn-primary btn-sm ml-2">Check a rent</Link>
                </div>

                <div className="flex items-center gap-2 md:hidden">
                    <Link href="/check" className="btn btn-primary btn-sm">Check rent</Link>
                    <button
                        onClick={() => setIsOpen(o => !o)}
                        className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-label"
                        aria-label={isOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={isOpen}
                        aria-controls="mobile-menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
                            <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="origin-center transition-transform duration-200" style={{ transitionTimingFunction: 'var(--ease-out)' }}>
                                <line x1="3" x2="17" y1={isOpen ? 10 : 7} y2={isOpen ? 10 : 7} transform={isOpen ? 'rotate(45 10 10)' : undefined} />
                                <line x1="3" x2="17" y1={isOpen ? 10 : 13} y2={isOpen ? 10 : 13} transform={isOpen ? 'rotate(-45 10 10)' : undefined} />
                            </g>
                        </svg>
                    </button>
                </div>
            </nav>

            {isOpen && (
                <div id="mobile-menu" className="pop-in border-t border-separator md:hidden">
                    <div className="mx-auto flex max-w-6xl flex-col px-5 pb-6 pt-2">
                        {LINKS.map(l => (
                            <Link key={l.href} href={l.href} className={mobileCls(l.href)} aria-current={isActive(l.href) ? 'page' : undefined}>
                                {l.label}
                            </Link>
                        ))}
                        {accountLinks(true)}
                    </div>
                </div>
            )}
        </header>
    );
}
