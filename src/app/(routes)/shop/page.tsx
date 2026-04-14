"use client";

import { useRef, useLayoutEffect, useMemo, useState, useEffect, useCallback } from "react";
import { useMenu } from "@/hooks/useMenu";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { shopEvents } from "@/lib/events/app-events";
import "./shop.css";

// Composant pour le texte défilant avec vitesse constante et boucle infinie sans interruption
function ScrollingText({ words, productId }: { words: string[]; productId: number }) {
  const textWrapperRef = useRef<HTMLDivElement>(null);
  
  // Dupliquer les mots plusieurs fois pour garantir une boucle continue
  // On duplique 3 fois pour avoir suffisamment de contenu pour une boucle fluide
  const duplicatedWords = [...words, ...words, ...words];
  
  // Calculer la durée de l'animation pour une vitesse constante (60px/s)
  useLayoutEffect(() => {
    if (textWrapperRef.current) {
      // Attendre que le DOM soit complètement rendu
      const updateAnimation = () => {
        if (textWrapperRef.current) {
          // La largeur totale du contenu dupliqué
          const totalWidth = textWrapperRef.current.scrollWidth;
          // On veut animer d'exactement 1/3 de la largeur totale (car on a dupliqué 3 fois)
          // Cela garantit que quand la première copie sort, la deuxième entre exactement
          const widthToScroll = totalWidth / 3;
          const speed = 60; // pixels par seconde
          const duration = widthToScroll / speed; // durée en secondes
          textWrapperRef.current.style.animationDuration = `${duration}s`;
        }
      };
      
      // Utiliser requestAnimationFrame pour s'assurer que le layout est calculé
      requestAnimationFrame(() => {
        requestAnimationFrame(updateAnimation);
      });
    }
  }, [words]);
  
  return (
    <div className="product-scrolling-text">
      <div className="product-scrolling-text-wrapper" ref={textWrapperRef}>
        {duplicatedWords.map((word, idx) => (
          <span key={`${productId}-${idx}`}>{word}</span>
        ))}
      </div>
    </div>
  );
}

export default function ShopPage() {
  const productColumnRef = useRef<HTMLDivElement>(null);
  const shopRootRef = useRef<HTMLDivElement>(null);
  const { isMenuOpen } = useMenu();
  // Utiliser le hook centralisé pour la détection mobile
  const isMobile = useIsMobile();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<number | null>(null);

  // Utiliser useLayoutEffect pour garantir que le DOM est mis à jour avant le paint
  useLayoutEffect(() => {
    // S'assurer que les styles CSS sont appliqués dès que #shop-root existe
    // Pas besoin de forcer un reflow, le navigateur le fera automatiquement
    if (shopRootRef.current) {
      // Les styles CSS basés sur :has(#shop-root) seront automatiquement appliqués
      // On peut juste s'assurer que l'élément est bien présent
    }
  }, []);

  // Notifier quand un item est sélectionné pour changer les couleurs du header
  useEffect(() => {
    shopEvents.itemSelected(selectedProductId !== null);
  }, [selectedProductId]);

  // Notifier le hover uniquement en desktop (mobile n'a pas de vrai hover).
  // Cela évite les conflits entre "focus tactile" et sélection au tap.
  useEffect(() => {
    if (!isMobile) {
      shopEvents.itemHovered(hoveredProductId !== null, hoveredProductId);
    } else {
      shopEvents.itemHovered(false, null);
    }
  }, [hoveredProductId, isMobile]);

  // Cleanup global à la sortie de la page shop (navigation pendant hover/click).
  useEffect(() => {
    return () => {
      shopEvents.itemSelected(false);
      shopEvents.itemHovered(false, null);
    };
  }, []);

  // NOTE: Les couleurs du header sont maintenant gérées par DynamicColorProvider
  // qui applique les classes CSS conditionnelles (shop-item-selected, shop-item-hovered)
  // Plus besoin de manipulation DOM directe avec setProperty

  // Générateur de nombres pseudo-aléatoires déterministe basé sur un seed
  const seededRandom = (seed: number) => {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  };

  // Fonction pour mélanger aléatoirement un tableau de manière déterministe (Fisher-Yates)
  const shuffleArrayDeterministic = <T,>(array: T[], random: () => number): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Générer un ordre déterministe différent pour chaque produit (basé sur productId)
  // Utilise useMemo pour mémoriser les mots et éviter les re-renders
  const getRandomWordsForProduct = useMemo(() => {
    const cache = new Map<number, string[]>();
    
    return (productId: number): string[] => {
      // Si déjà en cache, retourner le résultat mémorisé
      if (cache.has(productId)) {
        return cache.get(productId)!;
      }

      const allWords = ["culture", "savage", "block party", "club party", "soundsystem", "rave", "freedom", "funk", "soul", "disco", "house", "techno", "electronic", "hip-hop", "rap", "r&b", "jazz", "blues", "rock", "metal", "punk", "grunge", "indie", "alternative", "classic", "new wave", "post-punk", "post-rock", "post-metal"];
      
      // Utiliser productId comme seed pour générer des nombres pseudo-aléatoires déterministes
      const random = seededRandom(productId * 1000);
      
      // Mélanger de manière déterministe
      const shuffled = shuffleArrayDeterministic(allWords, random);
      
      // Sélectionner un nombre de mots déterministe (entre 4 et 8) basé sur productId
      const numWords = Math.floor(random() * 5) + 4;
      
      // Prendre un sous-ensemble déterministe
      const selectedWords = shuffled.slice(0, numWords);
      
      // Mélanger encore une fois le sous-ensemble de manière déterministe
      const finalWords = shuffleArrayDeterministic(selectedWords, random);
      
      // Mettre en cache pour éviter de recalculer
      cache.set(productId, finalWords);
      
      return finalWords;
    };
  }, []);

  // Données des produits (exemple)
  const products = [
    {
      id: 1,
      title: "T-Shirt Savage",
      price: "29€",
      image: "/shop/products/t-shirt%20face.png", // image face
      imageHover: "/shop/products/t-shirt%20dos.png" // image dos pour le hover
    },
    {
      id: 2,
      title: "Hoodie SBP",
      price: "69€",
      image: "/shop/products/sweat%20savage.png", // image face
      imageHover: "/shop/products/sweat%20savage2.png" // image dos pour le hover
    },
    {
      id: 3,
      title: "Cap Logo",
      price: "25€",
      image: "/shop/products/bob_savage.png", // image face
      imageHover: "/shop/products/bob_savage2.png" // image dos pour le hover
    }
  ];

  return (
    <>
      {/* Style pour rendre tous les éléments en rouge sauf le footer */}
      <style jsx global>{`
        /* Logo en noir par défaut sur la page shop */
        body:has(#shop-root) header .logo-tint-black {
          filter: brightness(0) saturate(100%) !important;
        }
        
        /* Menu hamburger en rouge (couleur primaire) sur la page shop */
        /* La couleur est gérée par les classes CSS conditionnelles dans shop.css */
        /* Plus besoin de forcer avec !important, les classes shop-item-hovered/selected prennent le dessus */

        /* Bouton menu actif en noir sur la page shop */
        body:has(#shop-root) header nav a.menu-item-active {
          color: #000000 !important;
        }

        /* Exception : l'icône panier doit garder la couleur primaire de la page */
        body:has(#shop-root) .header-player a[href="/shop"] {
          color: #FF1744 !important;
        }

        body:has(#shop-root) .header-player a[href="/shop"] svg {
          fill: #FF1744 !important;
        }

        /* Quand un item est sélectionné : logo, menu, waveform et player deviennent noirs */
        body:has(.product-item.selected) header svg[aria-label="Savage Block Party"] {
          fill: #000000 !important;
        }

        /* Forcer les boutons menu en noir quand un item est sélectionné */
        body:has(.product-item.selected) header button span,
        body:has(.product-item.selected) header button span[style*="background-color"],
        body:has(.product-item.selected) header button span[style*="backgroundColor"] {
          background-color: #000000 !important;
        }

        /* Forcer les liens du menu desktop en noir quand un item est sélectionné */
        body:has(.product-item.selected) header nav a,
        body:has(.product-item.selected) header nav a[style*="color"] {
          color: #000000 !important;
        }

        /* Mobile : boutons menu en noir quand un item est sélectionné (géré par header.tsx via événement shopItemSelected) */
        /* La logique est centralisée dans header.tsx - MenuButtonSpan utilise setProperty avec !important */

        /* NOTE: Les couleurs du player sont maintenant gérées de façon centralisée :
         * - useGlobalDynamicColors calcule playerBgColor et playerTextColor
         * - header-player.tsx utilise ces couleurs via style inline
         * - Les classes CSS conditionnelles (shop-item-selected, shop-item-hovered, menu-hovered)
         *   sont appliquées par DynamicColorProvider pour les cas spéciaux
         * Plus besoin de règles CSS avec !important qui créent des conflits
         */

        /* Waveform en noir quand un item est sélectionné */
        body:has(.product-item.selected) #sbp-footer-waveform div[style*="backgroundColor"],
        body:has(.product-item.selected) #sbp-footer-waveform div[style*="background-color"] {
          background-color: #000000 !important;
        }

        /* Animation pour les images de produits au hover */
        .product-image-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .product-image-front,
        .product-image-back {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          transition: opacity 0.5s ease;
          z-index: 1;
          transform: scale(1.3);
        }

        /* S'assurer que le wrapper d'image ne coupe pas les images */
        .product-image-wrapper {
          overflow: visible !important;
          height: var(--shop-item-image-height) !important;
        }

        .product-image-back {
          opacity: 0;
        }

        .product-image-container:hover .product-image-back {
          opacity: 1;
        }

        .product-image-container:hover .product-image-front {
          opacity: 0;
        }

        /* Agrandissement spécifique pour le t-shirt (id: 1) */
        .product-item[data-product-id="1"] .product-image-front,
        .product-item[data-product-id="1"] .product-image-back {
          transform: scale(1.6);
        }

        /* Fond gris clair avec hover rouge - Tailles responsive via variables CSS */
        /* Les variables sont appliquées automatiquement via les media queries dans globals.css */
        .product-item {
          position: relative;
          overflow: visible;
          isolation: isolate;
          border-radius: 0;
          padding: var(--shop-item-padding);
          background: #e5e5e5;
          width: 100%;
          transition: background-color 0.3s ease, grid-column 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #4a4a4a;
          cursor: pointer;
        }

        .product-item:hover:not(.selected),
        .product-item.hovered:not(.selected) {
          background: #FF1744;
        }

        /* Item sélectionné - expansion sur toute la page et centré */
        .product-item.selected {
          grid-column: 1 / -1;
          background: #FF1744;
          z-index: 1;
          margin: 0 auto;
          max-width: 100%;
          width: 100%;
          height: 100%;
          overflow: visible;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Wrapper pour gérer le déplacement des items non sélectionnés */
        .product-item-wrapper {
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Wrapper d'expansion - niveau intermédiaire pour l'expansion de largeur */
        .product-item-expand {
          width: 100%;
          display: flex;
          justify-content: center;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Expansion sur toute la page pour l'item sélectionné - TOUTES LES TAILLES D'ÉCRAN */
        .product-item-wrapper:has(.product-item.selected) {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 40 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .product-item-wrapper:has(.product-item.selected) .product-item-expand {
          width: 100vw !important;
          height: 100vh !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        /* Item sélectionné - fond fullscreen sur toutes les tailles */
        .product-item.selected {
          width: 100vw !important;
          height: 100vh !important;
          min-height: 100vh !important;
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Core interne - contenu responsive via variables CSS */
        /* Les variables sont appliquées automatiquement via les media queries dans globals.css */
        .product-item-core {
          width: var(--shop-item-core-width);
          max-width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          gap: var(--shop-item-gap);
          /* Aucune transition de transform ou width */
        }

        /* Masquer les items non sélectionnés quand un item est sélectionné */
        body:has(.product-item.selected) .product-item-wrapper:not(:has(.product-item.selected)) {
          opacity: 0;
          pointer-events: none;
        }

        /* Typo noire par défaut, blanche au hover et sélectionné */
        .product-item h3,
        .product-item span {
          color: #000000;
          transition: color 0.3s ease;
        }

        .product-item:hover:not(.selected) h3,
        .product-item:hover:not(.selected) span,
        .product-item.hovered:not(.selected) h3,
        .product-item.hovered:not(.selected) span,
        .product-item.selected h3,
        .product-item.selected span {
          color: #FFFFFF;
        }

        /* Texte défilant - visible uniquement après expansion */
        .product-item.selected .product-scrolling-text {
          opacity: 1;
          transition: opacity 0.3s ease 0.6s;
        }

        .product-item:hover:not(.selected) .product-scrolling-text,
        .product-item.hovered:not(.selected) .product-scrolling-text {
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        /* Wrapper pour isoler le badge du contexte d'isolation */
        .product-item-wrapper {
          position: relative;
        }

        /* Animation texte défilant au hover - boucle infinie sans interruption */
        @keyframes scroll-text {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .product-scrolling-text {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          z-index: 0;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .product-item:hover .product-scrolling-text,
        .product-item.hovered .product-scrolling-text {
          opacity: 1;
        }

        .product-scrolling-text-wrapper {
          display: inline-flex;
          gap: 4rem;
          white-space: nowrap;
          animation: scroll-text linear infinite;
          will-change: transform;
        }

        .product-scrolling-text-wrapper span {
          font-family: var(--font-title);
          font-size: 8rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.15);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          flex-shrink: 0;
        }

        /* ========================================
           LOGIQUE DE SCROLL CENTRALISÉE
           ======================================== */
        /* Toutes les règles de scroll sont ici, aucune logique inline */
        
        /* Desktop: scroll vertical, grille 3 colonnes */
        @media (min-width: 1024px) {
          body:has(#shop-root) .product-column {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            grid-auto-rows: minmax(auto, 1fr) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            height: 100vh !important;
            max-height: 100vh !important;
            position: relative !important;
            padding-top: 116px !important; /* Header desktop */
            padding-bottom: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            /* Optimisations scroll */
            will-change: scroll-position !important;
            overscroll-behavior-y: contain !important;
            overscroll-behavior-x: none !important;
            /* Scrollbar masquée */
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          
          body:has(#shop-root) .product-column::-webkit-scrollbar {
            display: none !important;
          }

          /* Desktop: items adaptés à la hauteur disponible */
          body:has(#shop-root) .product-item {
            min-height: calc((100vh - 116px) / 2) !important;
            height: auto !important;
            max-height: none !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          /* Desktop: item sélectionné en fullscreen */
          body:has(#shop-root) .product-item-wrapper:has(.product-item.selected) {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 50 !important;
          }

          body:has(#shop-root) .product-item.selected {
            width: 100vw !important;
            height: 100vh !important;
            min-height: 100vh !important;
          }
        }

        /* Tablette (640px - 1023px): scroll vertical avec items adaptés */
        @media (min-width: 640px) and (max-width: 1023px) {
          body:has(#shop-root) .product-column {
            display: flex !important;
            flex-direction: column !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            scroll-snap-type: y mandatory !important;
            -webkit-overflow-scrolling: touch !important;
            align-items: stretch !important;
            padding-top: 80px !important; /* Header mobile */
            padding-bottom: var(--footer-total-height-mobile) !important; /* Footer mobile */
            padding-left: 0 !important;
            padding-right: 0 !important;
            height: 100vh !important;
            max-height: 100vh !important;
            width: 100% !important;
            max-width: 100% !important;
            position: relative !important;
            /* Optimisations scroll */
            will-change: scroll-position !important;
            overscroll-behavior-y: contain !important;
            overscroll-behavior-x: none !important;
            /* Scrollbar masquée */
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          
          body:has(#shop-root) .product-column::-webkit-scrollbar {
            display: none !important;
          }

          body:has(#shop-root) .product-item-wrapper {
            flex: 0 0 auto !important;
            flex-shrink: 0 !important;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            scroll-snap-align: start !important;
            scroll-snap-stop: always !important;
            box-sizing: border-box !important;
          }

          body:has(#shop-root) .product-item {
            min-height: calc(100vh - 80px - var(--footer-total-height-mobile)) !important;
            height: calc(100vh - 80px - var(--footer-total-height-mobile)) !important;
            max-height: calc(100vh - 80px - var(--footer-total-height-mobile)) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            max-width: 100vw !important;
            box-sizing: border-box !important;
          }

          /* Tablette: item sélectionné en fullscreen */
          body:has(#shop-root) .product-item-wrapper:has(.product-item.selected) {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 50 !important;
          }

          body:has(#shop-root) .product-item.selected {
            width: 100vw !important;
            height: 100vh !important;
            min-height: 100vh !important;
          }
        }

        /* Mobile (< 640px): scroll vertical */
        @media (max-width: 639px) {
          body:has(#shop-root) .product-column {
            display: flex !important;
            flex-direction: column !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            scroll-snap-type: y mandatory !important;
            -webkit-overflow-scrolling: touch !important;
            align-items: stretch !important;
            padding-top: 80px !important; /* Header mobile */
            /* Padding bottom = footer + espacement supplémentaire pour permettre au dernier item de se snapper jusqu'en haut */
            /* L'espacement supplémentaire = hauteur d'un item (100vh - header - footer) pour permettre le scroll complet */
            padding-bottom: calc(var(--footer-total-height-mobile) + (100vh - 80px - var(--footer-total-height-mobile))) !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            height: 100vh !important;
            max-height: 100vh !important;
            width: 100% !important;
            max-width: 100% !important;
            position: relative !important;
            /* Optimisations scroll */
            will-change: scroll-position !important;
            overscroll-behavior-y: contain !important;
            overscroll-behavior-x: none !important;
            /* Scrollbar masquée */
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          
          body:has(#shop-root) .product-column::-webkit-scrollbar {
            display: none !important;
          }

          body:has(#shop-root) .product-item-wrapper {
            flex: 0 0 auto !important;
            flex-shrink: 0 !important;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            scroll-snap-align: start !important;
            scroll-snap-stop: always !important;
            box-sizing: border-box !important;
          }

          body:has(#shop-root) .product-item {
            min-height: calc(100vh - 80px - var(--footer-total-height-mobile)) !important;
            height: calc(100vh - 80px - var(--footer-total-height-mobile)) !important;
            max-height: calc(100vh - 80px - var(--footer-total-height-mobile)) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            max-width: 100vw !important;
            box-sizing: border-box !important;
          }

          /* Item sélectionné sur mobile : fond en fullscreen */
          body:has(#shop-root) .product-item-wrapper:has(.product-item.selected) {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            z-index: 50 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body:has(#shop-root) .product-item-wrapper:has(.product-item.selected) .product-item-expand {
            width: 100% !important;
            height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          body:has(#shop-root) .product-item.selected {
            width: 100% !important;
            height: 100vh !important;
            min-height: 100vh !important;
            position: relative !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }

      `}</style>
      <div id="shop-root" ref={shopRootRef}>
      <main 
        className="w-full" 
              style={{ 
          backgroundColor: '#d4d4d4',
          minHeight: '100vh',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 'var(--z-background)', // -1, derrière le contenu mais devant rien
          overflow: 'hidden' // Le scroll est géré par .product-column, pas par main
        }}
      >
        <div className="flex h-full" style={{ position: 'relative', zIndex: 'var(--z-content)', overflow: 'visible' }}>
          {/* Section produits - grille 3 colonnes desktop, scroll horizontal mobile */}
          <div 
            ref={productColumnRef}
            className="w-full product-column" 
            id="product-column"
            // Tous les styles sont gérés par CSS via media queries
            // Aucun style inline pour éviter les conflits
          >
            {products.map((product, index) => {
              const isSelected = selectedProductId === product.id;
              const selectedIndex = selectedProductId ? products.findIndex(p => p.id === selectedProductId) : -1;
              let translateX = 0;
              
              if (selectedIndex !== -1) {
                if (isSelected) {
                  // Item sélectionné : pas de translation, il sera en position fixed et centré par CSS
                  translateX = 0;
                } else {
                  // Items non sélectionnés : poussés hors de l'écran
                  if (index < selectedIndex) {
                    // Items à gauche : poussés complètement hors de l'écran à gauche
                    translateX = -100;
                  } else if (index > selectedIndex) {
                    // Items à droite : poussés complètement hors de l'écran à droite
                    translateX = 100;
                  }
                }
              }
              
              return (
              <div 
                key={product.id} 
                className="product-item-wrapper"
                style={{
                  transform: translateX !== 0 ? `translateX(${translateX}vw)` : 'none',
                  opacity: selectedIndex !== -1 && !isSelected ? 0 : (isMenuOpen ? 0 : 1),
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: isMenuOpen ? 'none' : 'auto'
                }}
              >
                <div className="product-item-expand">
                  <div 
                    className={`product-item ${isSelected ? 'selected' : ''} ${hoveredProductId === product.id ? 'hovered' : ''}`}
                    data-product-id={product.id}
                    onClick={() => setSelectedProductId(isSelected ? null : product.id)}
                    onMouseEnter={() => {
                      if (!isMobile) setHoveredProductId(product.id);
                    }}
                    onMouseLeave={() => {
                      if (!isMobile) setHoveredProductId(null);
                    }}
                    style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <div className="product-item-core">
                      {/* Texte défilant au hover */}
                      <div className={`transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <ScrollingText words={getRandomWordsForProduct(product.id)} productId={product.id} />
                  </div>

                      {/* Image */}
                      <div className="relative product-image-wrapper" style={{ width: '100%', height: 'var(--shop-item-image-height)', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                  {product.imageHover ? (
                          <div className={`product-image-container h-full w-full transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ maxWidth: '100%', maxHeight: '100%' }}>
                      <div 
                              className="product-image-front h-full w-full"
                        style={{ backgroundImage: `url(${product.image})` }}
                      />
                      <div 
                              className="product-image-back h-full w-full"
                        style={{ backgroundImage: `url(${product.imageHover})` }}
                      />
                    </div>
                  ) : (
                    <div 
                            className={`h-full w-full bg-contain bg-center bg-no-repeat transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                            style={{ backgroundImage: `url(${product.image})`, transform: 'scale(1.3)' }}
                    />
                  )}
                      </div>

                      {/* Nom et prix centrés sous l'image */}
                      <div className={`product-text-wrapper relative z-10 flex flex-col items-center justify-center transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ flexShrink: 0, width: '100%', gap: 'var(--shop-item-gap)', paddingTop: 'var(--shop-item-gap)', paddingBottom: 'calc(var(--shop-item-gap) / 2)' }}>
                        <h3 className="font-title uppercase text-center" style={{ fontSize: 'var(--shop-item-text-size-title)' }}>{product.title}</h3>
                        <span className="font-title" style={{ fontSize: 'var(--shop-item-text-size-price)' }}>{product.price}</span>
                      </div>

                      {/* Bouton d'action - visible uniquement quand l'item est sélectionné */}
                      {isSelected && (
                        <div className={`product-buttons-wrapper relative z-10 flex items-center justify-center transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ flexShrink: 0, width: '100%', paddingTop: 'var(--shop-item-gap)' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Implémenter l'action "Ajouter au panier"
                              console.log('Ajouter au panier:', product.id);
                            }}
                            className="product-add-to-cart-button font-title uppercase rounded-full transition-all duration-200 hover:opacity-90 whitespace-nowrap"
                            style={{
                              backgroundColor: '#000000',
                              color: '#FFFFFF',
                              border: 'none',
                              cursor: 'pointer',
                              paddingLeft: 'var(--shop-item-button-padding-x)',
                              paddingRight: 'var(--shop-item-button-padding-x)',
                              paddingTop: 'var(--shop-item-button-padding-y)',
                              paddingBottom: 'var(--shop-item-button-padding-y)',
                              fontSize: 'var(--shop-item-button-text-size)'
                            }}
                          >
                            Ajouter au panier
                    </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
    </main>
      </div>
    </>
  );
}



