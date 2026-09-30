'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      e.target.reset();
    }, 3000);
  }

  return (
    <form className="contact-form fade-up" onSubmit={handleSubmit}>
      <div className="contact-form-row">
        <input
          type="text"
          placeholder="Votre nom"
          required
          className="contact-input"
        />
        <input
          type="email"
          placeholder="Votre email"
          required
          className="contact-input"
        />
      </div>
      <select className="contact-select" defaultValue="">
        <option value="" disabled>Sujet de votre demande</option>
        <option value="formation">Formation - Proactive Académie</option>
        <option value="negoce">Négoce - Services commerciaux</option>
        <option value="partenariat">Partenariat</option>
        <option value="autre">Autre</option>
      </select>
      <textarea
        placeholder="Votre message..."
        rows={5}
        className="contact-textarea"
      ></textarea>
      <button
        type="submit"
        className="btn btn-primary btn-lg"
        style={{
          width: '100%',
          ...(submitted
            ? { background: 'linear-gradient(135deg, var(--gold-main), var(--gold-dark))' }
            : {}),
        }}
        disabled={submitted}
      >
        {submitted ? '✓ Message envoyé !' : (
          <>
            Envoyer le message
            <span className="btn-icon">→</span>
          </>
        )}
      </button>
    </form>
  );
}
