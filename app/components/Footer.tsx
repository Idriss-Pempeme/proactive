import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { CurrencySelector } from './CurrencySelector';

export default async function Footer() {
  'use cache';
  cacheLife('days');
  const year = new Date().getFullYear();
  return (
    <footer className="footer-premium" style={{ backgroundColor: 'var(--bg-darker)' }}>
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="nav-logo" style={{ marginBottom: '24px' }}>
              <span className="brand-title"><span className="brand-pro">PRO</span><span className="brand-active">ACTIVE</span></span>
              <span className="brand-subtitle">Services</span>
            </Link>
            <p className="text-muted" style={{ maxWidth: '400px', lineHeight: '1.8' }}>
              Le standard d&apos;excellence du négoce international africain. Structuration, sécurisation et distribution de valeur à l&apos;échelle mondiale.
            </p>
          </div>

          <div>
            <div className="footer-title">Expertise</div>
            <div className="footer-links">
              <a href="#">Sourcing Stratégique</a>
              <a href="#">Ingénierie Financière</a>
              <a href="#">Logistique & Douanes</a>
              <a href="#">Proactive Académie</a>
            </div>
          </div>

          <div>
            <div className="footer-title">Contact</div>
            <div className="footer-links">
              <a href="mailto:direction@proactiveservices.com">direction@proactiveservices.com</a>
              <a href="#">+225 00 00 00 00</a>
              <a href="#">Abidjan, Côte d&apos;Ivoire</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>&copy; {year} Proactive Services. Tous droits réservés.</div>
          <div style={{ display: 'grid', gap: 6 }}>
            <CurrencySelector />
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Paiements en euros. Conversion indicative.</span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#">Mentions Légales</a>
            <a href="#">Politique de Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
