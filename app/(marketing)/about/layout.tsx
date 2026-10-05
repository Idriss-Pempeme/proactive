import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'À Propos | Proactive Services - Négoce · Formation · Opportunités',
  description:
    'À propos du Négoce - Proactive Services. Découvrez notre mission : créer des ponts entre l\'Afrique et les marchés internationaux par le négoce et la formation.',
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
