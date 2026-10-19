"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  Handshake,
  HeartHandshake,
  Lightbulb,
  MapPinned,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const principles = [
  {
    title: "Ancrés dans nos réalités",
    description:
      "Nous partons des besoins et des contextes de terrain pour rapprocher les fondateurs des opportunités qui leur correspondent.",
    icon: MapPinned,
    tone: "violet",
  },
  {
    title: "La confiance avant tout",
    description:
      "Nous voulons rendre les parcours plus lisibles, les informations plus accessibles et chaque prochaine étape plus claire.",
    icon: ShieldCheck,
    tone: "orange",
  },
  {
    title: "Grandir ensemble",
    description:
      "Les projets avancent mieux quand fondateurs, experts et partenaires peuvent se rencontrer et partager leurs expériences.",
    icon: HeartHandshake,
    tone: "green",
  },
] as const;

const milestones = [
  { number: "01", title: "Une idée mérite d'être entendue", text: "Tout commence par une ambition et la volonté de répondre à un vrai besoin." },
  { number: "02", title: "Un projet gagne à être structuré", text: "Des outils et des repères aident à rendre cette ambition plus claire et plus crédible." },
  { number: "03", title: "La bonne rencontre peut tout accélérer", text: "Nous rapprochons les porteurs de projets des programmes, financements et personnes utiles." },
] as const;

const impactAreas = [
  { title: "Des projets plus lisibles", text: "Aider chaque fondateur à présenter clairement son besoin, sa solution et son ambition.", icon: Lightbulb },
  { title: "Des connexions plus utiles", text: "Faire gagner du temps en rapprochant les projets des programmes et partenaires adaptés.", icon: Network },
  { title: "Des avancées concrètes", text: "Donner des repères pour transformer une première idée en prochaines étapes réalistes.", icon: Rocket },
] as const;

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export default function AboutPage() {
  return (
    <main className="about-page">
      <SiteHeader />

      <section className="about-hero">
        <div className="container about-hero__grid">
          <motion.div
            className="about-hero__copy"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <span className="about-eyebrow"><Sparkles size={14} /> Notre raison d&apos;être</span>
            <h1>Le talent est partout. Les opportunités devraient l&apos;être aussi.</h1>
            <p>
              AfriLaunch aide les porteurs de projets africains à structurer leurs idées et à trouver les
              ressources, les programmes et les partenaires pour avancer.
            </p>
            <a href="#mission" className="button about-hero__link">
              Découvrir notre mission <ArrowRight size={17} />
            </a>
          </motion.div>

          <motion.div
            className="about-hero__visual"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            aria-label="Illustration symbolisant la communauté AfriLaunch"
          >
            <div className="about-visual__orbit about-visual__orbit--outer" />
            <div className="about-visual__orbit about-visual__orbit--inner" />
            <motion.div
              className="about-visual__center"
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="about-visual__spark"><Lightbulb size={24} /></span>
              <strong>Une idée.</strong>
              <strong>Des possibles.</strong>
              <span>À construire ensemble.</span>
            </motion.div>
            <span className="about-node about-node--one"><Target size={17} /> Impact</span>
            <span className="about-node about-node--two"><Handshake size={17} /> Rencontres</span>
            <span className="about-node about-node--three"><Compass size={17} /> Cap</span>
          </motion.div>
        </div>
      </section>

      <section className="about-intro" id="mission">
        <motion.div className="container about-intro__grid" {...fadeUp}>
          <div>
            <span className="about-kicker">Pourquoi AfriLaunch</span>
            <h2>Beaucoup d&apos;idées fortes. Trop peu de chemins clairement balisés.</h2>
          </div>
          <div className="about-intro__text">
            <p>
              Les entrepreneurs africains créent des solutions essentielles pour leurs communautés. Pourtant,
              trouver le bon programme, préparer un dossier solide ou identifier un partenaire peut rester
              compliqué et prendre beaucoup de temps.
            </p>
            <p>
              AfriLaunch est pensé comme un point de départ plus simple : un espace pour clarifier son projet,
              découvrir des opportunités pertinentes et avancer avec davantage de confiance.
            </p>
          </div>
        </motion.div>
      </section>

      <section className="about-journey">
        <div className="container">
          <motion.div className="about-section-heading" {...fadeUp}>
            <span className="about-kicker">Notre approche</span>
            <h2>Un peu plus de clarté à chaque étape.</h2>
            <p>Pas de raccourci magique : des outils utiles, de bonnes informations et des connexions qui comptent.</p>
          </motion.div>
          <div className="about-milestones">
            {milestones.map((item, index) => (
              <motion.article
                className="about-milestone"
                key={item.number}
                {...fadeUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <span className="about-milestone__number">{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="container">
          <motion.div className="about-section-heading" {...fadeUp}>
            <span className="about-kicker">Ce qui nous guide</span>
            <h2>Une ambition forte, une approche profondément humaine.</h2>
          </motion.div>
          <div className="about-values__grid">
            {principles.map(({ title, description, icon: Icon, tone }, index) => (
              <motion.article
                className="about-value"
                key={title}
                {...fadeUp}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
              >
                <span className={`about-value__icon about-value__icon--${tone}`}><Icon size={21} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-vision">
        <motion.div className="container about-vision__grid" {...fadeUp}>
          <div className="about-vision__mark"><Compass size={25} /></div>
          <div>
            <span className="about-kicker">Notre vision</span>
            <h2>Un écosystème où chaque projet peut trouver son prochain pas.</h2>
            <p>
              Nous voulons contribuer à un avenir où l’accès à l’accompagnement et aux opportunités dépend
              moins du lieu où l’on se trouve ou des contacts que l’on possède. Une ambition collective,
              construite avec les entrepreneurs et les acteurs de terrain.
            </p>
          </div>
        </motion.div>
      </section>

      <section className="about-impact">
        <div className="container">
          <motion.div className="about-section-heading" {...fadeUp}>
            <span className="about-kicker">L’impact que nous visons</span>
            <h2>Faire de l’accès aux opportunités un vrai levier d’action.</h2>
            <p>Notre impact se mesure aux avancées des projets, pas à des promesses abstraites.</p>
          </motion.div>
          <div className="about-impact__grid">
            {impactAreas.map(({ title, text, icon: Icon }, index) => (
              <motion.article className="about-impact__item" key={title} {...fadeUp} transition={{ duration: 0.5, delay: index * 0.08 }}>
                <span><Icon size={20} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-team">
        <div className="container about-team__grid">
          <motion.div {...fadeUp}>
            <span className="about-kicker">Une aventure collective</span>
            <h2>Une plateforme pensée avec celles et ceux qui font avancer les projets.</h2>
            <p>
              AfriLaunch se construit à l’écoute des fondateurs, des experts et des organisations qui font
              vivre l’écosystème entrepreneurial africain. Leurs expériences guident les outils et les
              connexions que nous développons.
            </p>
          </motion.div>
          <div className="about-team__roles">
            {[
              { label: "Les porteurs de projets", detail: "Leurs besoins orientent nos priorités.", initials: "P", tone: "violet" },
              { label: "Les experts et mentors", detail: "Leur expérience aide à franchir les étapes.", initials: "E", tone: "orange" },
              { label: "Les partenaires", detail: "Leurs programmes ouvrent de nouvelles voies.", initials: "A", tone: "green" },
            ].map((role, index) => (
              <motion.article className="about-team__role" key={role.label} {...fadeUp} transition={{ duration: 0.45, delay: index * 0.08 }}>
                <span className={`about-team__avatar about-team__avatar--${role.tone}`}>{role.initials}</span>
                <div><h3>{role.label}</h3><p>{role.detail}</p></div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-cta-section">
        <motion.div className="container" {...fadeUp}>
          <div className="about-cta">
            <div>
              <span className="about-eyebrow about-eyebrow--light">La suite commence ici</span>
              <h2>Votre projet a sa place dans cette histoire.</h2>
              <p>Faites le premier pas : explorez les opportunités ou prenez le temps de structurer votre idée.</p>
            </div>
            <div className="about-cta__actions">
              <a className="button" href="/opportunities">Explorer les opportunités <ArrowRight size={17} /></a>
              <a className="about-cta__secondary" href="/register">Lancer mon projet</a>
            </div>
          </div>
        </motion.div>
      </section>

      <style jsx global>{`
        .about-page { background: #f8fafc; color: #0f172a; overflow: hidden; }
        .about-hero { padding: 78px 0 72px; background: radial-gradient(circle at 78% 30%, rgba(109,40,217,.09), transparent 30%), linear-gradient(180deg,#fff 0%,#f8fafc 100%); }
        .about-hero__grid { display: grid; grid-template-columns: minmax(0,1.1fr) minmax(360px,.9fr); gap: 48px; align-items: center; }
        .about-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 7px 11px; border: 1px solid #e9ddff; border-radius: 999px; background: #f5f0ff; color: #6d28d9; font-size: 12px; font-weight: 700; }
        .about-hero__copy h1 { max-width: 720px; margin: 20px 0 18px; font-size: clamp(42px,5.2vw,64px); line-height: 1.03; letter-spacing: -.06em; }
        .about-hero__copy p { max-width: 590px; margin: 0; color: #64748b; font-size: 17px; line-height: 1.75; }
        .about-hero__link { margin-top: 27px; }
        .about-hero__visual { min-height: 410px; position: relative; display: grid; place-items: center; }
        .about-visual__orbit { position: absolute; border: 1px solid rgba(109,40,217,.14); border-radius: 50%; }
        .about-visual__orbit--outer { width: 360px; height: 360px; }
        .about-visual__orbit--inner { width: 250px; height: 250px; border-style: dashed; border-color: rgba(249,115,22,.24); }
        .about-visual__center { position: relative; z-index: 1; width: 194px; height: 194px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #e9ddff; border-radius: 38% 62% 54% 46% / 51% 43% 57% 49%; background: rgba(255,255,255,.92); box-shadow: 0 24px 60px rgba(15,23,42,.1); transform: rotate(-3deg); }
        .about-visual__center strong { font-size: 19px; line-height: 1.2; letter-spacing: -.04em; }
        .about-visual__center > span:last-child { margin-top: 7px; color: #64748b; font-size: 11px; }
        .about-visual__spark { width: 44px; height: 44px; margin-bottom: 12px; display: grid; place-items: center; border-radius: 14px; background: #f3e8ff; color: #6d28d9; }
        .about-node { position: absolute; z-index: 2; display: inline-flex; align-items: center; gap: 8px; padding: 11px 14px; border: 1px solid #e2e8f0; border-radius: 13px; background: #fff; box-shadow: 0 12px 28px rgba(15,23,42,.07); color: #334155; font-size: 13px; font-weight: 700; }
        .about-node svg { color: #6d28d9; }
        .about-node--one { top: 46px; left: 14%; }
        .about-node--two { top: 48%; right: 0; }
        .about-node--three { bottom: 32px; left: 18%; }
        .about-intro { padding: 88px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; background: #fff; }
        .about-intro__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: start; }
        .about-kicker { color: #6d28d9; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .about-intro h2,.about-section-heading h2 { margin: 13px 0 0; font-size: clamp(30px,3.5vw,43px); line-height: 1.12; letter-spacing: -.05em; }
        .about-intro__text p { margin: 0 0 15px; color: #64748b; font-size: 16px; line-height: 1.8; }
        .about-intro__text p:last-child { margin-bottom: 0; }
        .about-journey,.about-values { padding: 88px 0; }
        .about-section-heading { max-width: 680px; margin: 0 auto 38px; text-align: center; }
        .about-section-heading > p { max-width: 590px; margin: 14px auto 0; color: #64748b; line-height: 1.75; }
        .about-milestones { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 18px; }
        .about-milestone { min-height: 220px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; box-shadow: 0 14px 32px rgba(15,23,42,.035); }
        .about-milestone__number { display: inline-grid; width: 38px; height: 38px; place-items: center; border-radius: 12px; background: #f3e8ff; color: #6d28d9; font-size: 12px; font-weight: 800; }
        .about-milestone h3,.about-value h3 { margin: 20px 0 8px; font-size: 19px; letter-spacing: -.035em; }
        .about-milestone p,.about-value p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.75; }
        .about-values { background: #fff; border-top: 1px solid #e2e8f0; }
        .about-values__grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 18px; }
        .about-value { min-height: 240px; padding: 26px; border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; box-shadow: 0 14px 32px rgba(15,23,42,.035); transition: box-shadow .25s ease; }
        .about-value:hover { box-shadow: 0 20px 38px rgba(15,23,42,.08); }
        .about-value__icon { display: grid; width: 46px; height: 46px; place-items: center; border-radius: 14px; }
        .about-value__icon--violet { background: #f3e8ff; color: #6d28d9; }
        .about-value__icon--orange { background: #fff1e8; color: #ea580c; }
        .about-value__icon--green { background: #ecfdf5; color: #16a34a; }
        .about-value h3 { margin-top: 18px; }
        .about-vision { padding: 76px 0; background: #f3efff; }
        .about-vision__grid { display: grid; grid-template-columns: 58px minmax(0,720px); justify-content: center; gap: 22px; align-items: start; }
        .about-vision__mark { display: grid; width: 52px; height: 52px; place-items: center; border-radius: 16px; background: #fff; color: #6d28d9; box-shadow: 0 8px 22px rgba(109,40,217,.1); }
        .about-vision h2,.about-team h2 { margin: 12px 0; font-size: clamp(30px,3.5vw,42px); line-height: 1.12; letter-spacing: -.05em; }
        .about-vision p,.about-team__grid > div:first-child > p { margin: 0; color: #64748b; font-size: 15px; line-height: 1.8; }
        .about-impact { padding: 82px 0; }
        .about-impact__grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 18px; }
        .about-impact__item { padding: 24px; border-left: 2px solid #ddd6fe; }
        .about-impact__item > span { color: #6d28d9; }
        .about-impact__item h3 { margin: 12px 0 7px; font-size: 18px; letter-spacing: -.035em; }
        .about-impact__item p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.75; }
        .about-team { padding: 82px 0; background: #fff; border-top: 1px solid #e2e8f0; }
        .about-team__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
        .about-team__roles { display: grid; gap: 12px; }
        .about-team__role { display: flex; align-items: center; gap: 14px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 15px; background: #fff; }
        .about-team__avatar { display: grid; width: 44px; height: 44px; flex: 0 0 auto; place-items: center; border-radius: 14px; font-size: 14px; font-weight: 800; }
        .about-team__avatar--violet { background: #f3e8ff; color: #6d28d9; }
        .about-team__avatar--orange { background: #fff1e8; color: #ea580c; }
        .about-team__avatar--green { background: #ecfdf5; color: #16a34a; }
        .about-team__role h3 { margin: 0 0 3px; font-size: 15px; }
        .about-team__role p { margin: 0; color: #64748b; font-size: 13px; }
        .about-cta-section { padding: 0 0 88px; }
        .about-cta { display: flex; justify-content: space-between; align-items: center; gap: 30px; padding: 42px; border-radius: 24px; background: linear-gradient(125deg,#1f2937,#111827 58%,#312e81); color: #fff; box-shadow: 0 26px 55px rgba(49,46,129,.15); }
        .about-eyebrow--light { border-color: rgba(255,255,255,.16); background: rgba(255,255,255,.08); color: #fff; }
        .about-cta h2 { max-width: 620px; margin: 14px 0 9px; font-size: clamp(30px,3.5vw,43px); line-height: 1.1; letter-spacing: -.05em; }
        .about-cta p { max-width: 570px; margin: 0; color: #cbd5e1; line-height: 1.7; }
        .about-cta__actions { display: flex; flex-direction: column; align-items: flex-start; gap: 13px; flex-shrink: 0; }
        .about-cta__actions .button { background: #fff; color: #0f172a; white-space: nowrap; }
        .about-cta__actions .button:hover { color: #6d28d9; }
        .about-cta__secondary { padding: 5px 0; color: #e2e8f0; font-size: 14px; font-weight: 650; }
        .about-cta__secondary:hover { color: #fff; }
        @media (max-width: 900px) { .about-hero__grid { grid-template-columns: 1fr; gap: 24px; } .about-hero__copy { max-width: 740px; } .about-hero__visual { min-height: 370px; } .about-intro__grid,.about-team__grid { gap: 36px; } .about-cta { align-items: flex-start; flex-direction: column; } .about-cta__actions { flex-direction: row; flex-wrap: wrap; align-items: center; } }
        @media (max-width: 650px) { .about-hero { padding: 54px 0 44px; } .about-hero__grid { gap: 14px; } .about-hero__copy h1 { font-size: clamp(38px,10vw,48px); } .about-hero__copy p { font-size: 15px; } .about-hero__visual { min-height: 315px; } .about-visual__orbit--outer { width: 290px; height: 290px; } .about-visual__orbit--inner { width: 205px; height: 205px; } .about-node { padding: 9px 11px; font-size: 11px; } .about-node--one { top: 18px; left: 3%; } .about-node--two { right: -4px; } .about-node--three { bottom: 10px; left: 6%; } .about-intro,.about-journey,.about-values,.about-impact,.about-team,.about-vision { padding: 62px 0; } .about-intro__grid,.about-team__grid { grid-template-columns: 1fr; gap: 22px; } .about-vision__grid { grid-template-columns: 1fr; gap: 16px; } .about-intro h2,.about-section-heading h2,.about-vision h2,.about-team h2 { font-size: 32px; } .about-section-heading { text-align: left; margin-bottom: 26px; } .about-section-heading > p { margin-left: 0; } .about-milestones,.about-values__grid,.about-impact__grid { grid-template-columns: 1fr; } .about-milestone,.about-value { min-height: 0; padding: 22px; } .about-cta-section { padding-bottom: 62px; } .about-cta { padding: 28px 22px; border-radius: 19px; } .about-cta__actions { align-items: flex-start; flex-direction: column; } }
        @media (prefers-reduced-motion: reduce) { .about-page *, .about-page *::before, .about-page *::after { scroll-behavior: auto !important; } }
      `}</style>
      <SiteFooter />
    </main>
  );
}
