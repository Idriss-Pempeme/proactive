import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/forms';

export const metadata: Metadata = { title: 'Connexion | Proactive Académie', robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthCard title="Connexion" subtitle="Retrouvez vos formations et votre progression.">
      <LoginForm next="/learn" />
    </AuthCard>
  );
}
