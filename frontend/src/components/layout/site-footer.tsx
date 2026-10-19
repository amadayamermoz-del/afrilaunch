import Link from "next/link";

export function SiteFooter() {
  return <footer className="footer"><div className="footer-grid">
    <div><Link className="brand footer-brand" href="/"><span>afri</span>launch<span className="brand-dot" /></Link><p>Les idées africaines méritent des opportunités à leur hauteur.</p></div>
    <div><h3>Plateforme</h3><Link href="/opportunities">Opportunités</Link><Link href="/#projects">Projets</Link><Link href="/#how-it-works">Comment ça marche</Link></div>
    <div><h3>Ressources</h3><Link href="/about">À propos</Link><Link href="/#testimonials">Témoignages</Link><Link href="/faq">Centre d&apos;aide</Link><Link href="/contact">Contact</Link></div>
    <div><h3>Suivez-nous</h3><a href="#linkedin">LinkedIn</a><a href="#instagram">Instagram</a><a href="#x">X / Twitter</a></div>
  </div><div className="footer-bottom"><span>© 2026 AfriLaunch. Tous droits réservés.</span><div><a href="#privacy">Confidentialité</a><a href="#terms">Conditions d&apos;utilisation</a></div></div></footer>;
}
