"use client";

import { useEffect } from 'react';
import { useGlobalDynamicColors } from '../hooks/useGlobalDynamicColors';

export default function DynamicColorProvider() {
  const { colors, currentTheme, isTransitioning } = useGlobalDynamicColors();

  useEffect(() => {
    // Appliquer les couleurs dynamiques aux variables CSS globales
    const root = document.documentElement;
    
    // Couleurs principales
    root.style.setProperty('--dynamic-primary', colors.primary);
    root.style.setProperty('--dynamic-primary-hover', colors.primaryHover);
    root.style.setProperty('--dynamic-primary-faded', colors.primaryFaded);
    
    // Couleurs du menu
    root.style.setProperty('--dynamic-menu-color', colors.menuColor);
    root.style.setProperty('--dynamic-menu-hover-bg', colors.menuHoverBg);
    root.style.setProperty('--dynamic-menu-hover-text', colors.menuHoverText);
    
    // Couleurs du logo
    root.style.setProperty('--dynamic-logo-color', colors.logoColor);
    
    // Couleurs de la scrollbar
    root.style.setProperty('--dynamic-scrollbar-color', colors.scrollbarColor);
    root.style.setProperty('--dynamic-scrollbar-hover', colors.scrollbarHover);
    
    // Couleurs des effets
    root.style.setProperty('--dynamic-noise-overlay', colors.noiseOverlay);
    root.style.setProperty('--dynamic-grid-lines', colors.gridLines);
    
    // Couleurs appliquées silencieusement

  }, [colors, currentTheme, isTransitioning]);

  // Ce composant ne rend rien, il ne fait que gérer les couleurs CSS
  return null;
}

