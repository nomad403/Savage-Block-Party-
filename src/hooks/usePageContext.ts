"use client";

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Type pour identifier les pages
 */
export type PageId = 'home' | 'agenda' | 'family' | 'shop' | 'presse' | 'story' | 'unknown';

/**
 * Interface pour le contexte de page
 */
export interface PageContext {
  /** Pathname actuel */
  pathname: string;
  /** ID de la page (home, agenda, family, shop, presse, story, unknown) */
  pageId: PageId;
  /** ID de l'élément root de la page (ex: "#home-root", "#agenda-root") */
  rootId: string;
  /** Booléens pour chaque page */
  isHome: boolean;
  isAgenda: boolean;
  isFamily: boolean;
  isShop: boolean;
  isPresse: boolean;
  isStory: boolean;
}

/**
 * Hook centralisé pour détecter la page actuelle
 * 
 * Remplace toutes les duplications de logique :
 * - pathname === "/"
 * - pathname?.startsWith("/agenda")
 * - pathname?.startsWith("/family")
 * - pathname?.startsWith("/shop")
 * - pathname?.startsWith("/presse")
 * 
 * @returns PageContext avec toutes les informations sur la page actuelle
 */
export function usePageContext(): PageContext {
  const pathname = usePathname();
  
  return useMemo(() => {
    // Déterminer le pageId et rootId
    let pageId: PageId = 'unknown';
    let rootId = '#unknown-root';
    
    if (pathname === "/") {
      pageId = 'home';
      rootId = '#home-root';
    } else if (pathname?.startsWith("/agenda")) {
      pageId = 'agenda';
      rootId = '#agenda-root';
    } else if (pathname?.startsWith("/family")) {
      pageId = 'family';
      rootId = '#family-root';
    } else if (pathname?.startsWith("/shop")) {
      pageId = 'shop';
      rootId = '#shop-root';
    } else if (pathname?.startsWith("/presse")) {
      pageId = 'presse';
      rootId = '#presse-root';
    } else if (pathname?.startsWith("/story")) {
      pageId = 'story';
      rootId = '#story-root';
    }
    
    return {
      pathname: pathname || '',
      pageId,
      rootId,
      isHome: pageId === 'home',
      isAgenda: pageId === 'agenda',
      isFamily: pageId === 'family',
      isShop: pageId === 'shop',
      isPresse: pageId === 'presse',
      isStory: pageId === 'story',
    };
  }, [pathname]);
}

/**
 * Fonction utilitaire pour obtenir le contexte de page depuis un pathname
 * Utile pour les fonctions non-hooks (ex: getPagePrimaryColor)
 */
export function getPageContext(pathname: string | null): Omit<PageContext, 'pathname'> {
  let pageId: PageId = 'unknown';
  let rootId = '#unknown-root';
  
  if (pathname === "/") {
    pageId = 'home';
    rootId = '#home-root';
  } else if (pathname?.startsWith("/agenda")) {
    pageId = 'agenda';
    rootId = '#agenda-root';
  } else if (pathname?.startsWith("/family")) {
    pageId = 'family';
    rootId = '#family-root';
  } else if (pathname?.startsWith("/shop")) {
    pageId = 'shop';
    rootId = '#shop-root';
  } else if (pathname?.startsWith("/presse")) {
    pageId = 'presse';
    rootId = '#presse-root';
  } else if (pathname?.startsWith("/story")) {
    pageId = 'story';
    rootId = '#story-root';
  }
  
  return {
    pageId,
    rootId,
    isHome: pageId === 'home',
    isAgenda: pageId === 'agenda',
    isFamily: pageId === 'family',
    isShop: pageId === 'shop',
    isPresse: pageId === 'presse',
    isStory: pageId === 'story',
  };
}

