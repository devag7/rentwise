import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://157.245.110.163:3009';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'RentWise - Premium Rentals in Bangalore',
    template: '%s | RentWise',
  },
  description:
    'Find your perfect rental in Bangalore with verified listings, rent intelligence, commute analysis and zero brokerage noise.',
  keywords: ['rentals', 'Bangalore', 'flats for rent', 'no broker', 'rent prices'],
  openGraph: {
    title: 'RentWise - Premium Rentals in Bangalore',
    description:
      'Verified Bangalore rental listings with rent intelligence and commute analysis.',
    url: BASE_URL,
    siteName: 'RentWise',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentWise - Premium Rentals in Bangalore',
    description:
      'Verified Bangalore rental listings with rent intelligence and commute analysis.',
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
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-200">
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
      </body>
    </html>
  );
}
