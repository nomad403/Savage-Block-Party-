"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import TextRevealLines from "@/components/text-reveal-lines";
import { useMenu } from "@/hooks/useMenu";

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

if (typeof document !== 'undefined' && !document.getElementById('text-reveal-styles')) {
  const style = document.createElement('style');
  style.id = 'text-reveal-styles';
  style.textContent = textRevealStyle;
  document.head.appendChild(style);
}

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
  const { isMenuOpen } = useMenu();

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
    <main id="presse-root" className="w-full -mt-32 md:-mt-20 relative">
      {/* Image de fond fullscreen fixe */}
      <div className="fixed inset-0 w-full h-full z-0">
        <Image
          src="/presse/images/fond.jpg"
          alt="Fond presse"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Overlay violet foncé pour la lisibilité */}
        <div className="absolute inset-0 bg-cyan-400/40" />
      </div>

      {/* Formulaire avec fond couleur uni par-dessus */}
      <section className={`relative z-10 pt-56 pb-32 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ "--presse-accent": "#A855F7" } as React.CSSProperties}>
        <div className="container-px w-full max-w-6xl mx-auto">
            <div className="w-full lg:w-[80%] lg:mx-auto">
              <div className="mb-8 text-left">
                <TextRevealLines 
                  text={"Collaboration"} 
                  color="#A855F7" 
                  className="font-title uppercase text-3xl sm:text-4xl md:text-5xl text-black" 
                  delayStep={0.12}
                />
              </div>
              <div className="space-y-0 text-left w-full mb-8">
                <TextRevealLines 
                  text={"Soutenez la culture indépendante : musique, danse, graffiti et médias urbains. Co-créons des formats exigeants, roots et inclusifs, ancrés dans le réel. Rejoignez un réseau d’artistes, lieux et labels pour faire rayonner l’underground."}
                  color="#A855F7"
                  delayStep={0.12}
                  className="font-text font-semibold text-xl md:text-2xl leading-[1.18] text-black max-w-[48ch] md:max-w-[54ch] tracking-tight"
                />
              </div>
            {/* Formulaire à droite */}
            <form onSubmit={handleSubmit} className="min-w-0 flex flex-col gap-6 items-stretch w-full mt-8">
                {/* Nom de l'organisme */}
                <div>
                  <label htmlFor="organisme" className="block font-text font-bold text-black leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Nom de l'organisme"} color="#A855F7" className="font-text font-bold text-base md:text-lg text-black" delayStep={0.06} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full">
                    <input
                      type="text"
                      id="organisme"
                      name="organisme"
                      value={formData.organisme}
                      onChange={handleChange}
                      placeholder="Nom officiel"
                      className="w-full px-4 py-3 bg-transparent border-2 border-[var(--presse-accent)] focus:border-[var(--presse-accent)] focus:outline-none text-[var(--presse-accent)] focus:text-black placeholder:text-[var(--presse-accent)] placeholder:opacity-100 placeholder:font-semibold placeholder-title caret-[var(--presse-accent)] focus:caret-black font-title transition-colors"
                    />
                  </div>
                </div>

                {/* Email de contact */}
                <div>
                  <label htmlFor="email" className="block font-text font-bold text-black leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Email de contact"} color="#A855F7" className="font-text font-bold text-base md:text-lg text-black" delayStep={0.06} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@organisme.com"
                      className="w-full px-4 py-3 bg-transparent border-2 border-[var(--presse-accent)] focus:border-[var(--presse-accent)] focus:outline-none text-[var(--presse-accent)] focus:text-black placeholder:text-[var(--presse-accent)] placeholder:opacity-100 placeholder:font-semibold placeholder-title caret-[var(--presse-accent)] focus:caret-black font-title transition-colors"
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label htmlFor="phone" className="block font-text font-bold text-black leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Téléphone"} color="#A855F7" className="font-text font-bold text-base md:text-lg text-black" delayStep={0.06} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full">
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full px-4 py-3 bg-transparent border-2 border-[var(--presse-accent)] focus:border-[var(--presse-accent)] focus:outline-none text-[var(--presse-accent)] focus:text-black placeholder:text-[var(--presse-accent)] placeholder:opacity-100 placeholder:font-semibold placeholder-title caret-[var(--presse-accent)] focus:caret-black font-title transition-colors"
                    />
                  </div>
                </div>

                {/* Site / Réseaux */}
                <div>
                  <label htmlFor="website" className="block font-text font-bold text-black leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Site / Réseaux"} color="#A855F7" className="font-text font-bold text-base md:text-lg text-black" delayStep={0.06} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full">
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="site ou @compte"
                      className="w-full px-4 py-3 bg-transparent border-2 border-[var(--presse-accent)] focus:border-[var(--presse-accent)] focus:outline-none text-[var(--presse-accent)] focus:text-black placeholder:text-[var(--presse-accent)] placeholder:opacity-100 placeholder:font-semibold placeholder-title caret-[var(--presse-accent)] focus:caret-black font-title transition-colors"
                    />
                  </div>
                </div>

                {/* Objet */}
                <div>
                  <label htmlFor="subject" className="block font-text font-bold text-black leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Objet"} color="#A855F7" className="font-text font-bold text-base md:text-lg text-black" delayStep={0.06} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full">
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Sujet de la collaboration"
                      className="w-full px-4 py-3 bg-transparent border-2 border-[var(--presse-accent)] focus:border-[var(--presse-accent)] focus:outline-none text-[var(--presse-accent)] focus:text-black placeholder:text-[var(--presse-accent)] placeholder:opacity-100 placeholder:font-semibold placeholder-title caret-[var(--presse-accent)] focus:caret-black font-title transition-colors"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block font-text font-bold text-black leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Votre message"} color="#A855F7" className="font-text font-bold text-base md:text-lg text-black" delayStep={0.06} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full">
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Décrivez votre projet"
                      className="w-full px-4 py-3 bg-transparent border-2 border-[var(--presse-accent)] focus:border-[var(--presse-accent)] focus:outline-none text-[var(--presse-accent)] focus:text-black placeholder:text-[var(--presse-accent)] placeholder:opacity-100 placeholder:font-semibold placeholder-title font-title transition-colors resize-none caret-[var(--presse-accent)] focus:caret-black"
                    />
                  </div>
                </div>
                

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-black text-purple-500 font-title uppercase tracking-wider hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer"}
                </button>
              </div>

              {/* Status messages */}
              {submitStatus === "success" && (
                <div className="px-4 py-3 bg-black text-purple-500 border-2 border-black font-text">
                  Message envoyé avec succès ! Nous vous recontacterons bientôt.
                </div>
              )}
              {submitStatus === "error" && (
                <div className="px-4 py-3 bg-black text-purple-500 border-2 border-black font-text">
                  Erreur lors de l'envoi. Veuillez réessayer.
                </div>
              )}
            </form>
            </div>
        </div>
      </section>
    </main>
  );
}


