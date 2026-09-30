'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-dark)',
      position: 'relative',
      overflow: 'hidden',
      textAlign: 'center',
      padding: '20px'
    }}>
      {/* Background Glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: 'min(400px, 70vw)',
        height: 'min(400px, 70vw)',
        background: 'radial-gradient(circle, var(--emerald-glow) 0%, transparent 70%)',
        filter: 'blur(60px)',
        zIndex: 0
      }}></div>
      
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '20%',
        width: 'min(400px, 70vw)',
        height: 'min(400px, 70vw)',
        background: 'radial-gradient(circle, var(--gold-glow) 0%, transparent 70%)',
        filter: 'blur(60px)',
        zIndex: 0
      }}></div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ 
          fontSize: 'clamp(8rem, 15vw, 12rem)', 
          fontFamily: "'Playfair Display', serif", 
          fontWeight: '800', 
          color: 'var(--heading)',
          lineHeight: '1',
          marginBottom: '20px'
        }}>
          4<span className="text-gradient-gold">0</span>4
        </h1>
        
        <h2 style={{ 
          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', 
          fontFamily: "'Playfair Display', serif",
          color: 'var(--heading)', 
          marginBottom: '20px' 
        }}>
          Page Introuvable
        </h2>
        
        <p style={{ 
          fontSize: '1.1rem', 
          color: 'var(--text-muted)', 
          maxWidth: '500px', 
          margin: '0 auto 40px',
          lineHeight: '1.6'
        }}>
          Il semblerait que vous ayez navigué hors des routes du négoce international. La page que vous cherchez n'existe pas ou a été déplacée.
        </p>

        <Link href="/" className="btn btn-emerald">
          Retour à l'Accueil
        </Link>
      </div>

      {/* Decorative Grid Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.5
      }}></div>
    </div>
  );
}
