"use client";

import { useRef, useLayoutEffect, useMemo, useState, useEffect, useCallback } from "react";
import { useMenu } from "@/hooks/useMenu";

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
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

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
    const event = new CustomEvent('shopItemSelected', { 
      detail: { 
        isSelected: selectedProductId !== null
      } 
    });
    window.dispatchEvent(event);
  }, [selectedProductId]);

  // Forcer les styles CSS pour le header quand un item est sélectionné (exception page shop)
  // Cette fonction est appelée à chaque changement d'état pour maintenir les couleurs
  const forceShopHeaderColors = useCallback(() => {
    if (selectedProductId !== null) {
      // Forcer les boutons menu en noir (même après hover/unfocus)
      const menuButtons = document.querySelectorAll('header button span');
      menuButtons.forEach((span) => {
        (span as HTMLElement).style.setProperty('background-color', '#000000', 'important');
      });

      // Forcer les textes du player en blanc
      const playerTexts = document.querySelectorAll('.header-player .font-title, .header-player .font-text');
      playerTexts.forEach((el) => {
        (el as HTMLElement).style.setProperty('color', '#FFFFFF', 'important');
      });

      // Forcer les icônes SVG du player en blanc (sauf l'icône panier)
      const playerSvgs = document.querySelectorAll('.header-player svg');
      playerSvgs.forEach((svg) => {
        // Exclure l'icône panier qui doit garder sa couleur primaire
        const isShopIcon = svg.closest('a[href="/shop"]');
        if (!isShopIcon) {
          (svg as HTMLElement).style.setProperty('color', '#FFFFFF', 'important');
          (svg as HTMLElement).style.setProperty('fill', '#FFFFFF', 'important');
        }
      });

      // Forcer les liens du menu desktop en noir
      const menuLinks = document.querySelectorAll('header nav a');
      menuLinks.forEach((link) => {
        (link as HTMLElement).style.setProperty('color', '#000000', 'important');
      });
    } else {
      // Restaurer les styles par défaut quand aucun item n'est sélectionné
      const menuButtons = document.querySelectorAll('header button span');
      menuButtons.forEach((span) => {
        (span as HTMLElement).style.removeProperty('background-color');
      });

      const playerTexts = document.querySelectorAll('.header-player .font-title, .header-player .font-text');
      playerTexts.forEach((el) => {
        (el as HTMLElement).style.removeProperty('color');
      });

      const playerSvgs = document.querySelectorAll('.header-player svg');
      playerSvgs.forEach((svg) => {
        // Exclure l'icône panier qui doit garder sa couleur primaire
        const isShopIcon = svg.closest('a[href="/shop"]');
        if (!isShopIcon) {
          (svg as HTMLElement).style.removeProperty('color');
          (svg as HTMLElement).style.removeProperty('fill');
        }
      });

      const menuLinks = document.querySelectorAll('header nav a');
      menuLinks.forEach((link) => {
        (link as HTMLElement).style.removeProperty('color');
      });
    }
  }, [selectedProductId]);

  // Appliquer les couleurs quand un item est sélectionné
  useEffect(() => {
    forceShopHeaderColors();
  }, [forceShopHeaderColors]);

  // Écouter les événements de hover du menu pour maintenir les couleurs noires
  // même après hover/unfocus si un item est sélectionné
  useEffect(() => {
    const handleMenuItemHover = () => {
      // Si un item est sélectionné, forcer les couleurs noires après un court délai
      // pour surcharger la logique globale qui restaure les couleurs
      if (selectedProductId !== null) {
        setTimeout(() => {
          forceShopHeaderColors();
        }, 50);
      }
    };

    window.addEventListener('menuItemHover', handleMenuItemHover as EventListener);
    return () => {
      window.removeEventListener('menuItemHover', handleMenuItemHover as EventListener);
    };
  }, [selectedProductId, forceShopHeaderColors]);

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
        
        /* Menu hamburger en noir par défaut sur la page shop */
        body:has(#shop-root) header button span {
          background-color: #000000 !important;
        }

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

        /* Forcer le fond du player en noir quand un item est sélectionné */
        body:has(.product-item.selected) .header-player {
          background-color: #000000 !important;
        }

        /* Forcer les textes du player en blanc quand un item est sélectionné */
        body:has(.product-item.selected) .header-player .font-title,
        body:has(.product-item.selected) .header-player .font-text {
          color: #FFFFFF !important;
        }

        /* Forcer les divs avec style inline color dans le player */
        body:has(.product-item.selected) .header-player div[style*="color"] {
          color: #FFFFFF !important;
        }

        /* Forcer les icônes SVG du player en blanc quand un item est sélectionné (sauf l'icône panier) */
        body:has(.product-item.selected) .header-player svg:not(a[href="/shop"] svg) {
          color: #FFFFFF !important;
          fill: #FFFFFF !important;
        }

        /* L'icône panier garde sa couleur primaire même quand un item est sélectionné */
        body:has(.product-item.selected) .header-player a[href="/shop"] {
          color: #FF1744 !important;
        }

        body:has(.product-item.selected) .header-player a[href="/shop"] svg {
          fill: #FF1744 !important;
        }

        /* Forcer les boutons du player en blanc */
        body:has(.product-item.selected) .header-player button {
          color: #FFFFFF !important;
        }

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

        /* Fond gris clair avec hover rouge */
        .product-item {
          position: relative;
          overflow: visible;
          isolation: isolate;
          border-radius: 0;
          padding: 21px;
          background: #e5e5e5;
          width: 100%;
          transition: background-color 0.3s ease, grid-column 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #4a4a4a;
          cursor: pointer;
        }

        .product-item:hover:not(.selected) {
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

        /* Expansion sur toute la page pour l'item sélectionné */
        .product-item-wrapper:has(.product-item.selected) {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-item-wrapper:has(.product-item.selected) .product-item-expand {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Core interne - contenu fixe, non déformé */
        .product-item-core {
          width: 420px;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
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
        .product-item.selected h3,
        .product-item.selected span {
          color: #FFFFFF;
        }

        /* Texte défilant - visible uniquement après expansion */
        .product-item.selected .product-scrolling-text {
          opacity: 1;
          transition: opacity 0.3s ease 0.6s;
        }

        .product-item:hover:not(.selected) .product-scrolling-text {
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

        .product-item:hover .product-scrolling-text {
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

      `}</style>
      <div id="shop-root" ref={shopRootRef}>
      <main className="h-screen w-full overflow-hidden" style={{ backgroundColor: '#d4d4d4' }}>
        <div className="flex h-full">
          {/* Section produits - grille 3 colonnes */}
          <div 
            ref={productColumnRef}
            className="w-full product-column" 
            id="product-column"
            style={{ 
              overflowY: 'auto',
              height: '100vh',
              paddingBottom: '0',
              paddingLeft: '0',
              paddingRight: '0',
              paddingTop: '116px', 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridAutoRows: 'min-content',
              gap: '0',
              borderCollapse: 'collapse',
              alignContent: 'start',
              alignItems: 'start',
            }}
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
                  opacity: selectedIndex !== -1 && !isSelected ? 0 : 1,
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="product-item-expand">
                  <div 
                    className={`product-item ${isSelected ? 'selected' : ''}`}
                    data-product-id={product.id}
                    onClick={() => setSelectedProductId(isSelected ? null : product.id)}
                    style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <div className="product-item-core">
                      {/* Texte défilant au hover */}
                      <ScrollingText words={getRandomWordsForProduct(product.id)} productId={product.id} />

                      {/* Image */}
                      <div className="relative product-image-wrapper" style={{ width: '100%', height: '420px', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
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
                      <div className={`product-text-wrapper relative z-10 flex flex-col items-center justify-center gap-2 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ flexShrink: 0, width: '100%', paddingTop: '16px', paddingBottom: '8px' }}>
                        <h3 className="font-title text-lg md:text-xl uppercase text-center">{product.title}</h3>
                        <span className="font-title text-lg md:text-xl">{product.price}</span>
                      </div>

                      {/* Bouton d'action - visible uniquement quand l'item est sélectionné */}
                      {isSelected && (
                        <div className={`product-buttons-wrapper relative z-10 flex items-center justify-center transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ flexShrink: 0, width: '100%', paddingTop: '24px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Implémenter l'action "Ajouter au panier"
                              console.log('Ajouter au panier:', product.id);
                            }}
                            className="product-add-to-cart-button font-title text-sm md:text-base uppercase px-8 py-3 rounded-full transition-all duration-200 hover:opacity-90 whitespace-nowrap"
                            style={{
                              backgroundColor: '#000000',
                              color: '#FFFFFF',
                              border: 'none',
                              cursor: 'pointer'
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



