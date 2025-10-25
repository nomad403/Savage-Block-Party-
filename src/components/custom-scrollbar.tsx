"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useGlobalDynamicColors } from "../hooks/useGlobalDynamicColors";

export default function CustomScrollbar() {
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [lastScrollTime, setLastScrollTime] = useState(0);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  
  // Utiliser les couleurs dynamiques globales
  const { colors } = useGlobalDynamicColors();

  // Déterminer si la page est scrollable
  useEffect(() => {
    if (pathname?.startsWith("/agenda")) {
      setIsScrollable(true);
      document.body.classList.add('scrollable-page', 'agenda');
      document.body.classList.remove('home');
    } else if (pathname === "/") {
      setIsScrollable(false);
      document.body.classList.remove('scrollable-page', 'home', 'agenda');
    } else {
      setIsScrollable(true);
      document.body.classList.add('scrollable-page', 'home');
      document.body.classList.remove('agenda');
    }
  }, [pathname]);

  // Mettre à jour la hauteur de la fenêtre
  useEffect(() => {
    const updateWindowHeight = () => {
      setWindowHeight(window.innerHeight);
    };

    updateWindowHeight();
    window.addEventListener('resize', updateWindowHeight);
    return () => window.removeEventListener('resize', updateWindowHeight);
  }, []);

  // Calculer la progression du scroll
  const updateScrollProgress = useCallback(() => {
    if (!isScrollable) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - windowHeight;
    const progress = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;
    
    setScrollProgress(progress);
  }, [isScrollable, windowHeight]);

  useEffect(() => {
    if (!isScrollable) return;
    
    const scrollContainer = document.querySelector('.scrollable-page') || window;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentTime = Date.now();
      let currentScrollTop = 0;

      if (scrollContainer === window) {
        currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - windowHeight;
        setScrollProgress(scrollHeight > 0 ? Math.min(currentScrollTop / scrollHeight, 1) : 0);
      } else {
        const el = scrollContainer as HTMLElement;
        currentScrollTop = el.scrollTop;
        const scrollHeight = el.scrollHeight - el.clientHeight;
        setScrollProgress(scrollHeight > 0 ? Math.min(currentScrollTop / scrollHeight, 1) : 0);
      }

      // Calculer la vélocité de scroll
      const timeDiff = currentTime - lastScrollTime;
      const scrollDiff = Math.abs(currentScrollTop - lastScrollTop);
      const velocity = timeDiff > 0 ? scrollDiff / timeDiff : 0;

      setScrollVelocity(velocity);
      setLastScrollTime(currentTime);
      setLastScrollTop(currentScrollTop);

      // Activer l'effet gooey
      setIsScrolling(true);

      // Désactiver l'effet après un délai
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
        setScrollVelocity(0);
      }, 150);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isScrollable, windowHeight, lastScrollTime, lastScrollTop]);

  if (!isScrollable || windowHeight === 0) return null;

  const thumbHeight = Math.max(20, windowHeight * 0.1); // Minimum 20px, 10% de la hauteur
  const maxTop = windowHeight - thumbHeight;
  const thumbTop = scrollProgress * maxTop;

  // Déterminer les classes CSS selon l'état de scroll
  const thumbClasses = [
    'custom-scrollbar-thumb',
    isScrolling && scrollVelocity > 0.3 ? 'scrolling-fast' : '',
    isScrolling && scrollVelocity <= 0.3 && scrollVelocity > 0.1 ? 'scrolling' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="custom-scrollbar">
      <div className="custom-scrollbar-track">
        <div 
          className={thumbClasses}
          style={{
            top: `${thumbTop}px`,
            height: `${thumbHeight}px`,
            backgroundColor: colors.scrollbarColor,
          }}
        />
      </div>
    </div>
  );
}
