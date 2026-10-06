import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { SignupForm } from '@/components/auth/forms';
import { safeNextPath } from '@/lib/auth/roles';
import { getUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Créer un compte | Proactive Académie' };

async function SignupGate({ searchParams }: { searchParams: PageProps<'/signup'>['searchParams'] }) {
  const sp = await searchParams;
  const next = safeNextPath(typeof sp.next === 'string' ? sp.next : null);
  if (await getUser()) redirect(next);
  return <SignupForm next={next} />;
}

export default function SignupPage({ searchParams }: PageProps<'/signup'>) {
  return (
    <AuthCard title="Créer un compte" subtitle="Accédez aux formations de Proactive Académie et de nos experts.">
      <Suspense fallback={null}>
        <SignupGate searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
