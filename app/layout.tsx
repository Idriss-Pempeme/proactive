import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import PageLoader from './components/PageLoader';

export const metadata: Metadata = {
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8faf9' },
    { media: '(prefers-color-scheme: dark)', color: '#040d09' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = 'dark';
                try {
                  var stored = window.localStorage.getItem('theme');
                  if (stored === 'light' || stored === 'dark') {
                    theme = stored;
                  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                    theme = 'light';
                  }
                } catch (e) {}
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body>
        <PageLoader />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
