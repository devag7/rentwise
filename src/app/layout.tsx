import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rentwise.devshipit.com';

// System font stack (SF on Apple devices): no font download at all.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'RentWise — fair rent for every Bangalore flat',
    template: '%s | RentWise',
  },
  description:
    'Bangalore rent intelligence: fair-rent verdicts from real comparable listings, a public rent index, and a free rent checker. No brokers, no login to browse.',
  keywords: ['rentals', 'Bangalore', 'flats for rent', 'no broker', 'rent prices'],
  openGraph: {
    title: 'RentWise — fair rent for every Bangalore flat',
    description:
      'Every Bangalore listing priced against real comparable listings. Check any rent in seconds.',
    url: BASE_URL,
    siteName: 'RentWise',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentWise — fair rent for every Bangalore flat',
    description:
      'Every Bangalore listing priced against real comparable listings. Check any rent in seconds.',
  },
  robots: { index: true, follow: true },
};

import { AppProvider } from '@/components/providers/AppContext';
import AnalyticsTracker from '@/components/providers/AnalyticsTracker';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'RentWise',
        url: BASE_URL,
        slogan: "Know what it's worth.",
        description:
          'Rent intelligence platform for Bangalore. Fair-rent verdicts from real market comparables — zero brokers, zero fake listings.',
      },
      {
        '@type': 'WebSite',
        name: 'RentWise',
        url: BASE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${BASE_URL}/check?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang="en-IN">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] btn btn-secondary btn-sm">Skip to content</a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <AppProvider>
          <AnalyticsTracker />
          <Navbar />
          <main id="main" className="min-h-[70vh]">{children}</main>
          <Footer />
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: 'material',
              style: {
                background: 'var(--material)',
                color: 'var(--label)',
                border: '1px solid var(--material-border)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-raised)',
                fontFamily: 'inherit',
                fontSize: '15px',
                letterSpacing: '-0.012em',
                padding: '10px 14px',
              },
              success: { iconTheme: { primary: 'var(--good)', secondary: 'var(--surface)' } },
              error: { iconTheme: { primary: 'var(--bad)', secondary: 'var(--surface)' } },
            }}
          />
        </AppProvider>
        <Analytics />
      </body>
    </html>
  );
}
