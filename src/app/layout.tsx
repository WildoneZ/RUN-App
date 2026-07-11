import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RegisterSW } from '@/components/RegisterSW';

export const metadata: Metadata = {
  title: 'RUN Rewards',
  description: 'Run. Earn. Redeem in store. The RUN loyalty game.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'RUN Rewards' },
  icons: { apple: '/icons/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#0b1220',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
