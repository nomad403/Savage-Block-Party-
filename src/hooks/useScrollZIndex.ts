"use client";

import { useState, useEffect } from 'react';

/**
 * Hook pour gérer le z-index dynamique entre les dropdowns et la waveform
 * selon la position du scroll pour une UX intuitive
 */
export function useScrollZIndex() {
  const [scrollY, setScrollY] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const [documentHeight, setDocumentHeight] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      setScrollY(window.scrollY);
      setWindowHeight(window.innerHeight);
      setDocumentHeight(document.documentElement.scrollHeight);
    };

    // Initialiser
    updateScroll();

    // Écouter le scroll avec throttling pour performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, []);

  // Calculer la position relative du scroll (0 = haut, 1 = bas)
  const scrollProgress = documentHeight > windowHeight 
    ? Math.min(1, Math.max(0, scrollY / (documentHeight - windowHeight)))
    : 0;

  // Zone de transition : les 40% du milieu de la page pour une transition plus douce
  // En haut (0-30%) : dropdowns prioritaires
  // En bas (70-100%) : waveform prioritaire
  // Milieu (30-70%) : transition douce avec interpolation
  const isNearTop = scrollProgress < 0.30;
  const isNearBottom = scrollProgress > 0.70;
  const isInTransition = scrollProgress >= 0.30 && scrollProgress <= 0.70;

  // Calculer le z-index avec interpolation pour une transition fluide
  let dropdownsZIndex: number;
  let waveformZIndex: number;

  if (isNearTop) {
    // En haut : dropdowns prioritaires
    dropdownsZIndex = 10002;
    waveformZIndex = 10000;
  } else if (isNearBottom) {
    // En bas : waveform prioritaire
    dropdownsZIndex = 10000;
    waveformZIndex = 10002;
  } else {
    // Zone de transition : interpolation linéaire
    // Normaliser la progression dans la zone de transition (0 à 1)
    const transitionProgress = (scrollProgress - 0.30) / 0.40;
    // Interpoler entre 10002 et 10000
    dropdownsZIndex = Math.round(10002 - (transitionProgress * 2));
    waveformZIndex = Math.round(10000 + (transitionProgress * 2));
  }

  return {
    scrollY,
    scrollProgress,
    isNearTop,
    isNearBottom,
    isInTransition,
    dropdownsZIndex,
    waveformZIndex
  };
}

