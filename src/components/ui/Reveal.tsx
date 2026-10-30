'use client'

import { useEffect, useRef, useState } from 'react';

/**
 * Fades + lifts its content in once, the first time it scrolls into view.
 * Marketing surfaces only — never wrap functional UI people use every day.
 * Reduced motion: opacity only (see .reveal in globals.css).
 */
export default function Reveal({
    children,
    delay = 0,
    as: Tag = 'div',
    className = '',
}: {
    children: React.ReactNode;
    /** Stagger offset in ms (keep steps 50–80ms). */
    delay?: number;
    as?: 'div' | 'section' | 'li' | 'article';
    className?: string;
}) {
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') {
            requestAnimationFrame(() => setVisible(true));
            return;
        }
        const io = new IntersectionObserver(
            entries => {
                if (entries.some(e => e.isIntersecting)) {
                    setVisible(true);
                    io.disconnect();
                }
            },
            { rootMargin: '0px 0px -10% 0px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <Tag
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={ref as any}
            className={`reveal ${className}`}
            data-visible={visible}
            style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
        >
            {children}
        </Tag>
    );
}
