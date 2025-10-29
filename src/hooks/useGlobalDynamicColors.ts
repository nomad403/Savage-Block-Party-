"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

type ColorTheme = 'yellow' | 'cyan' | 'red';

interface GlobalColors {
  // Couleurs principales
  primary: string;
  primaryHover: string;
  primaryFaded: string;
  
  // Couleurs pour éléments spécifiques
  menuColor: string;
  menuHoverBg: string;
  menuHoverText: string;
  
  logoColor: string;
  
  scrollbarColor: string;
  scrollbarHover: string;
  
  // Couleurs pour le player
  playerColor: string;
  playerBgColor: string;
  waveformColor: string;
  waveformColorFaded: string;
  
  // Couleurs pour les effets
  noiseOverlay: string;
  gridLines: string;
}

export function useGlobalDynamicColors() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAgenda = pathname?.startsWith("/agenda");
  const isStory = pathname?.startsWith("/story");
  const isFamily = pathname?.startsWith("/family");
  const isShop = pathname?.startsWith("/shop");
  
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>('yellow');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!isHome) {
      // Reset to default if not on home page
      setCurrentTheme('yellow');
      return;
    }

    const handleColorChange = (event: CustomEvent) => {
      setCurrentTheme(event.detail.theme);
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 500);
    };

    window.addEventListener('soundcloud-color-change', handleColorChange as EventListener);

    return () => {
      window.removeEventListener('soundcloud-color-change', handleColorChange as EventListener);
    };
  }, [isHome]);

  // 🟡 Nouveau : Changement de couleur dynamique basé sur le son
  useEffect(() => {
    if (!isHome) return;

    let lastTheme: ColorTheme = currentTheme;
    let lastChangeTime = 0;
    const THROTTLE_MS = 150; // Réduit pour plus de réactivité

    const handleAudioFeatures = (event: CustomEvent) => {
      const { rms, spectralCentroid, spectralFlux } = event.detail;
      
      // Vérifier le throttling
      const now = Date.now();
      if (now - lastChangeTime < THROTTLE_MS) return;

      // Convertir en intensité normalisée (0-1) avec amplification
      const intensity = Math.min(1, Math.max(0, 
        (rms || 0) * 12 +           // Amplifier le RMS
        (spectralFlux || 0) * 0.3 + // Augmenter la sensibilité au flux spectral
        (spectralCentroid || 0) * 0.15 // Augmenter la sensibilité au centroïde
      ));

      // Choisir le thème selon l'énergie détectée avec seuils plus sensibles
      let newTheme: ColorTheme = 'yellow';
      if (intensity > 0.5) {
        newTheme = 'red';      // 🔴 Énergie élevée (drops, kicks forts)
      } else if (intensity > 0.25) {
        newTheme = 'cyan';    // 🟦 Énergie moyenne (mid groove)
      } else {
        newTheme = 'yellow';  // 🟡 Énergie faible (calme, intro)
      }

      // Changer uniquement si le thème diffère
      if (newTheme !== lastTheme) {
        lastTheme = newTheme;
        lastChangeTime = now;
        setCurrentTheme(newTheme);
        
        // Émettre l'événement pour synchroniser le reste du site
        window.dispatchEvent(new CustomEvent('soundcloud-color-change', { 
          detail: { 
            theme: newTheme,
            intensity: intensity,
            source: 'audio-analysis-live',
            timestamp: now
          } 
        }));
      }
    };

    window.addEventListener('audioFeatures', handleAudioFeatures as EventListener);

    return () => {
      window.removeEventListener('audioFeatures', handleAudioFeatures as EventListener);
    };
  }, [isHome, currentTheme]);

  // Fonction pour obtenir les couleurs globales
  const getGlobalColors = (): GlobalColors => {
    if (!isHome) {
      // Couleurs statiques pour les autres pages
      return {
        primary: isAgenda ? "#000000" : (isStory ? "#22D3EE" : (isFamily ? "#22C55E" : (isShop ? "#EF4444" : "#FACC15"))),
        primaryHover: isAgenda ? "#333333" : (isStory ? "#06B6D4" : (isFamily ? "#16A34A" : (isShop ? "#DC2626" : "#EAB308"))),
        primaryFaded: isAgenda ? "rgba(0,0,0,0.3)" : (isStory ? "rgba(34,211,238,0.3)" : (isFamily ? "rgba(34,197,94,0.3)" : (isShop ? "rgba(239,68,68,0.3)" : "rgba(250,204,21,0.3)"))),
        
        menuColor: isAgenda ? "#000000" : (isStory ? "#22D3EE" : (isFamily ? "#22C55E" : (isShop ? "#EF4444" : "#FACC15"))),
        menuHoverBg: "#079fce",
        menuHoverText: "#000000",
        
        logoColor: "#ff6a00",
        
        scrollbarColor: isAgenda ? "#000000" : (isStory ? "#22D3EE" : (isFamily ? "#22C55E" : (isShop ? "#EF4444" : "#FACC15"))),
        scrollbarHover: isAgenda ? "#333333" : (isStory ? "#06B6D4" : (isFamily ? "#16A34A" : (isShop ? "#DC2626" : "#EAB308"))),
        
        playerColor: isAgenda ? "text-black" : (isStory ? "text-cyan-400" : (isFamily ? "text-green-500" : (isShop ? "text-red-500" : "text-yellow-400"))),
        playerBgColor: isAgenda ? "bg-black" : (isStory ? "bg-cyan-400" : (isFamily ? "bg-green-500" : (isShop ? "bg-red-500" : "bg-yellow-400"))),
        waveformColor: isAgenda ? "bg-black" : (isStory ? "bg-cyan-400" : (isFamily ? "bg-green-500" : (isShop ? "bg-black" : "bg-yellow-400"))),
        waveformColorFaded: isAgenda ? "bg-black/30" : (isStory ? "bg-cyan-400/50" : (isFamily ? "bg-green-500/50" : (isShop ? "bg-black/30" : "bg-yellow-400/30"))),
        
        noiseOverlay: "rgba(255,255,255,.035)",
        gridLines: "rgba(255,255,255,.05)"
      };
    }

    // Couleurs dynamiques pour la page home
    switch (currentTheme) {
      case 'cyan':
        return {
          primary: "#22d3ee",
          primaryHover: "#06b6d4",
          primaryFaded: "rgba(34,211,238,0.3)",
          
          menuColor: "#22d3ee",
          menuHoverBg: "#22d3ee",
          menuHoverText: "#000000",
          
          logoColor: "#22d3ee",
          
          scrollbarColor: "#22d3ee",
          scrollbarHover: "#06b6d4",
          
          playerColor: "text-cyan-400",
          playerBgColor: "bg-cyan-400",
          waveformColor: "bg-cyan-400",
          waveformColorFaded: "bg-cyan-400/30",
          
          noiseOverlay: "rgba(34,211,238,.035)",
          gridLines: "rgba(34,211,238,.05)"
        };
      case 'red':
        return {
          primary: "#ef4444",
          primaryHover: "#dc2626",
          primaryFaded: "rgba(239,68,68,0.3)",
          
          menuColor: "#ef4444",
          menuHoverBg: "#ef4444",
          menuHoverText: "#000000",
          
          logoColor: "#ef4444",
          
          scrollbarColor: "#ef4444",
          scrollbarHover: "#dc2626",
          
          playerColor: "text-red-500",
          playerBgColor: "bg-red-500",
          waveformColor: "bg-red-500",
          waveformColorFaded: "bg-red-500/30",
          
          noiseOverlay: "rgba(239,68,68,.035)",
          gridLines: "rgba(239,68,68,.05)"
        };
      case 'yellow':
      default:
        return {
          primary: "#FACC15",
          primaryHover: "#EAB308",
          primaryFaded: "rgba(250,204,21,0.3)",
          
          menuColor: "#FACC15",
          menuHoverBg: "#079fce",
          menuHoverText: "#000000",
          
          logoColor: "#ff6a00",
          
          scrollbarColor: "#FACC15",
          scrollbarHover: "#EAB308",
          
          playerColor: "text-yellow-400",
          playerBgColor: "bg-yellow-400",
          waveformColor: "bg-yellow-400",
          waveformColorFaded: "bg-yellow-400/30",
          
          noiseOverlay: "rgba(255,255,255,.035)",
          gridLines: "rgba(255,255,255,.05)"
        };
    }
  };

  return {
    colors: getGlobalColors(),
    currentTheme,
    isTransitioning,
    isHome,
    isAgenda
  };
}
