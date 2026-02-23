"use client";

import { useState, useEffect, useRef } from "react";
import { TextRevealLines } from "@/components/ui";
import { useMenu } from "@/hooks/useMenu";
import { NormalizedLogo } from "@/components/presse/NormalizedLogo";
import "./presse.css";


import AsicsLogo from "../../../../public/presse/images/asics-6.svg";
import BudLogo from "../../../../public/presse/images/Bud.svg";
import HennessyLogo from "../../../../public/presse/images/Hennessy.svg";
import KonbiniLogo from "../../../../public/presse/images/Konbini.svg";
import ParcVilletteLogo from "../../../../public/presse/images/la-villette.svg";
import RedBullLogo from "../../../../public/presse/images/redbullcom-1.svg";
import VilleParisLogo from "../../../../public/presse/images/ville-de-paris-horizontale.svg";

// Style pour l'effet text reveal line
const textRevealStyle = `
  .text-reveal-line-inline {
    position: relative;
    display: inline-block;
    overflow: visible;
    line-height: 1.2;
  }
  
  .text-reveal-line-inline::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 1.2em;
    background: #A855F7;
    transform-origin: left center;
    transform: scaleX(0);
    z-index: -1;
    animation: reveal-text-1 1.2s ease-out forwards;
    animation-delay: var(--delay, 0s);
  }
  
  @keyframes reveal-text-1 {
    to { transform: scaleX(1); }
  }
`;

// Injection de styles déplacée dans useEffect pour éviter les erreurs d'hydratation

export default function PressePage() {
  const [formData, setFormData] = useState({
    organisme: "",
    email: "",
    phone: "",
    website: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { isMenuOpen } = useMenu();

  // Injection de styles uniquement côté client pour éviter les erreurs d'hydratation
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('text-reveal-styles')) {
      const style = document.createElement('style');
      style.id = 'text-reveal-styles';
      style.textContent = textRevealStyle;
      document.head.appendChild(style);
    }
  }, []);

  // Nettoyer les éléments injectés par les extensions de navigateur (ex: NordPass)
  useEffect(() => {
    const cleanupExtensionElements = () => {
      // Supprimer les éléments nordpass-icon injectés dans les champs de formulaire
      const nordpassIcons = document.querySelectorAll('nordpass-icon');
      nordpassIcons.forEach(icon => {
        const parent = icon.parentElement;
        if (parent && parent.classList.contains('reveal-focus')) {
          icon.remove();
        }
      });
    };

    // Nettoyer immédiatement et après un court délai pour gérer les injections tardives
    cleanupExtensionElements();
    const timeoutId = setTimeout(cleanupExtensionElements, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    // TODO: Intégrer avec votre backend/service d'email
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitStatus("success");
      setFormData({ organisme: "", email: "", phone: "", website: "", subject: "", message: "" });
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="presse-root" className="w-full relative">
      {/* ========================================
          LAYER 1: BACKGROUND VIDEO (FIXED)
          Responsabilité UNIQUE: Afficher la vidéo de fond fullscreen
          Position: fixed, inset-0
          Z-index: var(--z-background) = -1
          Overflow: hidden (pas de scroll)
          ======================================== */}
      <section 
        className="fixed inset-0 w-full h-full overflow-hidden" 
        style={{ zIndex: 'var(--z-background)' }}
        aria-hidden="true"
      >
        <video
          className="absolute inset-0 w-full h-full object-cover filter-infrared"
          autoPlay
          muted
          loop
          playsInline
          style={{ 
            width: '100vw', 
            height: '100vh',
            objectFit: 'cover',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <source src="/presse/videos/teaser.webm" type="video/webm" />
        </video>
      </section>

      {/* Section "Ils ont soutenu le projet" */}
      <section className={`relative flex flex-col md:flex-row items-center justify-center md:items-center transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} presse-intro-section`} style={{ "--presse-accent": "#A855F7" } as React.CSSProperties}>
        <div className="relative w-full presse-intro-inner flex flex-col md:block md:justify-center min-h-[calc(100vh-var(--waveform-height,72px))] md:min-h-0" style={{ paddingLeft: 'clamp(16px, 4vw, 24px)', overflow: 'visible' }}>
          {/* TITRE - mobile: centré verticalement (hors flux), desktop: superposé au centre gauche */}
          <div
            className="presse-intro-title md:absolute relative z-10 md:left-[clamp(16px,4vw,24px)] md:top-1/2 md:-translate-y-1/2"
            style={{ width: 'clamp(200px, 70vw, 400px)' }}
          >
            <div className="space-y-0 text-left" style={{ marginLeft: '-8px', paddingLeft: '8px', overflow: 'visible' }}>
              <TextRevealLines 
                lines={["Ils ont soutenu le projet"]}
                color="#A855F7"
                delayStep={0.12}
                horizontalPadding={8}
                density="normal"
                typography="hanson"
                className="font-title font-bold text-3xl md:text-4xl lg:text-5xl leading-[1.1] text-black tracking-tight uppercase"
              />
            </div>
          </div>

          {/* LOGOS - mobile: zone entre titre et player, desktop: derrière le titre */}
          <div className="presse-logos-area relative z-0 w-full flex flex-1 items-center justify-center md:flex-none md:block">
            <div className="w-full presse-logos-gallery" style={{ overflowX: 'visible', overflowY: 'hidden', marginRight: 0 }}>
              <div className="flex items-center justify-center md:justify-start presse-logos-scroll gap-8 md:gap-12 lg:gap-16">
              {/* Première copie */}
              <div className="flex items-center gap-8 md:gap-12 lg:gap-16 presse-logos-set mr-8 md:mr-12 lg:mr-16" style={{ minWidth: 'fit-content' }}>
                <NormalizedLogo LogoComponent={AsicsLogo} ariaLabel="Asics" targetSize={330} opticalScale={0.7} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={BudLogo} ariaLabel="Bud" targetSize={360} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={HennessyLogo} ariaLabel="Hennessy" targetSize={360} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={KonbiniLogo} ariaLabel="Konbini" targetSize={400} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={ParcVilletteLogo} ariaLabel="Parc de la Villette" targetSize={380} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={RedBullLogo} ariaLabel="Red Bull" targetSize={340} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={VilleParisLogo} ariaLabel="Ville de Paris" targetSize={320} className="flex-shrink-0" />
              </div>
              {/* Deuxième copie pour la boucle infinie */}
              <div className="flex items-center gap-8 md:gap-12 lg:gap-16 presse-logos-set mr-8 md:mr-12 lg:mr-16" style={{ minWidth: 'fit-content' }} aria-hidden="true">
                <NormalizedLogo LogoComponent={AsicsLogo} ariaLabel="Asics" targetSize={330} opticalScale={0.7} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={BudLogo} ariaLabel="Bud" targetSize={360} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={HennessyLogo} ariaLabel="Hennessy" targetSize={360} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={KonbiniLogo} ariaLabel="Konbini" targetSize={400} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={ParcVilletteLogo} ariaLabel="Parc de la Villette" targetSize={380} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={RedBullLogo} ariaLabel="Red Bull" targetSize={364} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={VilleParisLogo} ariaLabel="Ville de Paris" targetSize={320} className="flex-shrink-0" />
              </div>
              {/* Troisième copie pour une meilleure continuité sur large écran */}
              <div className="flex items-center gap-8 md:gap-12 lg:gap-16 presse-logos-set mr-8 md:mr-12 lg:mr-16" style={{ minWidth: 'fit-content' }} aria-hidden="true">
                <NormalizedLogo LogoComponent={AsicsLogo} ariaLabel="Asics" targetSize={330} opticalScale={0.7} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={BudLogo} ariaLabel="Bud" targetSize={360} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={HennessyLogo} ariaLabel="Hennessy" targetSize={360} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={KonbiniLogo} ariaLabel="Konbini" targetSize={400} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={ParcVilletteLogo} ariaLabel="Parc de la Villette" targetSize={380} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={RedBullLogo} ariaLabel="Red Bull" targetSize={340} className="flex-shrink-0" />
                <NormalizedLogo LogoComponent={VilleParisLogo} ariaLabel="Ville de Paris" targetSize={320} className="flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Formulaire avec fond couleur uni par-dessus */}
      <section className={`relative z-10 flex items-center justify-center transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} presse-form-section`} style={{ "--presse-accent": "#A855F7" } as React.CSSProperties}>
        <div className="w-full max-w-6xl mx-auto" style={{ paddingLeft: 'clamp(16px, 4vw, 24px)', paddingRight: 'clamp(16px, 4vw, 24px)' }}>
          {/* Container flex : vertical sur mobile, horizontal à partir de md */}
          <div className="w-full flex flex-col md:flex-row md:items-start gap-8 md:gap-12 lg:gap-16">
            {/* Description à gauche (sur mobile elle est en haut) */}
            <div className="w-full md:w-1/2 md:order-1">
              <div className="space-y-0 text-left" style={{ marginLeft: '-8px', paddingLeft: '8px', overflow: 'visible' }}>
                <TextRevealLines 
                  lines={[
                    "Soutenez la culture indépendante : musique, danse, graffiti",
                    "et médias urbains. Co-créons des formats exigeants, roots",
                    "et inclusifs, ancrés dans le réel.",
                    "Rejoignez un réseau d'artistes, lieux et labels",
                    "pour faire rayonner l'underground."
                  ]}
                  color="#A855F7"
                  delayStep={0.12}
                  horizontalPadding={8}
                  density="normal"
                  typography="cy"
                  className="font-text font-semibold text-base md:text-lg lg:text-xl leading-[1.18] text-black tracking-tight"
                />
              </div>
            </div>

            {/* Formulaire à droite (sur mobile il est en bas) */}
            <div className="w-full md:w-1/2 md:order-2">
              <form onSubmit={handleSubmit} className="min-w-0 flex flex-col gap-3 items-stretch w-full" suppressHydrationWarning={true}>
                {/* Nom de l'organisme */}
                <div suppressHydrationWarning>
                  <label htmlFor="organisme" className="block font-text font-extrabold leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Nom de l'organisme"} color={focusedField === "organisme" ? "#000000" : "#A855F7"} typography="cy" className={`font-text font-extrabold text-sm md:text-base transition-colors ${focusedField === "organisme" ? "text-white !important" : "text-[#A855F7]"}`} delayStep={0.06} horizontalPadding={8} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full relative" suppressHydrationWarning>
                    <div className="absolute bg-[#A855F7] -z-10" style={{ top: 0, bottom: 0, left: '-8px', right: '-8px' }} suppressHydrationWarning />
                    <input
                      type="text"
                      id="organisme"
                      name="organisme"
                      value={formData.organisme}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("organisme")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Nom officiel"
                      className={`relative z-10 w-full px-2 py-1.5 bg-transparent border-0 focus:outline-none placeholder:font-semibold placeholder-title font-title transition-colors text-sm ${focusedField === "organisme" ? "text-white placeholder:opacity-0 caret-white" : "text-black placeholder:opacity-100 placeholder:text-black caret-[var(--presse-accent)]"}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                {/* Email de contact */}
                <div suppressHydrationWarning>
                  <label htmlFor="email" className="block font-text font-bold leading-none mb-0 relative z-[2]" suppressHydrationWarning>
                    <TextRevealLines text={"Email de contact"} color={focusedField === "email" ? "#000000" : "#A855F7"} typography="cy" className={`font-text font-extrabold text-sm md:text-base transition-colors ${focusedField === "email" ? "text-white !important" : "text-black"}`} delayStep={0.06} horizontalPadding={8} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full relative" suppressHydrationWarning>
                    <div className="absolute bg-[#A855F7] -z-10" style={{ top: 0, bottom: 0, left: '-8px', right: '-8px' }} suppressHydrationWarning />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="contact@organisme.com"
                      className={`relative z-10 w-full px-2 py-1.5 bg-transparent border-0 focus:outline-none placeholder:font-semibold placeholder-title font-title transition-colors text-sm ${focusedField === "email" ? "text-white placeholder:opacity-0 caret-white" : "text-black placeholder:opacity-100 placeholder:text-black caret-[var(--presse-accent)]"}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div suppressHydrationWarning>
                  <label htmlFor="phone" className="block font-text font-bold leading-none mb-0 relative z-[2]" suppressHydrationWarning>
                    <TextRevealLines text={"Téléphone"} color={focusedField === "phone" ? "#000000" : "#A855F7"} typography="cy" className={`font-text font-extrabold text-sm md:text-base transition-colors ${focusedField === "phone" ? "text-white !important" : "text-black"}`} delayStep={0.06} horizontalPadding={8} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full relative" suppressHydrationWarning>
                    <div className="absolute bg-[#A855F7] -z-10" style={{ top: 0, bottom: 0, left: '-8px', right: '-8px' }} suppressHydrationWarning />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="+33 6 12 34 56 78"
                      className={`relative z-10 w-full px-2 py-1.5 bg-transparent border-0 focus:outline-none placeholder:font-semibold placeholder-title font-title transition-colors text-sm ${focusedField === "phone" ? "text-white placeholder:opacity-0 caret-white" : "text-black placeholder:opacity-100 placeholder:text-black caret-[var(--presse-accent)]"}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                {/* Site / Réseaux */}
                <div suppressHydrationWarning>
                  <label htmlFor="website" className="block font-text font-bold leading-none mb-0 relative z-[2]" suppressHydrationWarning>
                    <TextRevealLines text={"Site / Réseaux"} color={focusedField === "website" ? "#000000" : "#A855F7"} typography="cy" className={`font-text font-extrabold text-sm md:text-base transition-colors ${focusedField === "website" ? "text-white !important" : "text-black"}`} delayStep={0.06} horizontalPadding={8} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full relative" suppressHydrationWarning>
                    <div className="absolute bg-[#A855F7] -z-10" style={{ top: 0, bottom: 0, left: '-8px', right: '-8px' }} suppressHydrationWarning />
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("website")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="site ou @compte"
                      className={`relative z-10 w-full px-2 py-1.5 bg-transparent border-0 focus:outline-none placeholder:font-semibold placeholder-title font-title transition-colors text-sm ${focusedField === "website" ? "text-white placeholder:opacity-0 caret-white" : "text-black placeholder:opacity-100 placeholder:text-black caret-[var(--presse-accent)]"}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                {/* Objet */}
                <div suppressHydrationWarning>
                  <label htmlFor="subject" className="block font-text font-bold leading-none mb-0 relative z-[2]" suppressHydrationWarning>
                    <TextRevealLines text={"Objet"} color={focusedField === "subject" ? "#000000" : "#A855F7"} typography="cy" className={`font-text font-extrabold text-sm md:text-base transition-colors ${focusedField === "subject" ? "text-white !important" : "text-black"}`} delayStep={0.06} horizontalPadding={8} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full relative" suppressHydrationWarning>
                    <div className="absolute bg-[#A855F7] -z-10" style={{ top: 0, bottom: 0, left: '-8px', right: '-8px' }} suppressHydrationWarning />
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("subject")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Sujet de la collaboration"
                      className={`relative z-10 w-full px-2 py-1.5 bg-transparent border-0 focus:outline-none placeholder:font-semibold placeholder-title font-title transition-colors text-sm ${focusedField === "subject" ? "text-white placeholder:opacity-0 caret-white" : "text-black placeholder:opacity-100 placeholder:text-black caret-[var(--presse-accent)]"}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                {/* Message */}
                <div suppressHydrationWarning>
                  <label htmlFor="message" className="block font-text font-bold leading-none mb-0 relative z-[2]" suppressHydrationWarning>
                    <TextRevealLines text={"Votre message"} color={focusedField === "message" ? "#000000" : "#A855F7"} typography="cy" className={`font-text font-extrabold text-sm md:text-base transition-colors ${focusedField === "message" ? "text-white !important" : "text-black"}`} delayStep={0.06} horizontalPadding={8} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full relative" suppressHydrationWarning>
                    <div className="absolute bg-[#A855F7] -z-10" style={{ top: 0, bottom: 0, left: '-8px', right: '-8px' }} suppressHydrationWarning />
                    <textarea
                      id="message"
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("message")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Décrivez votre projet"
                      className={`relative z-10 w-full px-2 py-1.5 bg-transparent border-0 focus:outline-none placeholder:font-semibold placeholder-title font-title transition-colors resize-none text-sm ${focusedField === "message" ? "text-white placeholder:opacity-0 caret-white" : "text-black placeholder:opacity-100 placeholder:text-black caret-[var(--presse-accent)]"}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
                

              {/* Submit button */}
              <div className="w-full relative">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onFocus={() => setFocusedField("submit")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-3 py-2 bg-black font-title uppercase tracking-wider hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black text-sm ${focusedField === "submit" ? "text-[#A855F7]" : "text-white"}`}
                  style={{ marginLeft: '-8px', marginRight: '-8px', width: 'calc(100% + 16px)' }}
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer"}
                </button>
              </div>

              {/* Status messages */}
              {submitStatus === "success" && (
                <div className="px-2 py-1.5 bg-black text-purple-500 border-2 border-black font-text text-sm">
                  Message envoyé avec succès ! Nous vous recontacterons bientôt.
                </div>
              )}
              {submitStatus === "error" && (
                <div className="px-2 py-1.5 bg-black text-purple-500 border-2 border-black font-text text-sm">
                  Erreur lors de l'envoi. Veuillez réessayer.
                </div>
              )}
            </form>
            </div>
            </div>
        </div>
      </section>
    </main>
  );
}


