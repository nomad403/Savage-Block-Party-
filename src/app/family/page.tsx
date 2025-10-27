"use client";

import type { Metadata } from "next";
import { useState } from "react";
import FamilyDropdowns from "./family-dropdowns";

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
    if (item === 'SUNGOMA') {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instagramHandle.trim()) {
      console.log('Candidature Instagram:', instagramHandle);
      window.open(`https://instagram.com/${instagramHandle.replace('@', '')}`, '_blank');
    }
  };

  return (
    <main className="w-full -mt-20">
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
            <h1 className="font-title uppercase text-6xl sm:text-7xl md:text-8xl text-yellow-400 mb-6 leading-tight">
              Une famille
            </h1>
          </div>
        </div>
      </section>
      
      {/* Deuxième section avec fond rouge et vidéo fullscreen */}
      <section className="h-screen w-full relative overflow-hidden bg-red-500">
        {/* Vidéo YouTube fullscreen */}
        {media && media.type === 'youtube' && (
          <div className="absolute inset-0 w-full h-full" style={{ overflow: 'hidden', transform: 'scale(1.2)' }}>
            <iframe
              key={selectedItem}
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${media.videoId}?start=${media.startTime}&autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&frameborder=0`}
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
              <h2 className="font-title text-6xl sm:text-7xl md:text-8xl text-white uppercase leading-tight">
                {selectedItem}
              </h2>
            </div>
          </div>
        )}
      </section>
      
      {/* Troisième section "Join the family" */}
      <section className="h-screen w-full relative overflow-hidden text-white">
        {/* Image de fond */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/family/images/jtf.jpeg')"
          }}
        />
        
        {/* Overlay sombre pour la lisibilité */}
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="container-px relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[400px]">
            {/* Titre à gauche */}
            <div className="flex flex-col justify-center">
              <h2 className="font-title uppercase text-6xl sm:text-7xl md:text-8xl leading-tight">
                Join the family
              </h2>
            </div>

            {/* Description et formulaire à droite */}
            <div className="flex flex-col justify-center space-y-8">
              {/* Description */}
              <div className="space-y-4">
                <p className="font-text text-xl leading-relaxed">
                  Tu es artiste, créateur, ou simplement passionné par la culture urbaine ?
                </p>
                <p className="font-text text-xl leading-relaxed">
                  Savage Block Party cherche de nouveaux talents pour enrichir sa communauté.
                </p>
                <p className="font-text text-xl leading-relaxed">
                  Partage ton Instagram et montre-nous ton univers.
                </p>
              </div>

              {/* Formulaire Instagram */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="instagram" className="block text-white text-lg font-title mb-3">
                    Votre Instagram
                  </label>
                  <div className="flex w-full">
                    <span className="bg-yellow-400 text-black px-4 py-3 text-lg font-title">@</span>
                    <input
                      type="text"
                      id="instagram"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="votre_pseudo"
                      className="flex-1 bg-transparent border-2 border-yellow-400 text-white text-lg font-title px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-yellow-400 text-black py-3 px-8 text-lg font-title uppercase tracking-wider hover:bg-yellow-300 transition-colors duration-200"
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


