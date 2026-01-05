"use client";

import { useRef, useLayoutEffect } from "react";
import { useMenu } from "@/hooks/useMenu";

export default function ShopPage() {
  const productColumnRef = useRef<HTMLDivElement>(null);
  const shopRootRef = useRef<HTMLDivElement>(null);
  const { isMenuOpen } = useMenu();

  // Utiliser useLayoutEffect pour garantir que le DOM est mis à jour avant le paint
  useLayoutEffect(() => {
    // S'assurer que les styles CSS sont appliqués dès que #shop-root existe
    // Pas besoin de forcer un reflow, le navigateur le fera automatiquement
    if (shopRootRef.current) {
      // Les styles CSS basés sur :has(#shop-root) seront automatiquement appliqués
      // On peut juste s'assurer que l'élément est bien présent
    }
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
      image: "/shop/product2.jpg"
    },
    {
      id: 3,
      title: "Cap Logo",
      price: "25€",
      image: "/shop/product3.jpg"
    }
  ];

  return (
    <>
      {/* Style pour rendre tous les éléments en rouge sauf le footer */}
      <style jsx global>{`
        /* Logo en noir */
        body:has(#shop-root) header .logo-tint-black {
          filter: brightness(0) saturate(100%) !important;
        }
        
        /* Menu hamburger en noir */
        body:has(#shop-root) header button span {
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
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transition: opacity 0.5s ease;
          z-index: 1;
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

        /* Animation fond rouge expanded au hover */
        .product-item {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          border-radius: 50%;
          padding: 24px;
          background: transparent;
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          aspect-ratio: 1 / 1;
          width: 100%;
          max-width: 100%;
          height: auto;
          contain: layout style paint;
        }

        .product-item:hover {
          transform: scale(1.02);
        }

        .product-item > div:first-child {
          position: relative;
          z-index: 1;
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .product-item:hover > div:first-child {
          transform: scale(0.98);
        }

        .product-item::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: #FF1744;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease;
          z-index: 1;
          pointer-events: none;
          opacity: 0;
          will-change: width, height;
        }

        .product-item:hover::before {
          width: 200%;
          height: 200%;
          border-radius: 50%;
          opacity: 1;
        }

        .product-item > div:last-child {
          position: relative;
          z-index: 2;
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .product-item:hover > div:last-child {
          transform: translateY(-4px);
        }

        /* Wrapper pour isoler le badge du contexte d'isolation */
        .product-item-wrapper {
          position: relative;
        }

      `}</style>
      <div id="shop-root" ref={shopRootRef}>
      <main className="h-screen w-full overflow-hidden" style={{ backgroundColor: '#1f1f1f' }}>
        <div className="flex h-full">
          {/* Section produits - grille 2 colonnes */}
          <div 
            ref={productColumnRef}
            className="w-full product-column" 
            id="product-column"
            style={{ 
              overflowY: 'auto',
              height: '100vh',
              paddingBottom: '20px',
              paddingLeft: '20px',
              paddingRight: '20px',
              paddingTop: '116px', // 96px (hauteur header) + 20px de marge
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gridAutoRows: 'min-content',
              gap: '40px',
              alignContent: 'start',
              alignItems: 'start'
            }}
          >
            {products.map((product, index) => (
              <div 
                key={product.id} 
                className="product-item-wrapper"
              >
                <div 
                  className="product-item"
                  style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                {/* Image */}
                <div className="relative" style={{ width: '100%', height: '380px', flexShrink: 0, borderRadius: '50%', overflow: 'hidden', zIndex: 1 }}>
                  {product.imageHover ? (
                    <div className={`product-image-container h-full w-full transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
                      className={`h-full w-full bg-cover bg-center bg-no-repeat transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                      style={{ backgroundImage: `url(${product.image})` }}
                    />
                  )}
                </div>

                {/* Nom et prix centrés sous l'image */}
                <div className={`relative z-10 flex flex-col items-center justify-center gap-2 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ flexShrink: 0, width: '100%', paddingTop: '16px', paddingBottom: '8px' }}>
                  <h3 className="font-title text-white text-lg md:text-xl uppercase text-center">{product.title}</h3>
                  <span className="font-title text-white text-lg md:text-xl">{product.price}</span>
                </div>
                </div>
              </div>
            ))}
          </div>
        </div>
    </main>
      </div>
    </>
  );
}


