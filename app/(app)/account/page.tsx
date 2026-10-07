import type { Metadata } from 'next';
import styles from '../app.module.css';
import { AvatarForm, ProfileForm } from './forms';

export const metadata: Metadata = { title: 'Mon compte | Proactive Académie', robots: { index: false } };

export default function AccountPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Mon compte</h1>
        <p className={styles.lead}>Ces informations apparaissent sur votre profil public si vous êtes formateur.</p>
        <div className={styles.accountGrid}>
          <div className={styles.panel}>
            <ProfileForm displayName="" headline={null} bio={null} />
          </div>
          <div className={styles.panel} style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
            <AvatarForm />
          </div>
        </div>
      </div>
    </section>
  );
}
