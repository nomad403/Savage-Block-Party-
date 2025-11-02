"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import TextRevealLines from "@/components/text-reveal-lines";
import { useMenu } from "../hooks/useMenu";

// Composant LineByLineText pour l'effet de révélation de texte
function LineByLineText({ text, className }: { text: string; className: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineData, setLineData] = useState<Array<{width: number, top: number, height: number}>>([]);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    // Créer un élément temporaire pour mesurer
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    tempDiv.className = className;
    document.body.appendChild(tempDiv);

    words.forEach((word, index) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      tempDiv.textContent = testLine;
      
      if (tempDiv.scrollWidth > container.offsetWidth && currentLine) {
        // La ligne précédente était complète
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
      
      if (index === words.length - 1) {
        // Dernière ligne
        lines.push(currentLine);
      }
    });

    // Calculer les dimensions de chaque ligne
    const lineHeight = parseFloat(getComputedStyle(tempDiv).lineHeight) || 28;
    const lineDimensions = lines.map((line, index) => {
      tempDiv.textContent = line;
      return {
        width: tempDiv.scrollWidth,
        top: index * lineHeight,
        height: lineHeight
      };
    });

    document.body.removeChild(tempDiv);
    setLineData(lineDimensions);
    
    // Initialiser les refs
    lineRefs.current = new Array(lineDimensions.length).fill(null);
  }, [text, className]);

  return (
    <div ref={containerRef} className="w-full relative">
      {/* Texte normal pour la disposition */}
      <div className={className}>
        {text}
      </div>
      
      {/* Overlays d'animation pour chaque ligne */}
      {lineData.map((line, index) => (
        <motion.div
          key={index}
          ref={(el) => { lineRefs.current[index] = el; }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 + (index * 0.2) }}
          className="text-reveal-line"
          style={{
            top: `${line.top}px`,
            left: '-12px', // Décalage pour compenser le padding gauche (8px) et créer l'espacement
            width: `${line.width + 20}px`, // Largeur de la ligne + padding total (8px gauche + 12px droite)
            height: `${line.height}px`, // Hauteur exacte de la ligne
          }}
          onAnimationComplete={() => {
            setTimeout(() => {
              if (lineRefs.current[index]) {
                lineRefs.current[index]!.classList.add('animate-in');
              }
            }, 100);
          }}
        />
      ))}
    </div>
  );
}

// Liste des photos dans le dossier gallery_flash
const galleryImages = [
  "_DSC0965.jpg",
  "5R2A6292.jpg", 
  "IMG_8628.JPG",
  "IMG_8629.JPG",
  "IMG_8631.JPG",
  "IMG_8634.JPG",
  "IMG_8635.JPG",
  "IMG_8641.JPG",
  "IMG_8644.JPG",
  "IMG_8648.JPG",
  "IMG_8651.JPG",
  "IMG_8654.JPG",
  "IMG_8655.JPG"
];

export default function GalleryFlash() {
  const { isMenuOpen } = useMenu();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [instagramHandle, setInstagramHandle] = useState("");

  // Défilement automatique toutes les 2 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instagramHandle.trim()) {
      // Ici vous pouvez ajouter la logique pour envoyer la candidature
      console.log('Candidature Instagram:', instagramHandle);
      // Pour l'instant, on peut ouvrir un lien Instagram ou envoyer un email
      window.open(`https://instagram.com/${instagramHandle.replace('@', '')}`, '_blank');
    }
  };

  return (
    <div className={`w-full transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Galerie photos avec défilement flash */}
      <div className="relative w-full aspect-video overflow-hidden">
        {/* Galerie photos avec défilement flash */}
        <div className="absolute inset-0">
          {galleryImages.map((image, index) => (
            <div
              key={image}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={`/agenda/photo/gallery_flash/${image}`}
                alt={`Gallery flash ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Vidéo dancer.webm centrée au-dessus */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <video
            src="/general/dancer.webm"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full max-w-none max-h-none object-contain"
            style={{ minWidth: '600px', minHeight: '600px' }}
          />
          {/* Titre "join the family" avec flèche */}
          <div
            style={{
              position: 'absolute',
              left: '40px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#FACC15',
              fontSize: '64px',
              fontWeight: 'bold',
              fontFamily: 'Hanson, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '4px',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '16px'
            }}
          >
            <span>join the</span>
            <span>family</span>
            <div
              style={{
                width: '0',
                height: '0',
                borderLeft: '24px solid transparent',
                borderRight: '24px solid transparent',
                borderTop: '32px solid #FACC15',
                marginTop: '16px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Bannière de séparation */}
      <section className="w-full bg-cyan-400 text-black py-4 relative overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full gap-4">
          {/* Texte défilant */}
          <div className="flex items-center gap-8 whitespace-nowrap animate-scroll-text w-full">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="font-title uppercase text-2xl sm:text-3xl md:text-4xl">
                LE LIEU TU RESPECTERAS, DANS UNE POUBELLE TES DÉCHETS TU JETTERAS
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Section formulaire de candidature */}
      <div className="w-full bg-yellow-400 py-20 px-8 pb-68">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[400px]">
            {/* Formulaire à gauche */}
            <div className="flex flex-col justify-center">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="instagram" className="block text-black text-lg font-title leading-none mb-0 relative z-[2]">
                    <TextRevealLines 
                      text={"Votre Instagram"}
                      color="#22D3EE"
                      className="font-title text-lg text-black"
                      delayStep={0.06}
                    />
                  </label>
                  <div className="reveal-focus flex w-full -mt-1">
                    <span className="bg-cyan-400 text-black px-4 py-3 text-lg font-title relative z-[1]">@</span>
                    <input
                      type="text"
                      id="instagram"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="votre_pseudo"
                      className="flex-1 bg-transparent border-2 border-cyan-400 text-cyan-400 focus:text-black placeholder:text-cyan-400 placeholder:opacity-100 placeholder:font-text caret-cyan-400 focus:caret-black text-lg font-title px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 relative z-[1]"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-cyan-400 text-black py-3 px-8 text-lg font-title uppercase tracking-wider hover:bg-cyan-500 transition-colors duration-200"
                >
                  Candidater
                </button>
              </form>
            </div>

            {/* Texte à droite */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-black flex flex-col justify-center relative z-10"
            >
              <div className="mb-8">
                <TextRevealLines 
                  text="Rejoins le collectif" 
                  color="#22D3EE"
                  className="text-5xl font-title uppercase leading-tight text-black"
                  delayStep={0.12}
                />
              </div>
              <div className="space-y-6 text-xl font-text leading-relaxed">
                <div>
                  <TextRevealLines 
                    text="Tu es artiste, créateur, ou simplement passionné par la culture urbaine ? Savage Block Party cherche de nouveaux talents pour enrichir sa communauté." 
                    color="#22D3EE"
                    className="text-xl font-text leading-relaxed text-black"
                    delayStep={0.12}
                  />
                </div>
                <div>
                  <TextRevealLines 
                    text="Partage ton Instagram et montre-nous ton univers. Nous étudions chaque candidature avec attention pour découvrir les prochaines pépites du collectif." 
                    color="#22D3EE"
                    className="text-xl font-text leading-relaxed text-black"
                    delayStep={0.12}
                  />
                </div>
                <div>
                  <TextRevealLines 
                    text="Prêt à faire partie de l'aventure ?" 
                    color="#22D3EE"
                    className="font-title text-2xl text-black"
                    delayStep={0.12}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
