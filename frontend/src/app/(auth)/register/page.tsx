"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { isAuthUser } from "@/lib/auth-types";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "message" in result
            ? result.message
            : "La création du compte a échoué.";
        throw new Error(
          Array.isArray(message) ? message.join(" ") : String(message),
        );
      }
      if (
        !result ||
        typeof result !== "object" ||
        !("user" in result) ||
        !isAuthUser(result.user) ||
        result.user.role !== "USER"
      ) {
        throw new Error("Le serveur a renvoyé une réponse d'inscription invalide.");
      }

      router.replace("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur inattendue a empêché la création du compte.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <header className="auth-heading">
        <span className="auth-heading__eyebrow">Votre prochaine étape commence ici</span>
        <h2>Créez votre espace AfriLaunch</h2>
        <p>Un profil pour structurer votre projet et garder vos opportunités à portée de main.</p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">Nom complet
            <input name="name" autoComplete="name" placeholder="Ex. Aminata Diallo" required />
          </label>
          <label className="auth-field">Adresse e-mail
            <input name="email" type="email" autoComplete="email" placeholder="vous@exemple.com" required />
          </label>
          <label className="auth-field">Mot de passe
            <span className="auth-password-wrap">
              <input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="10 caractères minimum" required minLength={10} maxLength={128} />
              <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          <label className="auth-checkbox auth-register__consent">
            <input type="checkbox" name="terms" required />
            <span>J&apos;accepte les <Link className="auth-text-link" href="/#terms">conditions d&apos;utilisation</Link> et la politique de confidentialité.</span>
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Création du compte…" : "Créer mon compte"} <ArrowRight size={16} />
          </button>
      </form>

      <p className="auth-switch">Vous avez déjà un compte ? <Link className="auth-text-link" href="/login">Se connecter</Link></p>
    </div>
  );
}
