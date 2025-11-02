"use client";

import type { Metadata } from "next";
import { useState } from "react";
import TextRevealLines from "@/components/text-reveal-lines";
import FamilyDropdowns from "./family-dropdowns";
import { useMenu } from "@/hooks/useMenu";

// Styles pour l'animation de défilement du texte
const scrollTextStyle = `
  @keyframes scroll-text {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-33.333%);
    }
  }
  
  .animate-scroll-text {
    animation: scroll-text 30s linear infinite;
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(8px);
    }
  }
  
  .animate-bounce {
    animation: bounce 2s ease-in-out infinite;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('family-scroll-styles')) {
  const style = document.createElement('style');
  style.id = 'family-scroll-styles';
  style.textContent = scrollTextStyle;
  document.head.appendChild(style);
}

type MediaType = {
  type: 'youtube';
  videoId: string;
  startTime: number;
} | {
  type: 'video';
  src: string;
} | {
  type: 'image';
  src: string;
};

export default function FamilyPage() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [instagramHandle, setInstagramHandle] = useState("");
  const { isMenuOpen } = useMenu();

  // Fonction pour obtenir le média correspondant à l'item sélectionné
  const getMediaForItem = (item: string): MediaType => {
    // Vidéo spécifique pour Niel (YouTube)
    // Essaie différentes valeurs : 10, 15, 20, 30, 45 pour trouver le meilleur moment
    if (item === 'Niel') {
      return {
        type: 'youtube',
        videoId: 'Izy3E4u71Gc',
        startTime: 30 // Teste entre 10-60 secondes
      };
    }
    
    // Vidéo spécifique pour Rita Amoureux (YouTube)
    // Essaie différentes valeurs : 0, 5, 15, 30, 45 pour trouver le drop
    if (item === 'Rita Amoureux') {
      return {
        type: 'youtube',
        videoId: 'NVkvqh6pX-M',
        startTime: 30 // Teste entre 0-60 secondes
      };
    }
    
    // Vidéo spécifique pour SUNGOMA (YouTube)
    if (item === 'Sungoma') {
      return {
        type: 'youtube',
        videoId: 'FWw28MR4jRw',
        startTime: 30 // Teste entre 0-60 secondes
      };
    }
    
    // Vidéo spécifique pour Vins Crespo (YouTube)
    if (item === 'Vins Crespo') {
      return {
        type: 'youtube',
        videoId: 'oQTGFCh9EQw',
        startTime: 67 // Défini dans l'URL (t=67s)
      };
    }
    
    // Vidéo spécifique pour Woodneymo (YouTube)
    if (item === 'Woodneymo') {
      return {
        type: 'youtube',
        videoId: 'fzBtIkG2lqg',
        startTime: 30 // À ajuster selon le meilleur moment énergique
      };
    }
    
    // Vidéo spécifique pour Darlean (YouTube)
    if (item === 'Darlean') {
      return {
        type: 'youtube',
        videoId: '24pjUzo6yEw',
        startTime: 1323 // Défini dans l'URL (t=1323s)
      };
    }
    
    // Vidéo placeholder pour tous les autres items
    return {
      type: 'video',
      src: '/general/dancer.webm'
    };
  };

  const media = selectedItem ? getMediaForItem(selectedItem) : null;
  
  // Vidéo par défaut quand aucun item n'est sélectionné
  const defaultVideoId = 'eZto42hlGKA';
  const defaultStartTime = 10; // Commence à la 10ème seconde

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instagramHandle.trim()) {
      console.log('Candidature Instagram:', instagramHandle);
      window.open(`https://instagram.com/${instagramHandle.replace('@', '')}`, '_blank');
    }
  };

  return (
    <main id="family-root" className="w-full -mt-20">
      {/* Section hero avec image de fond fullscreen */}
      <section className="h-screen w-full relative overflow-hidden">
        {/* Image de fond qui commence dès le top */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/family/images/SAVAGE-74.jpg')",
            top: '-80px',
            height: 'calc(100vh + 80px)'
          }}
        />
        
        {/* Overlay sombre pour la lisibilité */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Contenu centré */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-4">
            <div className="mb-6">
              <TextRevealLines 
                text={"Une famille"} 
                color="#22C55E" 
                className="font-title uppercase text-6xl sm:text-7xl md:text-8xl text-black leading-tight" 
                delayStep={0.12}
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Deuxième section avec fond rouge et vidéo fullscreen */}
      <section className="h-screen w-full relative overflow-hidden bg-red-500">
        {/* Vidéo YouTube par défaut quand aucun item n'est sélectionné */}
        {!selectedItem && (
          <div className="absolute inset-0 w-full h-full" style={{ overflow: 'hidden', transform: 'scale(1.2)' }}>
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${defaultVideoId}?start=${defaultStartTime}&autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&frameborder=0&playlist=${defaultVideoId}`}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen={true}
              style={{ border: 'none', width: '100%', height: '100%', pointerEvents: 'none' }}
            />
          </div>
        )}
        
        {/* Vidéo YouTube fullscreen pour item sélectionné */}
        {media && media.type === 'youtube' && selectedItem && (
          <div className="absolute inset-0 w-full h-full" style={{ overflow: 'hidden', transform: 'scale(1.2)' }}>
            <iframe
              key={selectedItem}
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${media.videoId}?start=${media.startTime}&autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&frameborder=0&playlist=${media.videoId}`}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen={true}
              style={{ border: 'none', width: '100%', height: '100%', pointerEvents: 'none' }}
            />
          </div>
        )}
        
        {/* Vidéo fullscreen seulement si un item est sélectionné */}
        {media && media.type === 'video' && (
          <video
            key={selectedItem} // Force le rechargement quand l'item change
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={media.src} type="video/webm" />
          </video>
        )}
        
        {/* Image fullscreen seulement si un item est sélectionné */}
        {media && media.type === 'image' && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${media.src})` }}
          />
        )}
        
        {/* Dropdowns en haut */}
        <FamilyDropdowns onItemSelect={setSelectedItem} selectedItem={selectedItem} />
        
        {/* Affichage de l'item sélectionné */}
        {selectedItem && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <TextRevealLines 
                text={selectedItem || ""} 
                color="#22C55E" 
                className="font-title text-6xl sm:text-7xl md:text-8xl text-black uppercase leading-tight" 
                delayStep={0.1}
              />
            </div>
          </div>
        )}
      </section>
      
      {/* Barre de séparation avec texte défilant */}
      <section className="w-full bg-green-500 text-black py-4 relative overflow-hidden">
        <div className={`flex flex-col items-center justify-center h-full gap-12 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Texte défilant */}
          <div className="flex items-center gap-8 whitespace-nowrap animate-scroll-text w-full">
            <span className="font-title uppercase text-4xl sm:text-5xl md:text-6xl">Join the family</span>
            <span className="font-title uppercase text-4xl sm:text-5xl md:text-6xl">Join the family</span>
            <span className="font-title uppercase text-4xl sm:text-5xl md:text-6xl">Join the family</span>
            <span className="font-title uppercase text-4xl sm:text-5xl md:text-6xl">Join the family</span>
            <span className="font-title uppercase text-4xl sm:text-5xl md:text-6xl">Join the family</span>
            <span className="font-title uppercase text-4xl sm:text-5xl md:text-6xl">Join the family</span>
          </div>
          
          {/* Indication vers le bas */}
          <div className="flex flex-col items-center animate-bounce">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </section>
      
      {/* Troisième section "Join the family" */}
      <section className="h-screen w-full relative overflow-hidden text-black">
        {/* Image de fond */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/family/images/jtf.jpeg')"
          }}
        />
        
        {/* Overlay sombre pour la lisibilité */}
        <div className="absolute inset-0 bg-black/40" />
        
        <div className={`container-px relative z-10 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start min-h-[400px] mt-12 md:mt-16">
            {/* Titre à gauche */}
            <div className="flex flex-col justify-start">
              <TextRevealLines 
                text={"Join the family"} 
                color="#22C55E" 
                className="font-title uppercase text-6xl sm:text-7xl md:text-8xl leading-tight text-black" 
                delayStep={0.1}
              />
            </div>

            {/* Description et formulaire à droite */}
            <div className="flex flex-col justify-start space-y-8 lg:mt-0 lg:w-[70%]">
              {/* Description */}
              <div className="w-full mt-0 space-y-4" style={{ hyphens: 'none', overflowWrap: 'normal', wordBreak: 'normal' }}>
                <TextRevealLines
                  text={"Tu es artiste, créateur, beatmaker, danseur, DJ, photographe ou média indépendant ? Rejoins une communauté qui fait vibrer la ville hors des circuits, entre friches, parkings et lieux improbables."}
                  color="#22C55E"
                  className="font-text font-semibold text-xl md:text-2xl leading-[1.12] tracking-tight text-black text-justify"
                  delayStep={0.07}
                />
                <TextRevealLines
                  text={"Ensemble, on fabrique des formats roots, exigeants et inclusifs, où la musique et le mouvement parlent plus fort que les discours."}
                  color="#22C55E"
                  className="font-text font-semibold text-xl md:text-2xl leading-[1.12] tracking-tight text-black text-justify"
                  delayStep={0.07}
                />
                <TextRevealLines
                  text={"Prêt à faire partie de l’aventure ?"}
                  color="#22C55E"
                  className="font-title text-2xl md:text-3xl leading-[1.12] tracking-tight text-black"
                  delayStep={0.06}
                />
              </div>

              {/* Formulaire Instagram */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="instagram" className="block text-black text-lg font-title leading-none mb-0 relative z-[2]">
                    <TextRevealLines 
                      text={"Votre Instagram"}
                      color="#22C55E"
                      className="font-title text-lg text-black"
                      delayStep={0.06}
                    />
                  </label>
                  <div className="reveal-focus flex w-full -mt-1">
                    <span className="bg-green-500 text-black px-4 py-3 text-lg font-title relative z-[1]">@</span>
                    <input
                      type="text"
                      id="instagram"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="votre_pseudo"
                      className="flex-1 bg-transparent border-2 border-green-500 text-green-500 focus:text-black placeholder:text-green-500 placeholder:opacity-100 placeholder:font-text caret-green-500 focus:caret-black text-lg font-title px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 relative z-[1]"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-500 text-black py-3 px-8 text-lg font-title uppercase tracking-wider hover:bg-green-600 transition-colors duration-200"
                >
                  Candidater
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


