"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, CircleHelp, Search } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const faqItems = [
  {
    category: "La plateforme",
    question: "Qu'est-ce qu'AfriLaunch ?",
    answer:
      "AfriLaunch est une plateforme conçue pour aider les porteurs de projets africains à structurer leurs idées, découvrir des opportunités pertinentes et suivre leurs démarches.",
  },
  {
    category: "La plateforme",
    question: "À qui s'adresse AfriLaunch ?",
    answer:
      "La plateforme s'adresse aux entrepreneurs, aux équipes de projet et aux organisations qui souhaitent faire avancer des initiatives à impact en Afrique.",
  },
  {
    category: "Projets",
    question: "Puis-je présenter un projet qui est encore au stade de l'idée ?",
    answer:
      "Oui. Le parcours est pensé pour accompagner différents niveaux de maturité. Vous pourrez préciser votre idée, le problème traité, votre solution et les prochaines étapes.",
  },
  {
    category: "Opportunités",
    question: "Les opportunités sont-elles réservées à un pays ou à un secteur ?",
    answer:
      "Les critères dépendent de chaque programme. Consultez la localisation, le secteur, les conditions d'éligibilité et la date limite indiqués sur chaque fiche avant de préparer votre candidature.",
  },
  {
    category: "Opportunités",
    question: "AfriLaunch garantit-il l'obtention d'un financement ?",
    answer:
      "Non. AfriLaunch facilite la préparation et la découverte d'opportunités, mais chaque organisation partenaire reste responsable de ses critères et de ses décisions.",
  },
  {
    category: "Compte",
    question: "Dois-je créer un compte pour utiliser la plateforme ?",
    answer:
      "Vous pouvez découvrir les pages publiques sans compte. La création d'un compte sera utile pour enregistrer un projet et suivre vos candidatures lorsque ces fonctions seront activées.",
  },
  {
    category: "Compte",
    question: "Comment mes informations sont-elles utilisées ?",
    answer:
      "Cette version de démonstration utilise des contenus d'exemple et n'est reliée à aucun service de stockage. Avant la mise en production, les modalités de traitement et de confidentialité devront être précisées.",
  },
] as const;

const categories = ["Toutes", ...Array.from(new Set(faqItems.map((item) => item.category)))];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>("Toutes");
  const [search, setSearch] = useState("");
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);

  const visibleItems = faqItems
    .map((item, index) => ({ ...item, index }))
    .filter((item) => {
      const categoryMatches = activeCategory === "Toutes" || item.category === activeCategory;
      const normalizedSearch = search.trim().toLocaleLowerCase("fr");
      const searchMatches =
        !normalizedSearch ||
        item.question.toLocaleLowerCase("fr").includes(normalizedSearch) ||
        item.answer.toLocaleLowerCase("fr").includes(normalizedSearch);
      return categoryMatches && searchMatches;
    });

  return (
    <main className="faq-page">
      <SiteHeader />
      <section className="faq-hero">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="faq-kicker"><CircleHelp size={15} /> Centre d&apos;aide</span>
            <h1>Les réponses pour avancer sereinement.</h1>
            <p>Retrouvez les informations essentielles sur AfriLaunch, les projets et les opportunités.</p>
          </motion.div>
          <div className="faq-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Rechercher dans les questions fréquentes"
              placeholder="Rechercher une question..."
            />
          </div>
        </div>
      </section>

      <section className="faq-content">
        <div className="container">
          <div className="faq-categories" aria-label="Filtrer les questions par catégorie">
            {categories.map((category) => (
              <button
                className={category === activeCategory ? "faq-category is-active" : "faq-category"}
                type="button"
                key={category}
                aria-pressed={category === activeCategory}
                onClick={() => {
                  setActiveCategory(category);
                  setOpenQuestion(null);
                }}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="faq-list">
            {visibleItems.map((item) => {
              const isOpen = openQuestion === item.index;
              const answerId = `faq-answer-${item.index}`;
              return (
                <motion.article className="faq-item" key={item.question} layout>
                  <button
                    className="faq-question"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenQuestion(isOpen ? null : item.index)}
                  >
                    <span><small>{item.category}</small>{item.question}</span>
                    <ChevronDown className={isOpen ? "faq-chevron is-open" : "faq-chevron"} size={19} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={answerId}
                        className="faq-answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: "easeInOut" }}
                      >
                        <p>{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              );
            })}
            {visibleItems.length === 0 && (
              <div className="faq-empty">
                <h2>Aucune réponse trouvée</h2>
                <p>Essayez un autre mot-clé ou choisissez une autre catégorie.</p>
                <button type="button" className="faq-reset" onClick={() => { setSearch(""); setActiveCategory("Toutes"); }}>
                  Effacer les filtres
                </button>
              </div>
            )}
          </div>

          <motion.aside className="faq-contact" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div><h2>Vous ne trouvez pas votre réponse ?</h2><p>Notre équipe sera ravie d&apos;en savoir plus sur votre question.</p></div>
            <a className="button" href="/contact">Nous contacter <ArrowRight size={16} /></a>
          </motion.aside>
        </div>
      </section>

      <style jsx global>{`
        .faq-page { min-height: 100vh; background: #f8fafc; color: #0f172a; }
        .faq-hero { padding: 76px 0 36px; background: radial-gradient(circle at 80% 0,rgba(109,40,217,.1),transparent 32%),#fff; }
        .faq-hero .container { text-align: center; }
        .faq-kicker { display: inline-flex; align-items: center; gap: 8px; padding: 7px 11px; border-radius: 999px; color: #6d28d9; background: #f3e8ff; font-size: 12px; font-weight: 750; }
        .faq-hero h1 { max-width: 760px; margin: 18px auto 10px; font-size: clamp(38px,5vw,58px); line-height: 1.05; letter-spacing: -.055em; }
        .faq-hero p { margin: 0 auto; color: #64748b; font-size: 16px; line-height: 1.7; }
        .faq-search { display: flex; align-items: center; gap: 11px; max-width: 580px; height: 52px; margin: 28px auto 0; padding: 0 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; box-shadow: 0 10px 26px rgba(15,23,42,.045); color: #64748b; }
        .faq-search:focus-within { border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(109,40,217,.1); }
        .faq-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: #0f172a; font: inherit; }
        .faq-content { padding: 38px 0 84px; }
        .faq-categories { display: flex; justify-content: center; flex-wrap: wrap; gap: 9px; margin-bottom: 24px; }
        .faq-category { min-height: 38px; padding: 0 14px; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; color: #475569; font-size: 13px; font-weight: 650; cursor: pointer; transition: .2s ease; }
        .faq-category:hover { border-color: #c4b5fd; color: #6d28d9; }
        .faq-category.is-active { border-color: #6d28d9; background: #6d28d9; color: #fff; }
        .faq-list { max-width: 850px; margin: 0 auto; display: grid; gap: 11px; }
        .faq-item { overflow: hidden; border: 1px solid #e2e8f0; border-radius: 15px; background: #fff; box-shadow: 0 9px 22px rgba(15,23,42,.025); }
        .faq-question { display: flex; width: 100%; justify-content: space-between; align-items: center; gap: 18px; padding: 19px 21px; border: 0; background: transparent; text-align: left; color: #0f172a; font-size: 16px; font-weight: 700; cursor: pointer; }
        .faq-question span { display: grid; gap: 5px; }
        .faq-question small { color: #6d28d9; font-size: 11px; font-weight: 750; letter-spacing: .04em; text-transform: uppercase; }
        .faq-chevron { flex: 0 0 auto; color: #64748b; transition: transform .2s ease; }
        .faq-chevron.is-open { transform: rotate(180deg); color: #6d28d9; }
        .faq-answer { overflow: hidden; }
        .faq-answer p { margin: 0; padding: 0 52px 20px 21px; color: #64748b; font-size: 14px; line-height: 1.8; }
        .faq-empty { padding: 32px 20px; border: 1px dashed #cbd5e1; border-radius: 16px; text-align: center; background: #fff; }
        .faq-empty h2 { margin: 0 0 7px; font-size: 20px; }
        .faq-empty p { margin: 0 0 14px; color: #64748b; }
        .faq-reset { border: 0; background: none; color: #6d28d9; font: inherit; font-weight: 700; cursor: pointer; }
        .faq-contact { max-width: 850px; margin: 26px auto 0; display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 17px; background: #fff; }
        .faq-contact h2 { margin: 0 0 5px; font-size: 18px; letter-spacing: -.03em; }
        .faq-contact p { margin: 0; color: #64748b; font-size: 14px; }
        @media (max-width: 620px) { .faq-hero { padding: 54px 0 28px; } .faq-content { padding: 28px 0 60px; } .faq-question { padding: 17px; font-size: 15px; } .faq-answer p { padding: 0 17px 18px; } .faq-contact { align-items: flex-start; flex-direction: column; padding: 20px; } }
        @media (prefers-reduced-motion: reduce) { .faq-page *, .faq-page *::before, .faq-page *::after { scroll-behavior: auto !important; } }
      `}</style>
      <SiteFooter />
    </main>
  );
}
