"use client";

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Hook pour obtenir la couleur primaire de la page actuelle
 * Cette couleur est utilisée par : logo, boutons menu, fond du player, waveform
 */
export function usePagePrimaryColor() {
  const pathname = usePathname();
  
  const primaryColor = useMemo(() => {
    if (pathname === "/") {
      return "#FF6A00"; // Orange vif pour home
    }
    if (pathname?.startsWith("/agenda")) {
      return "#0080FF"; // Bleu profond pour agenda
    }
    if (pathname?.startsWith("/family")) {
      return "#22C55E"; // Vert pour family
    }
    if (pathname?.startsWith("/shop")) {
      return "#FF1744"; // Rouge vif et pétillant pour shop
    }
    if (pathname?.startsWith("/presse")) {
      return "#A855F7"; // Violet pour presse
    }
    return "#000000"; // Noir par défaut
  }, [pathname]);

  return primaryColor;
}

/**
 * Fonction utilitaire pour obtenir la couleur primaire d'une page donnée
 */
export function getPagePrimaryColor(pathname: string | null): string {
  if (pathname === "/") {
    return "#FF6A00";
  }
  if (pathname?.startsWith("/agenda")) {
    return "#0080FF";
  }
  if (pathname?.startsWith("/family")) {
    return "#22C55E";
  }
  if (pathname?.startsWith("/shop")) {
    return "#FF1744";
  }
  if (pathname?.startsWith("/presse")) {
    return "#A855F7";
  }
  return "#000000";
}

