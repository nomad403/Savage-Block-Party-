"use client";

import { useState, useEffect } from 'react';

type ScrollDirection = 'up' | 'down' | null;

/**
 * Hook pour détecter la direction du scroll
 * 
 * RESPONSABILITÉ UNIQUE : Détecter la direction du scroll (up/down)
 * 
 * Retourne :
 * - 'down' : scroll vers le bas
 * - 'up' : scroll vers le haut
 * - null : pas de scroll ou direction indéterminée
 */
export function useScrollDirection(): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>(null);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      
      // Seuil minimal pour éviter les micro-mouvements
      const threshold = 5;
      
      if (Math.abs(currentScrollY - lastScrollY) < threshold) {
        return; // Ignorer les micro-mouvements
      }

      if (currentScrollY > lastScrollY) {
        setDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setDirection('up');
      }

      setLastScrollY(currentScrollY);
    };

    // Initialiser
    setLastScrollY(window.scrollY || document.documentElement.scrollTop || 0);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  return direction;
}

