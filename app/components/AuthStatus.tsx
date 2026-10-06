import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
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

/** Neutral Suspense placeholder: renders nothing visible, so signed-in users never see guest links flash. */
export function AuthPlaceholder() {
  return <span aria-hidden="true" style={{ display: 'inline-block', minWidth: 160 }} />;
}

export async function AuthStatus({ variant }: { variant: 'bar' | 'drawer' }) {
  let profile: Awaited<ReturnType<typeof getProfile>>;
  try {
    profile = await getProfile();
  } catch (error) {
    unstable_rethrow(error); // let Next's own control-flow errors (prerender bail-outs etc.) through
    // Rendered by the root layout on every page: a DB or auth outage must not take the whole site down.
    console.error('AuthStatus: could not load the profile', error);
    return <GuestLinks variant={variant} />;
  }
  if (!profile) return <GuestLinks variant={variant} />;
  return <UserMenu variant={variant} name={profile.displayName} role={profile.role} avatar={avatarUrl(profile.avatarPath)} />;
}
