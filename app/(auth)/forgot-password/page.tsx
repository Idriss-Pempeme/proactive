import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { ForgotPasswordForm } from '@/components/auth/forms';

export const metadata: Metadata = { title: 'Mot de passe oublié | Proactive Académie', robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Mot de passe oublié" subtitle="Indiquez votre email, nous vous envoyons un lien de réinitialisation.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
