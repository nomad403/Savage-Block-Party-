"use client";

import { useState, useEffect } from 'react';

/**
 * Hook pour détecter si l'utilisateur utilise un périphérique tactile
 * 
 * IMPORTANT : Ce hook permet de différencier les interactions touch vs mouse
 * pour éviter les conflits entre événements touch et mouse sur mobile.
 * 
 * Sur mobile, les navigateurs émettent souvent des événements mouse après les touch,
 * ce qui peut créer des états hover indésirables.
 * 
 * @returns boolean - true si l'appareil supporte le touch
 * 
 * @example
 * const hasTouch = useHasTouch();
 * // Utiliser uniquement onTouchStart/onTouchEnd si hasTouch === true
 * // Utiliser uniquement onMouseEnter/onMouseLeave si hasTouch === false
 */
export function useHasTouch(): boolean {
  const [hasTouch, setHasTouch] = useState(false);

  useEffect(() => {
    // Vérifier que window est disponible (SSR)
    if (typeof window === 'undefined') {
      return;
    }

    // Détecter si l'appareil supporte le touch
    // Vérifier plusieurs méthodes pour une meilleure compatibilité
    const hasTouchSupport = 
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - pour les anciens navigateurs
      (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);

    setHasTouch(hasTouchSupport);

    // Écouter le premier événement touch pour confirmer
    const handleFirstTouch = () => {
      setHasTouch(true);
      // Ne garder l'écouteur qu'une seule fois
      document.removeEventListener('touchstart', handleFirstTouch);
    };

    // Écouter le premier événement mouse pour confirmer que ce n'est pas un périphérique tactile
    const handleFirstMouse = () => {
      // Si on détecte un mouse avant un touch, c'est probablement un desktop
      // Mais on ne change pas hasTouch car un appareil peut avoir les deux
      document.removeEventListener('mousemove', handleFirstMouse);
    };

    document.addEventListener('touchstart', handleFirstTouch, { passive: true });
    document.addEventListener('mousemove', handleFirstMouse, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleFirstTouch);
      document.removeEventListener('mousemove', handleFirstMouse);
    };
  }, []);

  return hasTouch;
}
