"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

function TextRevealLines({ text, color = "#A855F7", lineHeight = 1.2, delayStep = 0.2, className = "" }: { text: string; color?: string; lineHeight?: number; delayStep?: number; className?: string }) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const textRef = useRef<HTMLSpanElement | null>(null);
	const [rects, setRects] = useState<Array<{ left: number; top: number; width: number; height: number }>>([]);
	const [active, setActive] = useState(false);

	useEffect(() => {
		const measure = () => {
			if (!containerRef.current || !textRef.current) return;
			const containerRect = containerRef.current.getBoundingClientRect();
			const range = document.createRange();
			range.selectNodeContents(textRef.current);
			const clientRects = Array.from(range.getClientRects());
			const mapped = clientRects.map((r) => ({
				left: r.left - containerRect.left,
				top: r.top - containerRect.top,
				width: r.width,
				height: r.height,
			}));
			setRects(mapped);
			requestAnimationFrame(() => setActive(true));
		};

		measure();
		window.addEventListener('resize', measure);
		return () => window.removeEventListener('resize', measure);
	}, []);

	return (
		<div ref={containerRef} style={{ position: 'relative', lineHeight }} className={className}>
			<span ref={textRef} style={{ position: 'relative', zIndex: 1 }}>{text}</span>
			{rects.map((r, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: r.left,
						top: r.top,
						width: r.width,
						height: r.height,
						background: color,
						transformOrigin: 'left center',
						transform: active ? 'scaleX(1)' : 'scaleX(0)',
						transition: 'transform 800ms ease-out',
						transitionDelay: `${i * delayStep}s`,
						zIndex: 0,
						pointerEvents: 'none',
					}}
				/>
			))}
		</div>
	);
}

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
    typeCollaboration: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

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
      setFormData({
        organisme: "",
        email: "",
        typeCollaboration: "",
        message: "",
      });
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="presse-root" className="w-full -mt-20 relative">
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
      </div>

      {/* Formulaire avec fond couleur uni par-dessus */}
      <section className="relative z-10 py-32 pb-32">
        <div className="container-px w-full max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Texte à gauche */}
            <div className="flex-1 pt-4">
              <h1 className="font-title uppercase text-3xl sm:text-4xl md:text-5xl mb-8 text-purple-500">
                Collaboration
              </h1>
              <div className="space-y-0">
                <TextRevealLines 
                  text={"Soutenez la culture indépendante : musique, danse, graffiti et médias urbains. Co-créons des formats exigeants, roots et inclusifs, ancrés dans le réel. Rejoignez un réseau d’artistes, lieux et labels pour faire rayonner l’underground."}
                  color="#A855F7"
                  lineHeight={1.18}
                  delayStep={0.12}
                  className="font-text text-2xl md:text-3xl text-black max-w-[48ch] md:max-w-[54ch] tracking-tight"
                />
              </div>
            </div>

            {/* Formulaire à droite */}
            <div className="flex-1 bg-purple-500 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organisme */}
              <div>
                <label
                  htmlFor="organisme"
                  className="block font-text font-medium text-black mb-2"
                >
                  Nom de l'organisme *
                </label>
                <input
                  type="text"
                  id="organisme"
                  name="organisme"
                  required
                  value={formData.organisme}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-black focus:border-black focus:outline-none text-black placeholder:text-black/50 font-text transition-colors"
                  placeholder="Votre organisme"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block font-text font-medium text-black mb-2"
                >
                  Email de contact *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-black focus:border-black focus:outline-none text-black placeholder:text-black/50 font-text transition-colors"
                  placeholder="contact@organisme.com"
                />
              </div>

              {/* Type de collaboration */}
              <div>
                <label
                  htmlFor="typeCollaboration"
                  className="block font-text font-medium text-black mb-2"
                >
                  Type de collaboration *
                </label>
                <div className="relative">
                  <select
                    id="typeCollaboration"
                    name="typeCollaboration"
                    required
                    value={formData.typeCollaboration}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-black focus:border-black focus:outline-none text-black font-text transition-colors appearance-none cursor-pointer pr-10"
                  >
                    <option value="" className="bg-white text-black">
                      Sélectionnez un type
                    </option>
                    <option value="event" className="bg-white text-black">
                      Organisation d'événement
                    </option>
                    <option value="media" className="bg-white text-black">
                      Presse / Média
                    </option>
                    <option value="partnership" className="bg-white text-black">
                      Partenariat
                    </option>
                    <option value="booking" className="bg-white text-black">
                      Booking / Réservation
                    </option>
                    <option value="other" className="bg-white text-black">
                      Autre
                    </option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block font-text font-medium text-black mb-2"
                >
                  Votre message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-black focus:border-black focus:outline-none text-black placeholder:text-black/50 font-text transition-colors resize-none"
                  placeholder="Décrivez votre projet de collaboration..."
                />
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
        </div>
      </section>
    </main>
  );
}


