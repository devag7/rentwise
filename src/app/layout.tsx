import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rentwise.devshipit.com';

// Self-hosted at build time — no render-blocking request to Google Fonts.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const viewport: Viewport = { themeColor: '#0A0A0A' };

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
    <html lang="en-IN" className={inter.variable}>
      <body className="antialiased bg-[#0A0A0A]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <AppProvider>
          <AnalyticsTracker />
          <Navbar />
          {children}

        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#111',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0px',
              fontFamily: 'inherit',
              fontSize: '12px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 700
            },
            success: {
              iconTheme: {
                primary: '#00A699',
                secondary: '#111',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF385C',
                secondary: '#111',
              },
            },
          }}
        />
        </AppProvider>
        <Analytics />
      </body>
    </html>
  );
}
