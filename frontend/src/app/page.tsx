"use client";

import { motion } from "framer-motion";
import { ArrowRight, FileText, Globe2, Lightbulb, MapPin, Rocket, Search, ShieldCheck, Target, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SectionHeading } from "@/components/shared/section-heading";
import type { Project, Step } from "@/types/landing";
import {
  isOpportunity,
  responseError,
  type Opportunity,
} from "@/types/opportunity";

const steps: Step[] = [
  { number: "01", title: "Construisez votre profil", description: "Présentez votre idée, votre équipe et vos ambitions avec un dossier clair et structuré.", icon: FileText },
  { number: "02", title: "Découvrez les opportunités", description: "Accédez à des appels à projets, financements et programmes sélectionnés pour vous.", icon: Search },
  { number: "03", title: "Passez à l'action", description: "Candidatez avec confiance et suivez chaque étape de votre parcours depuis un seul espace.", icon: Rocket },
];

const projects: Project[] = [
  { title: "AgriConnect", founder: "Aminata Diallo", category: "AgriTech", location: "Dakar, Sénégal", initials: "AC", color: "#7c3aed" },
  { title: "Kawa Energy", founder: "Kevin Mwamba", category: "CleanTech", location: "Lubumbashi, RDC", initials: "KE", color: "#ea580c" },
  { title: "Sira Health", founder: "Fatou Bamba", category: "HealthTech", location: "Bamako, Mali", initials: "SH", color: "#059669" },
];

const reasons = [
  { title: "Des opportunités pertinentes", description: "Une sélection qualifiée, adaptée aux réalités et aux ambitions des entrepreneurs africains.", icon: Target },
  { title: "Un projet mieux structuré", description: "Des repères simples pour transformer une idée solide en dossier convaincant.", icon: Lightbulb },
  { title: "Un parcours transparent", description: "Suivez vos candidatures et vos prochaines étapes sans vous perdre dans les échanges.", icon: ShieldCheck },
  { title: "Un écosystème qui vous comprend", description: "Rejoignez une communauté de fondateurs, partenaires et experts engagés pour l'Afrique.", icon: Globe2 },
];

const fadeUp = { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.52 } };

export default function Home() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(true);
  const [opportunitiesError, setOpportunitiesError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/opportunities", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            responseError(body, "Impossible de charger les opportunités."),
          );
        }
        if (!Array.isArray(body) || !body.every(isOpportunity)) {
          throw new Error("La réponse du serveur pour les opportunités est invalide.");
        }
        return body;
      })
      .then((result) => {
        if (active) setOpportunities(result);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setOpportunitiesError(
            loadError instanceof Error
              ? loadError.message
              : "Impossible de charger les opportunités.",
          );
        }
      })
      .finally(() => {
        if (active) setOpportunitiesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return <main id="top" className="home-page">
    <SiteHeader />
    <section className="hero home-hero">
      <div className="container home-hero__container">
        <motion.div
          className="home-hero__stage"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="home-hero__content">
            <span className="home-hero__eyebrow"><span /> La plateforme des ambitions africaines</span>
            <h1>Les idées africaines méritent des opportunités à leur hauteur.</h1>
            <p>
              AfriLaunch accompagne les porteurs de projets africains pour transformer leurs idées en projets
              structurés et accéder aux bonnes opportunités.
            </p>
            <div className="home-hero__actions">
              <Link className="button home-hero__primary" href="/opportunities">
                Explorer les opportunités <ArrowRight size={17} />
              </Link>
              <a className="home-hero__secondary" href="#start">Lancer mon projet</a>
            </div>
          </div>
          <div className="home-hero__community">
            <span className="home-hero__community-icon"><UsersRound size={17} /></span>
            <span><strong>Des idées d&apos;ici.</strong><small>Des opportunités à l&apos;échelle du continent.</small></span>
          </div>
        </motion.div>

        <motion.div
          className="home-hero__prompt"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
        >
          <span className="home-hero__prompt-icon"><FileText size={20} /></span>
          <div className="home-hero__prompt-copy">
            <strong>Un projet en tête ?</strong>
            <span>Commencez à le structurer et trouvez les bonnes prochaines étapes.</span>
          </div>
          <a className="home-hero__prompt-link" href="#how-it-works">Découvrir comment <ArrowRight size={15} /></a>
        </motion.div>
      </div>
    </section>
    <section className="section" id="how-it-works"><div className="container"><SectionHeading centered eyebrow="Un parcours clair" title="De l'idée à l'opportunité, sans détour." description="AfriLaunch vous donne les bons outils pour avancer avec méthode et gagner en crédibilité." /><div className="steps">{steps.map(({ number, title, description, icon: Icon }, index) => <motion.article className="step" key={title} {...fadeUp} whileHover={{ y: -6 }} transition={{ duration: 0.48, delay: index * 0.09 }}><span className="step-number">{number}</span><div className="step-icon"><Icon size={21} /></div><h3>{title}</h3><p>{description}</p></motion.article>)}</div></div></section>
    <section className="section soft-section" id="opportunities"><div className="container"><div className="section-top"><SectionHeading eyebrow="Opportunités sélectionnées" title="Ce qui peut faire avancer votre projet." description="Des programmes et financements publiés sur AfriLaunch." /><Link className="link-arrow" href="/opportunities">Voir toutes les opportunités <ArrowRight size={16} /></Link></div>{opportunitiesLoading ? <p role="status">Chargement des opportunités…</p> : opportunitiesError ? <p role="alert">{opportunitiesError}</p> : opportunities.length ? <div className="opportunities">{opportunities.slice(0, 3).map((item, index) => <motion.article className="opportunity-card" key={item.id} {...fadeUp} whileHover={{ y: -8, scale: 1.01 }} transition={{ duration: 0.48, delay: index * 0.08 }}><span className="card-tag">{item.category?.name ?? "Sans catégorie"}</span><h3>{item.title}</h3><p className="organization">{item.organization}</p><div className="card-meta"><span><MapPin size={12} /> {item.location ?? "Localisation non précisée"}</span><span>{item.deadline ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(item.deadline)) : "Date limite non précisée"}</span></div></motion.article>)}</div> : <p>Aucune opportunité publiée actuellement.</p>}</div></section>
    <section className="section" id="projects"><div className="container"><div className="section-top"><SectionHeading eyebrow="Ils construisent l'avenir" title="Des projets qui prennent leur élan." description="Découvrez les idées qui se structurent, se connectent et avancent avec AfriLaunch." /><a className="link-arrow" href="#all-projects">Découvrir les projets <ArrowRight size={16} /></a></div><div className="project-grid">{projects.map((project, index) => <motion.article className="project-card" key={project.title} {...fadeUp} whileHover={{ y: -8 }} transition={{ duration: 0.48, delay: index * 0.08 }}><div className="project-header"><span className="project-logo" style={{ background: project.color }}>{project.initials}</span><div><h3>{project.title}</h3><p>par {project.founder}</p></div></div><p>Une solution ambitieuse, structurée pour répondre à un enjeu local avec un potentiel d&apos;impact durable.</p><div className="project-bottom"><span>{project.category}</span><span>{project.location}</span></div></motion.article>)}</div></div></section>
    <section className="section soft-section" id="about"><div className="container"><SectionHeading centered eyebrow="Pensé pour avancer" title="Pourquoi choisir AfriLaunch ?" description="Le bon environnement pour rendre votre ambition plus claire, visible et accessible." /><div className="reason-grid">{reasons.map(({ title, description, icon: Icon }, index) => <motion.article className="reason" key={title} {...fadeUp} whileHover={{ y: -4 }} transition={{ duration: 0.4, delay: index * 0.07 }}><span className="reason-icon"><Icon size={21} /></span><div><h3>{title}</h3><p>{description}</p></div></motion.article>)}</div></div></section>
    <section className="section" id="testimonials"><div className="container"><SectionHeading centered eyebrow="La parole aux fondateurs" title="Ils ont décidé de donner une vraie chance à leur idée." /><div className="testimonials"><motion.article className="quote" {...fadeUp} whileHover={{ y: -4 }}><div className="quote-mark">“</div><p>AfriLaunch m&apos;a permis de clarifier mon projet et de découvrir un programme que je n&apos;aurais jamais trouvé seul. J&apos;ai enfin une direction et les bons repères.</p><div className="person"><span className="person-avatar" style={{ background: "#7c3aed" }}>AD</span><div><b>Aminata Diallo</b><span>Fondatrice, AgriConnect · Sénégal</span></div></div></motion.article><motion.article className="quote" {...fadeUp} whileHover={{ y: -4 }} transition={{ duration: 0.52, delay: 0.1 }}><div className="quote-mark">“</div><p>Ce n&apos;est pas juste une liste d&apos;appels à projets. C&apos;est un espace qui nous aide à comprendre ce que les partenaires attendent vraiment.</p><div className="person"><span className="person-avatar" style={{ background: "#ea580c" }}>KM</span><div><b>Kevin Mwamba</b><span>Co-fondateur, Kawa Energy · RDC</span></div></div></motion.article></div></div></section>
    <section className="cta" id="start"><div className="container"><motion.div className="cta-box" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5 }}><span className="eyebrow">Votre prochaine étape commence ici</span><h2>Votre idée mérite d&apos;aller plus loin.</h2><p>Créez votre espace gratuitement et commencez à structurer votre projet dès aujourd&apos;hui.</p><Link className="button" href="/register">Créer mon espace <ArrowRight size={17} /></Link></motion.div></div></section>
    <style jsx global>{`
      .home-page { overflow: clip; }
      .home-page .home-hero { padding: 34px 0 78px; overflow: visible; background: #f8fafc; }
      .home-page .home-hero::before { display: none; }
      .home-hero__container { position: relative; }
      .home-hero__stage { position: relative; min-height: 540px; display: flex; align-items: flex-end; overflow: hidden; border-radius: 24px; background: #1e293b url("/afrilauch-people.jpg") center 42% / cover no-repeat; box-shadow: 0 28px 70px rgba(15,23,42,.16); }
      .home-hero__stage::before { position: absolute; inset: 0; content: ""; background: linear-gradient(90deg,rgba(8,15,30,.82) 0%,rgba(8,15,30,.62) 43%,rgba(8,15,30,.12) 100%),linear-gradient(0deg,rgba(8,15,30,.32),transparent 60%); }
      .home-hero__content { position: relative; z-index: 1; max-width: 760px; padding: 58px 62px 72px; color: #fff; }
      .home-hero__eyebrow { display: inline-flex; align-items: center; gap: 9px; color: rgba(255,255,255,.88); font-size: 13px; font-weight: 650; letter-spacing: .015em; }
      .home-hero__eyebrow > span { width: 8px; height: 8px; border-radius: 50%; background: #fb923c; box-shadow: 0 0 0 5px rgba(251,146,60,.16); }
      .home-hero__content h1 { max-width: 710px; margin: 19px 0 15px; color: #fff; font-size: clamp(42px,5vw,64px); line-height: 1.02; letter-spacing: -.06em; }
      .home-hero__content p { max-width: 600px; margin: 0; color: rgba(255,255,255,.84); font-size: 16px; line-height: 1.75; }
      .home-hero__actions { display: flex; align-items: center; flex-wrap: wrap; gap: 17px; margin-top: 26px; }
      .home-hero__primary { min-height: 48px; background: #6d28d9; box-shadow: 0 8px 24px rgba(36,15,78,.22); }
      .home-hero__primary:hover { background: #5b21b6; }
      .home-hero__secondary { color: #fff; font-size: 14px; font-weight: 700; text-underline-offset: 4px; }
      .home-hero__secondary:hover { text-decoration: underline; }
      .home-hero__community { position: absolute; z-index: 1; top: 28px; right: 28px; display: flex; align-items: center; gap: 11px; padding: 12px 15px; border: 1px solid rgba(255,255,255,.26); border-radius: 14px; background: rgba(15,23,42,.38); color: #fff; backdrop-filter: blur(10px); }
      .home-hero__community-icon { display: grid; width: 36px; height: 36px; place-items: center; border-radius: 11px; background: rgba(255,255,255,.14); color: #fff; }
      .home-hero__community > span:last-child { display: grid; gap: 2px; }
      .home-hero__community strong { font-size: 12px; }
      .home-hero__community small { color: rgba(255,255,255,.76); font-size: 10px; }
      .home-hero__prompt { position: relative; z-index: 2; display: flex; align-items: center; gap: 14px; width: min(860px,calc(100% - 76px)); min-height: 82px; margin: -34px auto 0; padding: 15px 19px; border: 1px solid #e2e8f0; border-radius: 15px; background: #fff; box-shadow: 0 18px 42px rgba(15,23,42,.11); }
      .home-hero__prompt-icon { display: grid; width: 42px; height: 42px; flex: 0 0 auto; place-items: center; border-radius: 12px; background: #f3e8ff; color: #6d28d9; }
      .home-hero__prompt-copy { display: grid; flex: 1; gap: 4px; }
      .home-hero__prompt-copy strong { color: #0f172a; font-size: 14px; }
      .home-hero__prompt-copy span { color: #64748b; font-size: 12px; line-height: 1.5; }
      .home-hero__prompt-link { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 40px; padding: 0 14px; border: 1px solid #e2e8f0; border-radius: 10px; color: #334155; font-size: 12px; font-weight: 700; white-space: nowrap; transition: border-color .2s,color .2s,background .2s; }
      .home-hero__prompt-link:hover { border-color: #c4b5fd; background: #faf8ff; color: #6d28d9; }
      @media (max-width: 760px) {
        .home-page .home-hero { padding: 22px 0 58px; }
        .home-hero__stage { min-height: 535px; border-radius: 19px; background-position: 59% center; }
        .home-hero__stage::before { background: linear-gradient(90deg,rgba(8,15,30,.77),rgba(8,15,30,.28)),linear-gradient(0deg,rgba(8,15,30,.55),transparent 90%); }
        .home-hero__content { padding: 40px 28px 66px; }
        .home-hero__content h1 { font-size: clamp(40px,7.2vw,54px); }
        .home-hero__community { top: 18px; right: 18px; }
        .home-hero__prompt { width: calc(100% - 32px); }
      }
      @media (max-width: 480px) {
        .home-page .container { padding-right: 16px; padding-left: 16px; }
        .home-page .home-hero { padding-top: 15px; }
        .home-hero__stage { min-height: 565px; align-items: flex-end; background-position: 57% center; border-radius: 16px; }
        .home-hero__content { padding: 34px 20px 54px; }
        .home-hero__content h1 { margin-top: 14px; font-size: clamp(37px,10vw,44px); line-height: 1.04; }
        .home-hero__content p { font-size: 14px; line-height: 1.65; }
        .home-hero__actions { align-items: flex-start; flex-direction: column; gap: 13px; margin-top: 20px; }
        .home-hero__community { top: 14px; right: 14px; max-width: calc(100% - 28px); padding: 9px 11px; }
        .home-hero__community small { font-size: 9px; }
        .home-hero__prompt { align-items: flex-start; flex-wrap: wrap; gap: 11px; width: calc(100% - 20px); margin-top: -28px; padding: 14px; border-radius: 13px; }
        .home-hero__prompt-copy { min-width: calc(100% - 56px); }
        .home-hero__prompt-link { margin-left: 53px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .home-page *, .home-page *::before, .home-page *::after { scroll-behavior: auto !important; }
      }
    `}</style>
    <SiteFooter />
  </main>;
}
