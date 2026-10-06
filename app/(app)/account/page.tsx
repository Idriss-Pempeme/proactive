import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { requireUser } from '@/lib/auth/session';
import { avatarUrl } from '@/lib/media';
import styles from '../app.module.css';
import { AvatarForm, ProfileForm } from './forms';

export const metadata: Metadata = { title: 'Mon compte | Proactive Académie', robots: { index: false } };

async function AccountContent() {
  const profile = await requireUser('/account');
  const avatar = avatarUrl(profile.avatarPath);
  return (
    <>
      <h1 className={styles.title}>Mon compte</h1>
      <p className={styles.lead}>Ces informations apparaissent sur votre profil public si vous êtes formateur.</p>
      <div className={styles.accountGrid}>
        <div className={styles.panel}>
          <ProfileForm displayName={profile.displayName} headline={profile.headline} bio={profile.bio} />
        </div>
        <div className={styles.panel} style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
          {avatar && <Image src={avatar} alt="Votre photo de profil" width={96} height={96} style={{ borderRadius: '50%', objectFit: 'cover' }} />}
          <AvatarForm />
        </div>
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <Suspense fallback={<p className="text-muted">Chargement…</p>}>
          <AccountContent />
        </Suspense>
      </div>
    </section>
  );
}
