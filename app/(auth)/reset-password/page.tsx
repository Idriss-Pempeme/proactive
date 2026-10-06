import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { ResetPasswordForm } from '@/components/auth/forms';
import { getUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Nouveau mot de passe | Proactive Académie', robots: { index: false } };

async function ResetGate() {
  if (!(await getUser())) redirect('/login?next=%2Freset-password'); // the recovery link signs the user in via /auth/callback
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Nouveau mot de passe">
      <Suspense fallback={null}>
        <ResetGate />
      </Suspense>
    </AuthCard>
  );
}
