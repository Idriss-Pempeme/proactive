import Link from 'next/link';
import { getProfile } from '@/lib/auth/session';
import { avatarUrl } from '@/lib/media';
import { UserMenu } from './UserMenu';

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

export async function AuthStatus({ variant }: { variant: 'bar' | 'drawer' }) {
  const profile = await getProfile();
  if (!profile) return <GuestLinks variant={variant} />;
  return <UserMenu variant={variant} name={profile.displayName} role={profile.role} avatar={avatarUrl(profile.avatarPath)} />;
}
