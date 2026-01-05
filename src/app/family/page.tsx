"use client";

import { useState, useEffect } from "react";
import FamilyDropdowns from "./family-dropdowns";
import ScrollHint from "@/components/scroll-hint";

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
  const [mounted, setMounted] = useState(false);

  // Éviter les erreurs d'hydratation en attendant que le composant soit monté
  useEffect(() => {
    setMounted(true);
  }, []);

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
  
  // Vidéo par défaut quand aucun item n'est sélectionné (vidéo locale webm)
  const defaultVideoSrc = '/family/Savage+Lifestyle+Full+Clip.webm';

  // Générer l'URL YouTube de manière SSR-safe (pour les items sélectionnés)
  const getYouTubeUrl = (videoId: string, startTime: number) => {
    const baseParams = `start=${startTime}&autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&playlist=${videoId}&iv_load_policy=3&cc_load_policy=0&disablekb=1&enablejsapi=1`;
    if (mounted && typeof window !== 'undefined') {
      return `https://www.youtube.com/embed/${videoId}?${baseParams}&origin=${window.location.origin}`;
    }
    return `https://www.youtube.com/embed/${videoId}?${baseParams}`;
  };

  return (
    <main id="family-root" className="w-full m-0 p-0">
      {/* Section vidéo fullscreen */}
      <section className="relative w-full h-screen overflow-hidden bg-red-500">
        {/* Vidéo locale par défaut quand aucun item n'est sélectionné */}
        {!selectedItem && (
          <video
            className="absolute inset-0 w-full h-full object-cover filter-infrared"
            autoPlay
            muted
            loop
            playsInline
            style={{ 
              width: '100vw', 
              height: '100vh',
              objectFit: 'cover'
            }}
          >
            <source src={defaultVideoSrc} type="video/webm" />
          </video>
        )}
        
        {/* Vidéo YouTube fullscreen pour item sélectionné */}
        {media && media.type === 'youtube' && selectedItem && (
          <div className="absolute inset-0 w-full h-full" style={{ overflow: 'hidden' }}>
            <iframe
              key={selectedItem}
              className="absolute inset-0 w-full h-full filter-infrared"
              src={getYouTubeUrl(media.videoId, media.startTime)}
              allow="autoplay; encrypted-media; fullscreen; accelerometer; gyroscope; picture-in-picture"
              allowFullScreen={true}
              loading="eager"
              style={{ 
                border: 'none', 
                width: '100vw', 
                height: '100vh', 
                transform: 'scale(1.1)',
                transformOrigin: 'center center',
                pointerEvents: 'none' 
              }}
            />
          </div>
        )}
        
        {/* Vidéo fullscreen seulement si un item est sélectionné */}
        {media && media.type === 'video' && (
          <video
            key={selectedItem} // Force le rechargement quand l'item change
            className="absolute inset-0 w-full h-full object-cover filter-infrared"
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
            className="absolute inset-0 bg-cover bg-center bg-no-repeat filter-infrared"
            style={{ backgroundImage: `url(${media.src})` }}
          />
        )}
        
        {/* Scroll hint */}
        <ScrollHint 
          text="scroll to see our family" 
          color="#22C55E"
        />
        
      </section>
      
      {/* Section menu en dessous de la vidéo */}
      <section className="relative w-full bg-green-500">
        <FamilyDropdowns onItemSelect={setSelectedItem} selectedItem={selectedItem} />
      </section>
    </main>
  );
}


