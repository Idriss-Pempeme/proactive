'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/about', label: 'À propos' },
  { href: '/courses', label: 'Formations' },
  { href: '/livres', label: 'Livres' },
  { href: '/contact', label: 'Contact' },
];

type Props = { variant: 'bar' | 'drawer'; onNavigate?: () => void };

function Links({ variant, onNavigate, isActive }: Props & { isActive: (href: string) => boolean }) {
  const items = NAV_LINKS.map((link) => (
    <Link key={link.href} href={link.href} className={isActive(link.href) ? 'active' : ''} onClick={onNavigate}>
      {link.label}
    </Link>
  ));
  return <div className={variant === 'bar' ? 'nav-links' : 'nav-drawer-links'}>{items}</div>;
}

/** Same markup as NavLinks without the pathname hook: the prerendered fallback. */
export function StaticNavLinks(props: Props) {
  return <Links {...props} isActive={() => false} />;
}

export function NavLinks(props: Props) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
  return <Links {...props} isActive={isActive} />;
}
