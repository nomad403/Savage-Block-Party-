"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const [isReady, setIsReady] = useState(false);
  
  // Utiliser les couleurs dynamiques globales
  const { colors } = useGlobalDynamicColors();
  
  // Ref pour stocker le scrollContainer afin d'éviter les re-query
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Déterminer si la page est scrollable
  useEffect(() => {
    if (pathname?.startsWith("/agenda")) {
      setIsScrollable(true);
      document.body.classList.add('scrollable-page', 'agenda');
      document.documentElement.classList.add('scrollable-page', 'agenda');
      document.body.classList.remove('home');
    } else if (pathname === "/") {
      setIsScrollable(false);
      document.body.classList.remove('scrollable-page', 'home', 'agenda');
      document.documentElement.classList.remove('scrollable-page', 'home', 'agenda');
    } else if (pathname?.startsWith("/shop")) {
      setIsScrollable(true);
      document.body.classList.add('scrollable-page', 'shop-page');
      document.documentElement.classList.add('scrollable-page', 'shop-page');
      document.body.classList.remove('home', 'agenda');
    } else {
      setIsScrollable(true);
      document.body.classList.add('scrollable-page', 'home');
      document.documentElement.classList.add('scrollable-page', 'home');
      document.body.classList.remove('agenda');
    }
    
    // Forcer le scroll vertical sur html et body pour les pages scrollables
    // et masquer complètement la scrollbar native
    if (pathname !== "/") {
      // Activer le scroll
      document.documentElement.style.overflowY = 'auto';
      document.body.style.overflowY = 'auto';
      document.documentElement.style.height = 'auto';
      document.body.style.height = 'auto';
      
      // Masquer la scrollbar native (cross-browser)
      document.documentElement.style.scrollbarWidth = 'none';
      document.body.style.scrollbarWidth = 'none';
      // Pour IE/Edge
      (document.documentElement as any).style.msOverflowStyle = 'none';
      (document.body as any).style.msOverflowStyle = 'none';
    } else {
      // Sur la home, désactiver le scroll
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.height = '100vh';
      document.body.style.height = '100vh';
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
    
    setIsReady(false);
    scrollContainerRef.current = null;
    
    const isShopPage = pathname?.startsWith("/shop");
    let scrollTimeout: NodeJS.Timeout | undefined;
    let currentLastScrollTime = Date.now();
    let currentLastScrollTop = 0;
    let cleanupExecuted = false;

    const findShopContainer = (): HTMLElement | null => {
      if (!isShopPage) return null;
      // Essayer d'abord par ID (plus rapide et fiable), puis par classe
      return document.getElementById('product-column') as HTMLElement | null 
        || document.querySelector('.product-column') as HTMLElement | null;
    };

    const handleScroll = () => {
      if (cleanupExecuted) return;
      
      const currentTime = Date.now();
      let currentScrollTop = 0;
      let newProgress = 0;

      if (isShopPage && scrollContainerRef.current instanceof HTMLElement) {
        currentScrollTop = scrollContainerRef.current.scrollTop;
        const scrollHeight = scrollContainerRef.current.scrollHeight;
        const clientHeight = scrollContainerRef.current.clientHeight;
        const totalScrollable = Math.max(0, scrollHeight - clientHeight);
        
        if (totalScrollable <= 0) {
          newProgress = 0;
        } else {
          newProgress = Math.min(Math.max(currentScrollTop / totalScrollable, 0), 1);
        }
        setScrollProgress(newProgress);
      } else {
        // Pour window scroll
        currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = document.documentElement.scrollHeight;
        const viewportHeight = window.innerHeight;
        const totalScrollable = Math.max(0, documentHeight - viewportHeight);
        
        if (totalScrollable <= 0) {
          newProgress = 0;
      } else {
          newProgress = Math.min(Math.max(currentScrollTop / totalScrollable, 0), 1);
        }
        setScrollProgress(newProgress);
      }

      // Calculer la vélocité de scroll
      const timeDiff = currentTime - currentLastScrollTime;
      const scrollDiff = Math.abs(currentScrollTop - currentLastScrollTop);
      const velocity = timeDiff > 0 ? scrollDiff / timeDiff : 0;

      setScrollVelocity(velocity);
      setLastScrollTime(currentTime);
      setLastScrollTop(currentScrollTop);
      
      // Mettre à jour les valeurs locales
      currentLastScrollTime = currentTime;
      currentLastScrollTop = currentScrollTop;

      // Activer l'effet gooey
      setIsScrolling(true);

      // Désactiver l'effet après un délai
      if (scrollTimeout !== undefined) {
      clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
        setScrollVelocity(0);
      }, 150);
    };

    const initializeListeners = () => {
      // Éviter les initialisations multiples
      if (cleanupExecuted) return;
      
      if (isShopPage) {
        const container = findShopContainer();
        if (container) {
          scrollContainerRef.current = container;
          currentLastScrollTop = container.scrollTop;
          container.addEventListener('scroll', handleScroll, { passive: true });
          handleScroll(); // Initial call
          setIsReady(true);
          return;
        }
        // Si pas de container trouvé, continuer avec window scroll (fallback)
      }
      
      // Pour window scroll (toutes les pages sauf shop, ou shop sans container)
      currentLastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      let lastScrollTop = currentLastScrollTop;
      const checkScroll = () => {
        if (cleanupExecuted) return;
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (currentScrollTop !== lastScrollTop) {
          lastScrollTop = currentScrollTop;
          handleScroll();
        }
        rafIdRef.current = requestAnimationFrame(checkScroll);
      };
      rafIdRef.current = requestAnimationFrame(checkScroll);
      window.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
      setIsReady(true);
    };

    // Pour la page shop, utiliser requestAnimationFrame pour attendre que le DOM soit prêt
    // Pour les autres pages, initialiser directement
    if (isShopPage) {
      let initRafId: number;
      let frameCount = 0;
      const maxFrames = 10; // Maximum 10 frames (~166ms à 60fps)
      
      const initOnNextFrame = () => {
        frameCount++;
        const container = findShopContainer();
        if (container || frameCount >= maxFrames) {
          initializeListeners();
        } else {
          initRafId = requestAnimationFrame(initOnNextFrame);
        }
      };
      
      initRafId = requestAnimationFrame(initOnNextFrame);
      
      // Fallback timeout
      const timeoutId = setTimeout(() => {
        if (initRafId !== undefined) {
          cancelAnimationFrame(initRafId);
        }
        initializeListeners();
      }, 300);
      
      return () => {
        cleanupExecuted = true;
        clearTimeout(timeoutId);
        if (initRafId !== undefined) {
          cancelAnimationFrame(initRafId);
        }
        if (scrollTimeout !== undefined) {
          clearTimeout(scrollTimeout);
        }
        
        if (scrollContainerRef.current instanceof HTMLElement) {
          scrollContainerRef.current.removeEventListener('scroll', handleScroll);
        }
        
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('scroll', handleScroll);
      };
    }
    
    // Pour les autres pages, initialiser directement avec un petit délai
    const timeoutId = setTimeout(() => {
      initializeListeners();
    }, 50);

    // Cleanup function pour les autres pages
    return () => {
      cleanupExecuted = true;
      clearTimeout(timeoutId);
      if (scrollTimeout !== undefined) {
      clearTimeout(scrollTimeout);
      }
      
      // Nettoyer les listeners
      if (scrollContainerRef.current instanceof HTMLElement) {
        scrollContainerRef.current.removeEventListener('scroll', handleScroll);
      }
      
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [isScrollable, windowHeight, pathname]);

  if (!isScrollable || windowHeight === 0 || !isReady) return null;

  // Pour la page shop, ajuster la hauteur (entre header et footer)
  const isShopPage = pathname?.startsWith("/shop");
  let scrollbarHeight = windowHeight;
  
  if (isShopPage && typeof window !== 'undefined') {
    // Utiliser l'ID en priorité pour la performance
    const productColumn = document.getElementById("product-column") as HTMLElement | null
      || document.querySelector(".product-column") as HTMLElement | null;
    const footer = document.querySelector('footer') as HTMLElement | null;
    const footerHeight = footer ? footer.offsetHeight : 200;
    const headerHeight = 140;
    
    if (productColumn) {
      scrollbarHeight = Math.max(0, productColumn.clientHeight);
    } else {
      scrollbarHeight = Math.max(0, windowHeight - headerHeight - footerHeight);
    }
  }
  
  const thumbHeight = Math.max(20, scrollbarHeight * 0.1);
  const maxTop = scrollbarHeight - thumbHeight;
  const thumbTop = Math.max(0, Math.min(scrollProgress * maxTop, maxTop));

  const thumbClasses = [
    'custom-scrollbar-thumb',
    isScrolling && scrollVelocity > 0.3 ? 'scrolling-fast' : '',
    isScrolling && scrollVelocity <= 0.3 && scrollVelocity > 0.1 ? 'scrolling' : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      className="custom-scrollbar"
      style={isShopPage ? {
        height: `${scrollbarHeight}px`
      } : {}}
    >
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
