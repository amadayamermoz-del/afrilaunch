"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { isAuthUser } from "@/lib/auth-types";

export default function LoginPage() {
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "message" in result
            ? result.message
            : "La connexion a échoué.";
        throw new Error(
          Array.isArray(message) ? message.join(" ") : String(message),
        );
      }
      if (
        !result ||
        typeof result !== "object" ||
        !("user" in result) ||
        !isAuthUser(result.user)
      ) {
        throw new Error("Le serveur a renvoyé une réponse de connexion invalide.");
      }

      router.replace(result.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur inattendue a empêché la connexion.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <header className="auth-heading">
        <span className="auth-heading__eyebrow">Bon retour parmi nous</span>
        <h2>Connectez-vous à votre espace</h2>
        <p>Connectez-vous pour retrouver votre espace AfriLaunch.</p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">Adresse e-mail
          <input name="email" type="email" autoComplete="email" placeholder="vous@exemple.com" required />
        </label>
        <label className="auth-field">Mot de passe
          <span className="auth-password-wrap">
            <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Votre mot de passe" required minLength={1} maxLength={128} />
            <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>
        <div className="auth-form__row">
          <span />
          <Link className="auth-text-link" href="/forgot-password">Mot de passe oublié ?</Link>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="button auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Connexion…" : "Se connecter"}
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="auth-divider">ou</div>
      <p className="auth-switch">Vous n&apos;avez pas encore de compte ? <Link className="auth-text-link" href="/register">Créer un compte</Link></p>
    </div>
  );
}
