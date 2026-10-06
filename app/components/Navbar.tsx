'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/about', label: 'À propos' },
  { href: '/courses', label: 'Formations' },
  { href: '/livres', label: 'Livres' },
  { href: '#', label: 'Contact', hash: true },
];

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function Navbar({ authSlot, drawerAuthSlot }: { authSlot: ReactNode; drawerAuthSlot: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // The inline script in the root layout already resolved the theme before
  // paint, so the DOM attribute is the source of truth, not localStorage.
  useEffect(() => {
    // Intentional: hydration-safe sync from the DOM attribute set by the inline script.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const applied = document.documentElement.getAttribute('data-theme');
    if (applied === 'light' || applied === 'dark') setTheme(applied);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try {
        window.localStorage.setItem('theme', next);
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile menu on navigation (adjust state during render, not in an effect).
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;

    document.body.classList.add('nav-open');

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    const wide = window.matchMedia('(min-width: 1025px)');
    function handleWide(e: MediaQueryListEvent) {
      if (e.matches) setMenuOpen(false);
    }

    window.addEventListener('keydown', handleKey);
    wide.addEventListener('change', handleWide);

    return () => {
      document.body.classList.remove('nav-open');
      window.removeEventListener('keydown', handleKey);
      wide.removeEventListener('change', handleWide);
    };
  }, [menuOpen]);

  const isActive = (href: string) => !href.includes('#') && (pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)));

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            <span className="brand-title">PROACTIVE</span>
            <span className="brand-subtitle">Services</span>
          </Link>

          <div className="nav-links">
            {NAV_LINKS.map((link) =>
              link.hash ? (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} className={isActive(link.href) ? 'active' : ''}>
                  {link.label}
                </Link>
              )
            )}
          </div>

          <div className="nav-actions">
            {authSlot}

            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                className="icon-btn"
                aria-label={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
              >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>
            )}
            <button
              type="button"
              className="icon-btn nav-burger"
              onClick={() => setMenuOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`nav-scrim${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        id="mobile-nav"
        className={`nav-drawer${menuOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        inert={!menuOpen}
      >
        <div className="nav-drawer-head">
          <span className="nav-drawer-label">Navigation</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="nav-drawer-links">
          {NAV_LINKS.map((link) =>
            link.hash ? (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={isActive(link.href) ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        <div className="nav-drawer-auth">
          {drawerAuthSlot}
        </div>
      </div>
    </>
  );
}
