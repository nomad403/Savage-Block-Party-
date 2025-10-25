"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export type ColorTheme = 'yellow' | 'cyan' | 'red';

interface DynamicColors {
  backgroundColor: string;
  textColor: string;
  waveformColor: string;
  waveformColorFaded: string;
  playerColor: string;
  playerBgColor: string;
}

export function useDynamicColors() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAgenda = pathname?.startsWith("/agenda");
  const isStory = pathname?.startsWith("/story");
  
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>('yellow');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Écouter les changements de couleur depuis le player SoundCloud
  useEffect(() => {
    const handleColorChange = (event: CustomEvent) => {
      const { theme } = event.detail;
      setCurrentTheme(theme);
      setIsTransitioning(true);
      
      // Désactiver la transition après 500ms
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    };

    window.addEventListener('soundcloud-color-change', handleColorChange as EventListener);
    
    return () => {
      window.removeEventListener('soundcloud-color-change', handleColorChange as EventListener);
    };
  }, []);

  // Fonction pour obtenir les couleurs dynamiques
  const getColors = (): DynamicColors => {
    if (!isHome) {
      // Couleurs statiques pour les autres pages
      return {
        backgroundColor: isAgenda ? "bg-black" : (isStory ? "bg-cyan-400" : "bg-yellow-400"),
        textColor: "text-black",
        waveformColor: isAgenda ? "bg-black" : (isStory ? "bg-cyan-400" : "bg-yellow-400"),
        waveformColorFaded: isAgenda ? "bg-black/30" : (isStory ? "bg-cyan-400/30" : "bg-yellow-400/30"),
        playerColor: isAgenda ? "text-black" : (isStory ? "text-cyan-400" : "text-yellow-400"),
        playerBgColor: isAgenda ? "bg-black" : (isStory ? "bg-cyan-400" : "bg-yellow-400")
      };
    }

    // Couleurs dynamiques pour la page home
    switch (currentTheme) {
      case 'cyan':
        return {
          backgroundColor: "bg-cyan-400",
          textColor: "text-black",
          waveformColor: "bg-cyan-400",
          waveformColorFaded: "bg-cyan-400/30",
          playerColor: "text-cyan-400",
          playerBgColor: "bg-cyan-400"
        };
      case 'red':
        return {
          backgroundColor: "bg-red-500",
          textColor: "text-black",
          waveformColor: "bg-red-500",
          waveformColorFaded: "bg-red-500/30",
          playerColor: "text-red-500",
          playerBgColor: "bg-red-500"
        };
      case 'yellow':
      default:
        return {
          backgroundColor: "bg-yellow-400",
          textColor: "text-black",
          waveformColor: "bg-yellow-400",
          waveformColorFaded: "bg-yellow-400/30",
          playerColor: "text-yellow-400",
          playerBgColor: "bg-yellow-400"
        };
    }
  };

  return {
    colors: getColors(),
    currentTheme,
    isTransitioning,
    isHome,
    isAgenda
  };
}
