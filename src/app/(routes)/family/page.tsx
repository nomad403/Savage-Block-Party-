"use client";

import { useState, useEffect, useRef } from "react";
import FamilyDropdowns from "./family-dropdowns";
import { ScrollHint } from "@/components/ui";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useIsMobile } from "@/hooks/useMediaQuery";
import "./family.css"; // Styles scopés pour Family

/**
 * FamilyDropdownsWrapper
 * 
 * RESPONSABILITÉS (2 max) :
 * 1. Position fixed en bas du viewport (layout)
 * 2. Masquage/affichage via transform (animation)
 * 
 * PRINCIPE :
 * - Position bottom CONSTANTE (via CSS calc avec variables)
 * - Masquage via transform: translateY(100%) → masqué
 * - Affichage via transform: translateY(0) → visible
 * - Détection via direction du scroll (hook useScrollDirection)
 *   + IntersectionObserver (sentinel) pour validation
 * 
 * INTERDICTIONS :
 * - Pas de calcul window.scrollY pour position
 * - Pas d'interpolation bottom/top
 * - Pas de valeurs magiques (172px, etc.)
 */
function FamilyDropdownsWrapper({ 
  onItemSelect, 
  selectedItem,
  onVisibilityChange
}: { 
  onItemSelect: (item: string) => void; 
  selectedItem: string | null;
  onVisibilityChange?: (isVisible: boolean) => void;
}) {
  const [isVisible, setIsVisible] = useState(false); // Masqué au chargement
  const scrollDirection = useScrollDirection();
  const sentinelVisibleRef = useRef(false);
  const isMobile = useIsMobile(); // Détection mobile : sur mobile, seul IntersectionObserver contrôle isVisible

  // Notifier le parent quand la visibilité change
  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible, onVisibilityChange]);

  // Détection via IntersectionObserver (sentinel)
  useEffect(() => {
    const setupObserver = () => {
      const sentinel = document.getElementById('family-dropdowns-sentinel');
      if (!sentinel) {
        setTimeout(setupObserver, 50);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            sentinelVisibleRef.current = entry.isIntersecting;
            
            // RÈGLE ABSOLUE : Sur mobile, IntersectionObserver est la SEULE source de vérité
            if (isMobile) {
              // Sur mobile : isVisible = sentinel.isIntersecting (point final)
              setIsVisible(entry.isIntersecting);
            } else {
              // Sur desktop : IntersectionObserver peut modifier isVisible
              // (mais handleScroll a aussi son mot à dire)
            setIsVisible(entry.isIntersecting);
            }
          });
        },
        {
          threshold: 0,
          rootMargin: '0px',
        }
      );

      observer.observe(sentinel);

      return () => {
        observer.disconnect();
      };
    };

    const cleanup = setupObserver();
    return cleanup;
  }, [isMobile]); // Dépendance à isMobile pour recréer l'observer si nécessaire

  // Gestion de la visibilité basée sur le scroll (DESKTOP UNIQUEMENT)
  // Sur mobile, cette logique est COMPLÈTEMENT DÉSACTIVÉE
  // IntersectionObserver est la seule source de vérité sur mobile
  useEffect(() => {
    // Sur mobile, ne pas exécuter cette logique du tout
    if (isMobile) {
      return;
    }
    
    let lastScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    let scrollTimeout: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      lastScrollY = scrollY;
      
      // Si on scroll vers le bas ET qu'on a scrollé un peu → afficher
      if (scrollDirection === 'down' && scrollY > 50) {
        setIsVisible(true);
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
          scrollTimeout = null;
        }
      } 
      // Si on scroll vers le haut ET qu'on est proche du haut → masquer
      else if (scrollDirection === 'up' && scrollY < 100) {
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        setIsVisible(false);
        scrollTimeout = null;
      }
      // Si le sentinel est visible → toujours afficher
      else if (sentinelVisibleRef.current) {
        setIsVisible(true);
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
          scrollTimeout = null;
        }
      }
    };

    handleScroll(); // Vérifier immédiatement
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollDirection, isMobile]);

  return (
    <div 
      className="family-dropdowns-wrapper fixed left-0 right-0 w-full"
      style={{ 
        // Bottom constant via CSS calc avec variables (géré par CSS)
        zIndex: 'var(--z-dropdowns)', // 10003
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)', // Masqué = décalé vers le bas
        transition: 'transform 0.3s ease-out',
        // IMPORTANT: pointer-events activé seulement si visible
        // FamilyDropdowns gère aussi pointer-events via isMenuHovered
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {/* Les dropdowns sont cliquables si isVisible=true ET isMenuHovered=false */}
      <FamilyDropdowns 
        onItemSelect={onItemSelect} 
        selectedItem={selectedItem}
        isVisible={isVisible}
        onDropdownStateChange={(isOpen) => {
          // Sur mobile : NE RIEN FAIRE
          // IntersectionObserver est la seule source de vérité
          // Sur desktop : cette callback n'est pas utilisée pour modifier isVisible
          // (la logique desktop est gérée par handleScroll)
        }}
      />
    </div>
  );
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
  const [mounted, setMounted] = useState(false);
  const [dropdownsVisible, setDropdownsVisible] = useState(false);

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
    <main id="family-root" className="w-full m-0 p-0 relative">
      {/* ========================================
          LAYER 1: BACKGROUND MEDIA (FIXED)
          Responsabilité UNIQUE: Afficher le média de fond
          Position: fixed, inset-0
          Z-index: var(--z-background) = -1
          Overflow: hidden (pas de scroll)
          ======================================== */}
      <section 
        className="fixed inset-0 w-full h-full overflow-hidden" 
        style={{ zIndex: 'var(--z-background)' }}
        aria-hidden="true"
      >
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
              objectFit: 'cover',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          >
            <source src={defaultVideoSrc} type="video/webm" />
          </video>
        )}
        
        {/* Vidéo YouTube fullscreen pour item sélectionné */}
        {media && media.type === 'youtube' && selectedItem && (
          <div className="fixed inset-0 w-full h-full" style={{ overflow: 'hidden', zIndex: -1 }}>
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
                position: 'fixed',
                top: 0,
                left: 0,
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
            <source src={media.src} type="video/webm" />
          </video>
        )}
        
        {/* Image fullscreen seulement si un item est sélectionné */}
        {media && media.type === 'image' && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat filter-infrared"
            style={{ 
              backgroundImage: `url(${media.src})`,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh'
            }}
          />
        )}
        
        {/* ========================================
            LAYER 2: SCROLL HINT (FIXED)
            Responsabilité UNIQUE: Indicateur visuel de scroll
            Position: fixed (géré par ScrollHint)
            Z-index: var(--z-scroll-hint) = 9998
            ======================================== */}
        <ScrollHint 
          text="scroll to see our family" 
          color="#22C55E"
          className="scroll-hint-family"
          hideWhenDropdownsVisible={true}
          dropdownsVisible={dropdownsVisible}
        />
      </section>
      
      {/* ========================================
          LAYER 3: SCROLLABLE CONTENT (RELATIVE)
          Responsabilité UNIQUE: Zone scrollable avec sentinel
          Position: relative (dans le flux normal)
          Overflow: géré UNIQUEMENT par body/html (pas de double scroll)
          ======================================== */}
      <div 
        className="relative w-full"
        style={{ 
          // Hauteur minimale = viewport - header + espace pour scroll
          // Permet de scroller jusqu'au sentinel en bas
          // IMPORTANT: Pas d'overflow ici, le scroll est géré par body
          minHeight: 'calc(100vh - 96px + 100px)',
          paddingTop: '96px', // Compenser le header fixed (96px)
        }}
      >
        {/* Espace en haut pour permettre le scroll initial */}
        <div style={{ height: 'calc(100vh - 96px)' }} />
        
        {/* Sentinel invisible en bas - déclenche l'affichage des dropdowns */}
        {/* Position: absolute, bottom: 0 (dans le conteneur scrollable) */}
        <div 
          id="family-dropdowns-sentinel"
          style={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            width: '100%',
            pointerEvents: 'none',
            visibility: 'hidden',
          }} 
          aria-hidden="true"
        />
      </div>
      
      {/* ========================================
          LAYER 4: DROPDOWNS (FIXED)
          Responsabilité UNIQUE: Boutons DropList dockés en bas
          Position: fixed, bottom constant (via CSS .family-dropdowns-wrapper)
          Z-index: var(--z-dropdowns) = 10003
          Animation: transform translateY (masqué/visible)
          ======================================== */}
      <FamilyDropdownsWrapper 
        onItemSelect={setSelectedItem} 
        selectedItem={selectedItem}
        onVisibilityChange={setDropdownsVisible}
      />
    </main>
  );
}


