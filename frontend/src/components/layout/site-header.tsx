import { ArrowUpRight, Menu } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  return <header className="site-header"><div className="nav-shell">
    <Link className="brand" href="/" aria-label="AfriLaunch, accueil"><span>afri</span>launch<span className="brand-dot" /></Link>
    <nav aria-label="Navigation principale"><Link href="/opportunities">Opportunités</Link><Link href="/#projects">Projets</Link><Link href="/#how-it-works">Comment ça marche</Link><Link href="/about">À propos</Link></nav>
    <div className="nav-actions"><Link className="login" href="/login">Se connecter</Link><Link className="button button-small" href="/register">Lancer mon projet <ArrowUpRight size={16} /></Link><button className="menu-button" aria-label="Ouvrir le menu"><Menu size={22} /></button></div>
  </div></header>;
}
