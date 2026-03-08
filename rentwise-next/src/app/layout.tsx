import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

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
      </body>
    </html>
  );
}
