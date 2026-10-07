import Link from 'next/link';

export function GuestLinks({ variant }: { variant: 'bar' | 'drawer' }) {
  if (variant === 'drawer') {
    return (
      <>
        <Link href="/login" className="btn btn-secondary">Connexion</Link>
        <Link href="/signup" className="btn btn-primary">Créer un compte</Link>
      </>
    );
  }
  return (
    <div className="nav-auth">
      <Link href="/login" className="nav-auth-login">Connexion</Link>
      <Link href="/signup" className="nav-auth-signup">Créer un compte</Link>
    </div>
  );
}

/** Neutral Suspense placeholder: renders nothing visible, so signed-in users never see guest links flash. */
export function AuthPlaceholder() {
  return <span aria-hidden="true" style={{ display: 'inline-block', minWidth: 160 }} />;
}

/** UI-only build: visitors are always signed out. */
export function AuthStatus({ variant }: { variant: 'bar' | 'drawer' }) {
  return <GuestLinks variant={variant} />;
}
