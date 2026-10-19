"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="auth-card">
      <header className="auth-heading">
        <span className="auth-heading__eyebrow">Récupération du compte</span>
        <h2>Vous avez oublié votre mot de passe ?</h2>
        <p>Indiquez l&apos;adresse associée à votre compte pour commencer la récupération.</p>
      </header>

      {submitted ? (
        <div className="auth-success" role="status" aria-live="polite">
          <strong><MailCheck size={17} /> Demande enregistrée pour la démonstration</strong>
          <p>Aucun e-mail n&apos;a été envoyé. La récupération sera activée avec le service d&apos;authentification.</p>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">Adresse e-mail
            <input name="email" type="email" autoComplete="email" placeholder="vous@exemple.com" required />
          </label>
          <button className="button auth-submit" type="submit">Continuer <ArrowRight size={16} /></button>
        </form>
      )}

      <p className="auth-switch auth-forgot__back">
        <Link className="auth-text-link" href="/login"><ArrowLeft size={14} /> Retour à la connexion</Link>
      </p>
    </div>
  );
}
