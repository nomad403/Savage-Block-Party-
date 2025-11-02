"use client";

import { useRef, useLayoutEffect } from "react";
import { useMenu } from "@/hooks/useMenu";

export default function ShopPage() {
  const videoRef = useRef<HTMLIFrameElement>(null);
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
      `}</style>
      <div id="shop-root" ref={shopRootRef}>
      <main className="h-screen w-full overflow-hidden">
        <div className="flex h-full">
          {/* Section vidéo YouTube - 2/3 à gauche */}
          <div className="w-2/3 h-full relative overflow-hidden">
            <iframe
              ref={videoRef}
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/7FMyAz38qdg?start=10&end=20&autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&frameborder=0&playlist=7FMyAz38qdg"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen={true}
              style={{ 
                border: 'none',
                transform: 'scale(1.4)',
                transformOrigin: 'center',
              }}
            />
          </div>

          {/* Section produits - 1/3 à droite */}
          <div 
            ref={productColumnRef}
            className="w-1/3 bg-black product-column" 
            id="product-column"
            style={{ 
              overflowY: 'auto',
              height: '100vh',
              paddingBottom: '180px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {products.map((product, index) => (
              <div key={product.id} className={`relative ${index < products.length - 1 ? 'border-b-2' : ''}`} style={{ height: 'calc(100vh - 140px - 200px)', borderColor: '#000000', backgroundColor: '#EF4444' }}>
                {/* Prix en haut à droite */}
                <div className={`absolute top-6 right-6 z-10 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  <span className="font-title text-black text-2xl">{product.price}</span>
                </div>

                {/* Titre en haut à gauche */}
                <div className={`absolute top-6 left-6 z-10 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  <h3 className="font-title text-black text-2xl uppercase">{product.title}</h3>
                </div>

                {/* Photo fullscreen */}
                {product.imageHover ? (
                  <div className={`product-image-container transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div 
                      className="product-image-front"
                      style={{ backgroundImage: `url(${product.image})` }}
                    />
                    <div 
                      className="product-image-back"
                      style={{ backgroundImage: `url(${product.imageHover})` }}
                    />
                  </div>
                ) : (
                  <div 
                    className={`h-full w-full bg-cover bg-center bg-no-repeat transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    style={{ backgroundImage: `url(${product.image})` }}
                  />
                )}

                {/* Bouton plus pour achat en bas à droite */}
                <div className={`absolute bottom-16 right-8 z-10 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  <button className="w-16 h-16 rounded-full flex items-center justify-center transition-colors">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </button>
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


