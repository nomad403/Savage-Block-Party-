"use client";

import { useState, useEffect } from 'react';

/**
 * Breakpoints standardisés pour toute l'application
 * Ces valeurs doivent correspondre aux breakpoints Tailwind :
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 */
export const BREAKPOINTS = {
  mobile: 768,   // < 768px (<= 767px)
  tablet: 1024,  // >= 768px et < 1024px
  desktop: 1024, // >= 1024px
} as const;

/**
 * Hook pour détecter si une media query correspond
 * Utilise window.matchMedia pour une meilleure performance et gestion du resize
 * 
 * @param query - Media query string (ex: "(max-width: 767px)")
 * @returns boolean - true si la media query correspond
 * 
 * @example
 * const isMobile = useMediaQuery("(max-width: 767px)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Vérifier que window est disponible (SSR)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Définir la valeur initiale
    setMatches(mediaQuery.matches);

    // Créer un handler pour les changements
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Écouter les changements (méthode moderne)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => {
        mediaQuery.removeEventListener('change', handler);
      };
    } else {
      // Fallback pour les anciens navigateurs
      mediaQuery.addListener(handler);
      return () => {
        mediaQuery.removeListener(handler);
      };
    }
  }, [query]);

  return matches;
}

/**
 * Hook pour détecter si on est sur mobile (< 768px)
 * 
 * @returns boolean - true si on est sur mobile
 * 
 * @example
 * const isMobile = useIsMobile();
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
}

/**
 * Hook pour détecter si on est sur tablette (>= 768px et < 1024px)
 * 
 * @returns boolean - true si on est sur tablette
 * 
 * @example
 * const isTablet = useIsTablet();
 */
export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`);
}

/**
 * Hook pour détecter si on est sur desktop (>= 1024px)
 * 
 * @returns boolean - true si on est sur desktop
 * 
 * @example
 * const isDesktop = useIsDesktop();
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
}

/**
 * Hook pour obtenir toutes les informations de breakpoint
 * 
 * @returns Object avec isMobile, isTablet, isDesktop
 * 
 * @example
 * const { isMobile, isTablet, isDesktop } = useBreakpoints();
 */
export function useBreakpoints() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
}

