'use client';

import { useState, useEffect, Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { CloseOnRouteChange } from './CloseOnRouteChange';
import { NavLinks, StaticNavLinks } from './NavLinks';

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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <>
      <Suspense fallback={null}>
        <CloseOnRouteChange onChange={() => setMenuOpen(false)} />
      </Suspense>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            <span className="brand-title"><span className="brand-pro">PRO</span><span className="brand-active">ACTIVE</span></span>
            <span className="brand-subtitle">Services</span>
          </Link>

          <Suspense fallback={<StaticNavLinks variant="bar" />}>
            <NavLinks variant="bar" />
          </Suspense>

          <div className="nav-actions">
            {authSlot}

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

        <Suspense fallback={<StaticNavLinks variant="drawer" onNavigate={() => setMenuOpen(false)} />}>
          <NavLinks variant="drawer" onNavigate={() => setMenuOpen(false)} />
        </Suspense>

        <div
          className="nav-drawer-auth"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a, button[type="submit"]')) setMenuOpen(false);
          }}
        >
          {drawerAuthSlot}
        </div>
      </div>
    </>
  );
}
