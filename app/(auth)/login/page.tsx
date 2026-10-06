import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/forms';
import { safeNextPath } from '@/lib/auth/roles';
import { getUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Connexion | Proactive Académie', robots: { index: false } };

const ERRORS: Record<string, string> = {
  callback: 'Ce lien est invalide ou a expiré. Reconnectez-vous ou demandez un nouveau lien.',
  oauth: 'La connexion avec Google a échoué. Réessayez.',
};

async function LoginGate({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) {
  const sp = await searchParams;
  const next = safeNextPath(typeof sp.next === 'string' ? sp.next : null);
  if (await getUser()) redirect(next);
  const error = typeof sp.error === 'string' ? ERRORS[sp.error] : undefined;
  return <LoginForm next={next} error={error} />;
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <AuthCard title="Connexion" subtitle="Retrouvez vos formations et votre progression.">
      <Suspense fallback={null}>
        <LoginGate searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
