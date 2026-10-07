import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { SignupForm } from '@/components/auth/forms';

export const metadata: Metadata = { title: 'Créer un compte | Proactive Académie' };

export default function SignupPage() {
  return (
    <AuthCard title="Créer un compte" subtitle="Accédez aux formations de Proactive Académie et de nos experts.">
      <SignupForm next="/learn" />
    </AuthCard>
  );
}
