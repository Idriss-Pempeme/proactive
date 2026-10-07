import type { Metadata, Viewport } from 'next';
import { Marcellus, Outfit } from 'next/font/google';
import { Suspense, type ReactNode } from 'react';
import './globals.css';
import Navbar from './components/Navbar';
import { AuthPlaceholder, AuthStatus } from './components/AuthStatus';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import PageLoader from './components/PageLoader';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Proactive Services | Négoce · Formation · Opportunités',
  description:
    'Proactive Services - Créer des ponts entre l\'Afrique et les marchés internationaux. Formation professionnelle en négoce et commerce international des matières premières.',
  keywords:
    'négoce, formation, Afrique, commerce international, matières premières, Proactive Services, LMS',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f8faf9',
};

// Display serif for headings and figures, geometric sans for everything else.
const display = Marcellus({ weight: '400', subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-display' });
const body = Outfit({ subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-body' });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <PageLoader />
        <Navbar
          authSlot={<Suspense fallback={<AuthPlaceholder />}><AuthStatus variant="bar" /></Suspense>}
          drawerAuthSlot={<Suspense fallback={<AuthPlaceholder />}><AuthStatus variant="drawer" /></Suspense>}
        />
        <main>{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
