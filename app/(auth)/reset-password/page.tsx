import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { ResetPasswordForm } from '@/components/auth/forms';

export const metadata: Metadata = { title: 'Nouveau mot de passe | Proactive Académie', robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Nouveau mot de passe">
      <ResetPasswordForm />
    </AuthCard>
  );
}
