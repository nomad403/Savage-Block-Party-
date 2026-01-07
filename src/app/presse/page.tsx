"use client";

import { useState, useEffect, useRef } from "react";
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
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
    <main id="presse-root" className="w-full -mt-32 relative">
      {/* Fond gris comme sur la page shop */}
      <div className="fixed inset-0 w-full h-full z-0 bg-[#e5e5e5]" />

      {/* Formulaire avec fond couleur uni par-dessus */}
      <section className={`relative z-10 pt-56 pb-64 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ "--presse-accent": "#A855F7" } as React.CSSProperties}>
        <div className="container-px w-full max-w-6xl mx-auto">
            <div className="w-full lg:w-[40%] lg:mx-auto">
              <div className="space-y-0 text-left w-full mb-4">
                <TextRevealLines 
                  text={"Soutenez la culture indépendante : musique, danse, graffiti et médias urbains. Co-créons des formats exigeants, roots et inclusifs, ancrés dans le réel. Rejoignez un réseau d'artistes, lieux et labels pour faire rayonner l'underground."}
                  color="#A855F7"
                  delayStep={0.12}
                  className="font-text font-semibold text-sm md:text-base leading-[1.18] text-black max-w-[48ch] md:max-w-[54ch] tracking-tight"
                />
              </div>
            {/* Formulaire à droite */}
            <form onSubmit={handleSubmit} className="min-w-0 flex flex-col gap-3 items-stretch w-full mt-4" suppressHydrationWarning>
                {/* Nom de l'organisme */}
                <div>
                  <label htmlFor="organisme" className="block font-text font-bold leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Nom de l'organisme"} color={focusedField === "organisme" ? "#000000" : "#A855F7"} className={`font-text font-bold text-sm md:text-base transition-colors ${focusedField === "organisme" ? "text-white !important" : "text-[#A855F7]"}`} delayStep={0.06} horizontalPadding={8} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full relative" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-[#A855F7] -z-10" />
                    <input
                      type="text"
                      id="organisme"
                      name="organisme"
                      value={formData.organisme}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("organisme")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Nom officiel"
                      className={`relative z-10 w-full px-2 py-1.5 bg-transparent border-0 focus:outline-none text-[var(--presse-accent)] focus:text-black placeholder:font-semibold placeholder-title font-title transition-colors text-sm ${focusedField === "organisme" ? "placeholder:opacity-0 caret-white" : "placeholder:opacity-100 placeholder:text-black caret-[var(--presse-accent)]"}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                {/* Email de contact */}
                <div>
                  <label htmlFor="email" className="block font-text font-bold leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Email de contact"} color={focusedField === "email" ? "#000000" : "#A855F7"} className={`font-text font-bold text-sm md:text-base transition-colors ${focusedField === "email" ? "text-white !important" : "text-black"}`} delayStep={0.06} horizontalPadding={8} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full relative" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-[#A855F7] -z-10" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="contact@organisme.com"
                      className={`relative z-10 w-full px-2 py-1.5 bg-transparent border-0 focus:outline-none text-[var(--presse-accent)] focus:text-black placeholder:font-semibold placeholder-title font-title transition-colors text-sm ${focusedField === "email" ? "placeholder:opacity-0 caret-white" : "placeholder:opacity-100 placeholder:text-black caret-[var(--presse-accent)]"}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label htmlFor="phone" className="block font-text font-bold leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Téléphone"} color={focusedField === "phone" ? "#000000" : "#A855F7"} className={`font-text font-bold text-sm md:text-base transition-colors ${focusedField === "phone" ? "text-white !important" : "text-black"}`} delayStep={0.06} horizontalPadding={8} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full relative" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-[#A855F7] -z-10" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="+33 6 12 34 56 78"
                      className={`relative z-10 w-full px-2 py-1.5 bg-transparent border-0 focus:outline-none text-[var(--presse-accent)] focus:text-black placeholder:font-semibold placeholder-title font-title transition-colors text-sm ${focusedField === "phone" ? "placeholder:opacity-0 caret-white" : "placeholder:opacity-100 placeholder:text-black caret-[var(--presse-accent)]"}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                {/* Site / Réseaux */}
                <div>
                  <label htmlFor="website" className="block font-text font-bold leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Site / Réseaux"} color={focusedField === "website" ? "#000000" : "#A855F7"} className={`font-text font-bold text-sm md:text-base transition-colors ${focusedField === "website" ? "text-white !important" : "text-black"}`} delayStep={0.06} horizontalPadding={8} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full relative" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-[#A855F7] -z-10" />
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("website")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="site ou @compte"
                      className={`relative z-10 w-full px-2 py-1.5 bg-transparent border-0 focus:outline-none text-[var(--presse-accent)] focus:text-black placeholder:font-semibold placeholder-title font-title transition-colors text-sm ${focusedField === "website" ? "placeholder:opacity-0 caret-white" : "placeholder:opacity-100 placeholder:text-black caret-[var(--presse-accent)]"}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                {/* Objet */}
                <div>
                  <label htmlFor="subject" className="block font-text font-bold leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Objet"} color={focusedField === "subject" ? "#000000" : "#A855F7"} className={`font-text font-bold text-sm md:text-base transition-colors ${focusedField === "subject" ? "text-white !important" : "text-black"}`} delayStep={0.06} horizontalPadding={8} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full relative" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-[#A855F7] -z-10" />
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("subject")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Sujet de la collaboration"
                      className={`relative z-10 w-full px-2 py-1.5 bg-transparent border-0 focus:outline-none text-[var(--presse-accent)] focus:text-black placeholder:font-semibold placeholder-title font-title transition-colors text-sm ${focusedField === "subject" ? "placeholder:opacity-0 caret-white" : "placeholder:opacity-100 placeholder:text-black caret-[var(--presse-accent)]"}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block font-text font-bold leading-none mb-0 relative z-[2]">
                    <TextRevealLines text={"Votre message"} color={focusedField === "message" ? "#000000" : "#A855F7"} className={`font-text font-bold text-sm md:text-base transition-colors ${focusedField === "message" ? "text-white !important" : "text-black"}`} delayStep={0.06} horizontalPadding={8} />
                  </label>
                  <div className="reveal-focus -mt-1 w-full relative" suppressHydrationWarning>
                    <div className="absolute inset-0 bg-[#A855F7] -z-10" />
                    <textarea
                      id="message"
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("message")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Décrivez votre projet"
                      className={`relative z-10 w-full px-2 py-1.5 bg-transparent border-0 focus:outline-none text-[var(--presse-accent)] focus:text-black placeholder:font-semibold placeholder-title font-title transition-colors resize-none text-sm ${focusedField === "message" ? "placeholder:opacity-0 caret-white" : "placeholder:opacity-100 placeholder:text-black caret-[var(--presse-accent)]"}`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
                

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onFocus={() => setFocusedField("submit")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-3 py-2 bg-black font-title uppercase tracking-wider hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black text-sm ${focusedField === "submit" ? "text-[#A855F7]" : "text-white"}`}
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
      </section>
    </main>
  );
}


