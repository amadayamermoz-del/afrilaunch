import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";
import "./auth.css";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="auth-layout">
      <section className="auth-visual" aria-label="AfriLaunch accompagne les porteurs de projets">
        <Link className="auth-brand" href="/" aria-label="AfriLaunch, accueil">
          <span>afri</span>launch<i />
        </Link>
        <Link className="auth-back" href="/">
          <ArrowLeft size={15} /> Retour à l&apos;accueil
        </Link>
        <div className="auth-visual__content">
          <span className="auth-visual__eyebrow"><Sparkles size={14} /> Des idées aux opportunités</span>
          <h1>Chaque projet mérite une vraie chance d&apos;avancer.</h1>
          <p>Structurez votre ambition, découvrez les bonnes opportunités et avancez à votre rythme.</p>
          <div className="auth-visual__note">
            <span className="auth-visual__note-mark">“</span>
            <p>Un espace pour faire grandir les idées qui font avancer le continent.</p>
            <span className="auth-visual__note-link">À propos d&apos;AfriLaunch <ArrowUpRight size={14} /></span>
          </div>
        </div>
        <span className="auth-visual__copyright">© 2026 AfriLaunch</span>
      </section>
      <section className="auth-main">
        <div className="auth-main__mobile-brand">
          <Link className="auth-brand auth-brand--mobile" href="/" aria-label="AfriLaunch, accueil">
            <span>afri</span>launch<i />
          </Link>
          <Link className="auth-back" href="/"><ArrowLeft size={15} /> Accueil</Link>
        </div>
        {children}
        <p className="auth-legal">En continuant, vous acceptez nos <Link href="/#terms">conditions d&apos;utilisation</Link> et notre <Link href="/#privacy">politique de confidentialité</Link>.</p>
      </section>
    </main>
  );
}
