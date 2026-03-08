import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
export const metadata: Metadata = {
  title: 'RentWise - Premium Rentals in Bangalore',
  description: 'Find your perfect rental with AI-powered insights.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-200">
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
      </body>
    </html>
  );
}
