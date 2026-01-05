"use client";

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { usePagePrimaryColor } from './usePagePrimaryColor';
import { useMenuHover } from './useMenuHover';

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
  waveformColor: string; // Valeur hex pour style inline
  waveformColorFaded: string; // Valeur hex avec opacité pour style inline
  
  // Couleurs pour les effets
  noiseOverlay: string;
  gridLines: string;
}

export function useGlobalDynamicColors() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAgenda = pathname?.startsWith("/agenda");
  const isFamily = pathname?.startsWith("/family");
  const isShop = pathname?.startsWith("/shop");
  const isPresse = pathname?.startsWith("/presse");
  
  // Utiliser les hooks centralisés
  const pagePrimaryColor = usePagePrimaryColor();
  const { isMenuHovered } = useMenuHover();
  
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>('red');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!isHome) {
      // Reset to default if not on home page
      setCurrentTheme('red');
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
      let newTheme: ColorTheme = 'red'; // 🔴 Rouge/orange par défaut (afro-latino-hip hop)
      if (intensity > 0.5) {
        newTheme = 'red';      // 🔴 Énergie élevée (drops, kicks forts)
      } else if (intensity > 0.25) {
        newTheme = 'cyan';    // 🟦 Énergie moyenne (mid groove)
      } else {
        newTheme = 'red';     // 🔴 Énergie faible (calme, intro) - reste rouge/orange
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
    // LOGIQUE GLOBALE : Si un menu est survolé, tous les éléments permanents deviennent noirs
    const logoColor = isMenuHovered ? "#000000" : (isHome ? "#FF6A00" : pagePrimaryColor);
    const menuColor = isMenuHovered ? "#000000" : (isHome ? "#FF6A00" : pagePrimaryColor);
    const playerBgColorValue = isMenuHovered ? "#000000" : (isHome ? "#FF6A00" : pagePrimaryColor);
    
    // Pour waveform, retourner les valeurs hex pour styles inline
    let waveformColorHex: string;
    let waveformColorFadedHex: string;
    if (isMenuHovered) {
      waveformColorHex = "#000000";
      waveformColorFadedHex = "rgba(0, 0, 0, 0.3)";
    } else if (isHome) {
      waveformColorHex = "#FF6A00";
      waveformColorFadedHex = "rgba(255, 106, 0, 0.3)";
    } else {
      waveformColorHex = pagePrimaryColor;
      // Convertir hex en rgba avec opacité
      const hex = pagePrimaryColor.replace('#', '');
      let r: number, g: number, b: number;
      if (hex.length === 3) {
        // Format court #RGB
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else {
        // Format long #RRGGBB
        r = parseInt(hex.substr(0, 2), 16);
        g = parseInt(hex.substr(2, 2), 16);
        b = parseInt(hex.substr(4, 2), 16);
      }
      waveformColorFadedHex = `rgba(${r}, ${g}, ${b}, 0.3)`;
    }
    
    if (!isHome) {
      // Couleurs statiques pour les autres pages
      return {
        primary: pagePrimaryColor,
        primaryHover: isAgenda ? "#333333" : (isFamily ? "#16A34A" : (isShop ? "#E0143D" : "#EAB308")),
        primaryFaded: isAgenda ? "rgba(0,0,0,0.3)" : (isFamily ? "rgba(34,197,94,0.3)" : (isShop ? "rgba(255,23,68,0.3)" : "rgba(250,204,21,0.3)")),
        
        menuColor: menuColor,
        menuHoverBg: pagePrimaryColor,
        menuHoverText: "#000000",
        
        logoColor: logoColor,
        
        scrollbarColor: "#000000", // Toujours noir pour les éléments permanents
        scrollbarHover: "#333333",
        
        playerColor: isMenuHovered ? "text-white" : (isAgenda ? "text-white" : "text-black"),
        playerBgColor: playerBgColorValue,
        waveformColor: waveformColorHex,
        waveformColorFaded: waveformColorFadedHex,
        
        noiseOverlay: "rgba(255,255,255,.035)",
        gridLines: "rgba(255,255,255,.05)"
      };
    }

    // Couleurs dynamiques pour la page home
    // Sur home, on utilise l'orange vif (#FF6A00) comme couleur primaire
    const homePrimary = "#FF6A00";
    
    return {
      primary: isMenuHovered ? "#000000" : homePrimary,
      primaryHover: "#E55A00",
      primaryFaded: "rgba(255, 106, 0, 0.3)",
      
      menuColor: menuColor,
      menuHoverBg: homePrimary,
      menuHoverText: "#000000",
      
      logoColor: logoColor,
      
      scrollbarColor: "#000000", // Toujours noir pour les éléments permanents
      scrollbarHover: "#333333",
      
      playerColor: isMenuHovered ? "text-white" : "text-black",
      playerBgColor: playerBgColorValue,
      waveformColor: waveformColorHex,
      waveformColorFaded: waveformColorFadedHex,
      
      noiseOverlay: "rgba(255,106,0,.035)",
      gridLines: "rgba(255,106,0,.05)"
    };
  };

  // Mémoriser les couleurs pour éviter les re-renders inutiles
  // Inclure toutes les dépendances nécessaires pour que les couleurs se mettent à jour
  const colors = useMemo(() => getGlobalColors(), [isHome, isAgenda, isFamily, isShop, isPresse, currentTheme, pagePrimaryColor, isMenuHovered]);

  return {
    colors,
    currentTheme,
    isTransitioning,
    isHome,
    isAgenda
  };
}
