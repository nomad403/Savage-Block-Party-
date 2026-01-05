"use client";

import { useState, useEffect } from 'react';
import { getPagePrimaryColor } from './usePagePrimaryColor';

/**
 * Hook centralisé pour gérer l'état de hover du menu
 * Quand un bouton menu est survolé :
 * - Tous les éléments permanents (logo, menu, player, waveform) deviennent noirs
 * - Un overlay avec la couleur primaire de la page survolée s'affiche
 */
export function useMenuHover() {
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);
  const [overlayColor, setOverlayColor] = useState<string | null>(null);

  // Écouter les événements de hover du menu depuis le header
  useEffect(() => {
    const handleMenuItemHover = (event: CustomEvent) => {
      const itemHref = event.detail.itemHref;
      if (itemHref) {
        setHoveredMenuItem(itemHref);
        const color = getPagePrimaryColor(itemHref);
        setOverlayColor(color);
      } else {
        setHoveredMenuItem(null);
        setOverlayColor(null);
      }
    };

    window.addEventListener('menuItemHover', handleMenuItemHover as EventListener);
    return () => {
      window.removeEventListener('menuItemHover', handleMenuItemHover as EventListener);
    };
  }, []);

  return {
    isMenuHovered: !!hoveredMenuItem,
    hoveredMenuItem,
    overlayColor
  };
}

