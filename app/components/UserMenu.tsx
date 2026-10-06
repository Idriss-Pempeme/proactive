'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { signOutAction } from '@/app/(auth)/actions';

type Role = 'student' | 'instructor' | 'admin';
type Props = { variant: 'bar' | 'drawer'; name: string; role: Role; avatar: string | null };

function menuLinks(role: Role) {
  return [
    { href: '/learn', label: 'Mon apprentissage' },
    { href: '/teach', label: role === 'student' ? 'Devenir formateur' : 'Espace formateur' },
    ...(role === 'admin' ? [{ href: '/admin', label: 'Administration' }] : []),
    { href: '/account', label: 'Mon compte' },
  ];
}

export function UserMenu({ variant, name, role, avatar }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const initials = name.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (variant === 'drawer') {
    return (
      <div className="user-menu-drawer">
        {menuLinks(role).map((l) => (
          <Link key={l.href} href={l.href} className="btn btn-secondary">{l.label}</Link>
        ))}
        <form action={signOutAction}>
          <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>Déconnexion</button>
        </form>
      </div>
    );
  }

  return (
    <div
      className="user-menu"
      ref={ref}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button type="button" ref={triggerRef} className="user-menu-trigger" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny avatar from our own storage */}
        {avatar ? <img src={avatar} alt="" width={40} height={40} /> : <span aria-hidden="true">{initials}</span>}
        <span className="sr-only">Menu du compte de {name}</span>
      </button>
      {open && (
        <div className="user-menu-panel" id={panelId}>
          <div className="user-menu-name">{name}</div>
          {menuLinks(role).map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <form action={signOutAction}>
            <button type="submit">Déconnexion</button>
          </form>
        </div>
      )}
    </div>
  );
}
