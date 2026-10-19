"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock3, Instagram, Linkedin, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const contactOptions = [
  {
    title: "Écrivez-nous",
    detail: "Parlez-nous de votre question ou de votre projet.",
    value: "Utilisez le formulaire de contact",
    href: "#contact-form",
    icon: Mail,
  },
  {
    title: "Notre présence",
    detail: "Une plateforme tournée vers les écosystèmes locaux.",
    value: "Communauté panafricaine",
    icon: MapPin,
  },
] as const;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="contact-page">
      <SiteHeader />
      <section className="contact-hero">
        <div className="container">
          <motion.span className="contact-kicker" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <MessageCircle size={15} /> Parlons de votre projet
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
            Une question ?<br />On est à votre écoute.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
            Dites-nous ce qui vous amène. Nous ferons de notre mieux pour vous orienter vers la bonne prochaine étape.
          </motion.p>
        </div>
      </section>

      <section className="contact-main">
        <div className="container contact-layout">
          <motion.div className="contact-sidebar" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }}>
            <div className="contact-sidebar__intro">
              <span className="contact-kicker">Restons en contact</span>
              <h2>Les bonnes conversations font avancer les idées.</h2>
              <p>Que vous portiez un projet ou que vous souhaitiez collaborer avec nous, votre message compte.</p>
            </div>

            <div className="contact-options">
              {contactOptions.map((option) => {
                const { title, detail, value, icon: Icon } = option;
                const content = (
                  <>
                    <span className="contact-option__icon"><Icon size={19} /></span>
                    <span className="contact-option__copy"><strong>{title}</strong><small>{detail}</small><b>{value}</b></span>
                  </>
                );
                return "href" in option ? (
                  <a className="contact-option" href={option.href} key={title}>{content}</a>
                ) : (
                  <div className="contact-option" key={title}>{content}</div>
                );
              })}
            </div>

            <div className="contact-hours"><Clock3 size={16} /><span>Nous revenons vers vous dès que possible, généralement sous deux jours ouvrés.</span></div>
            <div className="contact-socials" aria-label="Réseaux sociaux">
              <span>Suivez l&apos;aventure</span>
              <a href="https://www.linkedin.com/" aria-label="LinkedIn"><Linkedin size={17} /></a>
              <a href="https://www.instagram.com/" aria-label="Instagram"><Instagram size={17} /></a>
            </div>
          </motion.div>

          <motion.div className="contact-form-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            {submitted ? (
              <div className="contact-success" role="status" aria-live="polite">
                <span><Send size={22} /></span>
                <h2>Merci pour votre message.</h2>
                <p>
                  Le formulaire est en mode démonstration : aucun message n&apos;a été envoyé. Il sera relié au service
                  de contact lors de l&apos;intégration backend.
                </p>
                <button className="button button-light" type="button" onClick={() => setSubmitted(false)}>Envoyer un autre message</button>
              </div>
            ) : (
              <>
                <div className="contact-form__heading">
                  <h2>Envoyez-nous un message</h2>
                  <p>Les champs marqués d&apos;un astérisque sont obligatoires.</p>
                </div>
                <form className="contact-form" id="contact-form" onSubmit={handleSubmit}>
                  <div className="contact-form__row">
                    <label>Nom complet <span>*</span><input name="name" autoComplete="name" placeholder="Votre nom" required /></label>
                    <label>Adresse e-mail <span>*</span><input name="email" type="email" autoComplete="email" placeholder="vous@exemple.com" required /></label>
                  </div>
                  <label>Sujet <span>*</span>
                    <select name="subject" defaultValue="" required>
                      <option value="" disabled>Choisissez un sujet</option>
                      <option value="project">Mon projet</option>
                      <option value="opportunity">Une opportunité</option>
                      <option value="partnership">Un partenariat</option>
                      <option value="other">Autre demande</option>
                    </select>
                  </label>
                  <label>Votre message <span>*</span><textarea name="message" rows={5} placeholder="Expliquez-nous comment nous pouvons vous aider..." required /></label>
                  <p className="contact-form__notice">Démonstration frontend : vos informations ne sont ni transmises ni enregistrées.</p>
                  <button className="button contact-submit" type="submit">Envoyer le message <ArrowRight size={16} /></button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>

      <style jsx global>{`
        .contact-page { min-height: 100vh; background: #f8fafc; color: #0f172a; }
        .contact-hero { padding: 70px 0 48px; text-align: center; background: radial-gradient(circle at 78% 20%,rgba(109,40,217,.09),transparent 28%),#fff; }
        .contact-kicker { display: inline-flex; align-items: center; gap: 7px; color: #6d28d9; font-size: 12px; font-weight: 750; }
        .contact-hero .contact-kicker { padding: 7px 11px; border: 1px solid #e9ddff; border-radius: 999px; background: #f5f0ff; }
        .contact-hero h1 { margin: 17px 0 11px; font-size: clamp(40px,5.5vw,62px); line-height: 1.03; letter-spacing: -.06em; }
        .contact-hero p { max-width: 630px; margin: 0 auto; color: #64748b; font-size: 16px; line-height: 1.75; }
        .contact-main { padding: 48px 0 88px; }
        .contact-layout { display: grid; grid-template-columns: minmax(270px,.78fr) minmax(0,1.22fr); gap: 28px; align-items: start; }
        .contact-sidebar { padding: 22px 4px 0; }
        .contact-sidebar__intro h2 { margin: 11px 0 10px; font-size: clamp(25px,3vw,34px); line-height: 1.12; letter-spacing: -.05em; }
        .contact-sidebar__intro p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.75; }
        .contact-options { display: grid; gap: 12px; margin-top: 27px; }
        .contact-option { display: flex; align-items: flex-start; gap: 13px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; transition: border-color .2s ease, transform .2s ease; }
        .contact-option:hover { transform: translateY(-2px); border-color: #c4b5fd; }
        .contact-option__icon { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; border-radius: 12px; background: #f3e8ff; color: #6d28d9; }
        .contact-option__copy { display: grid; gap: 4px; }
        .contact-option__copy strong { font-size: 14px; }
        .contact-option__copy small { color: #64748b; font-size: 12px; line-height: 1.5; }
        .contact-option__copy b { margin-top: 3px; color: #6d28d9; font-size: 13px; }
        .contact-hours { display: flex; align-items: flex-start; gap: 9px; margin-top: 20px; color: #64748b; font-size: 12px; line-height: 1.65; }
        .contact-hours svg { flex: 0 0 auto; margin-top: 1px; color: #6d28d9; }
        .contact-socials { display: flex; align-items: center; gap: 10px; margin-top: 26px; color: #64748b; font-size: 12px; }
        .contact-socials span { margin-right: 4px; }
        .contact-socials a { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; color: #475569; transition: .2s ease; }
        .contact-socials a:hover { border-color: #c4b5fd; color: #6d28d9; }
        .contact-form-card { min-height: 480px; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background: #fff; box-shadow: 0 18px 40px rgba(15,23,42,.045); }
        .contact-form__heading h2 { margin: 0 0 5px; font-size: 21px; letter-spacing: -.04em; }
        .contact-form__heading p { margin: 0; color: #64748b; font-size: 13px; }
        .contact-form { display: grid; gap: 17px; margin-top: 23px; }
        .contact-form label { display: grid; gap: 7px; color: #334155; font-size: 13px; font-weight: 700; }
        .contact-form label > span { display: inline; margin-left: 2px; color: #ea580c; }
        .contact-form input,.contact-form select,.contact-form textarea { width: 100%; min-width: 0; border: 1px solid #e2e8f0; border-radius: 11px; outline: none; background: #fff; color: #0f172a; font: inherit; font-size: 14px; font-weight: 400; transition: border-color .2s ease, box-shadow .2s ease; }
        .contact-form input,.contact-form select { height: 46px; padding: 0 12px; }
        .contact-form textarea { resize: vertical; min-height: 130px; padding: 12px; line-height: 1.6; }
        .contact-form input::placeholder,.contact-form textarea::placeholder { color: #94a3b8; }
        .contact-form input:focus,.contact-form select:focus,.contact-form textarea:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(109,40,217,.11); }
        .contact-form__row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .contact-form__notice { margin: -3px 0 0; color: #64748b; font-size: 12px; line-height: 1.6; }
        .contact-submit { justify-self: start; border: 0; cursor: pointer; }
        .contact-success { display: flex; min-height: 420px; flex-direction: column; align-items: flex-start; justify-content: center; }
        .contact-success > span { display: grid; width: 48px; height: 48px; place-items: center; border-radius: 15px; background: #f3e8ff; color: #6d28d9; }
        .contact-success h2 { margin: 18px 0 8px; font-size: 26px; letter-spacing: -.04em; }
        .contact-success p { max-width: 470px; margin: 0 0 22px; color: #64748b; font-size: 14px; line-height: 1.75; }
        @media (max-width: 850px) { .contact-layout { grid-template-columns: 1fr; gap: 30px; } .contact-sidebar { padding-top: 0; } .contact-sidebar__intro { max-width: 620px; } .contact-options { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 600px) { .contact-hero { padding: 54px 0 36px; } .contact-main { padding: 32px 0 60px; } .contact-options,.contact-form__row { grid-template-columns: 1fr; } .contact-form-card { min-height: 0; padding: 21px; border-radius: 17px; } .contact-submit { width: 100%; } }
        @media (prefers-reduced-motion: reduce) { .contact-page *, .contact-page *::before, .contact-page *::after { scroll-behavior: auto !important; } }
      `}</style>
      <SiteFooter />
    </main>
  );
}
