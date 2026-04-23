"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useMenu } from "@/hooks/useMenu";
import { useMenuHover } from "@/hooks/useMenuHover";
import { useDropdown } from "@/hooks/useDropdown";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { TextRevealLines } from "@/components/ui";
import { familyEvents } from "@/lib/events/app-events";

// Détecter iOS pour appliquer des corrections spécifiques
const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

// Padding horizontal du bouton dropdown - ajusté pour respiration du texte
const DROPDOWN_PADDING_X = 16; // 16px pour une meilleure respiration, proportionnel au header

// Composant pour les items avec animation hover
function ItemWithHover({ item, index, onSelect, startInset }: { item: string; index: number; onSelect: () => void; startInset: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      className="cursor-pointer relative inline-block text-left"
      style={{ 
        margin: 0,
        padding: 0,
        border: 'none',
        background: 'transparent',
        overflow: 'visible',
        flexShrink: 0,
      }}
    >
      <TextRevealLines
        text={item.toUpperCase()}
        color={isHovered ? "#FFFFFF" : "#22C55E"}
        typography="cy"
        className={`font-text font-semibold tracking-tight text-2xl whitespace-nowrap transition-colors duration-300 ${isHovered ? '!text-[#22C55E]' : '!text-black'}`}
        delayStep={0.1}
        density="tight"
        horizontalPadding={12}
        startInset={startInset}
        endInset={1}
        itemIndex={index}
        itemDelay={0.05}
      />
    </button>
  );
}

interface FamilyDropdownsProps {
  onItemSelect: (item: string) => void;
  selectedItem: string | null;
  isVisible?: boolean; // Visibilité des dropdowns (masqués par scroll)
  onDropdownStateChange?: (isOpen: boolean) => void; // Callback pour notifier l'état d'ouverture
}

export default function FamilyDropdowns({ onItemSelect, selectedItem, isVisible = true, onDropdownStateChange }: FamilyDropdownsProps) {
  // Logique d'ouverture/fermeture extraite dans hook
  const { activeDropdown, toggleDropdown, closeDropdown, dropdownRefs } = useDropdown();
  const { isMenuOpen } = useMenu();
  const { isMenuHovered } = useMenuHover();
  const isMobile = useIsMobile(); // Détection mobile pour logique dédiée
  const [isScrollingList, setIsScrollingList] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const listElementRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const buttonsContainerRef = useRef<HTMLDivElement | null>(null); // Référence pour le conteneur des boutons (mobile)
  const [mounted, setMounted] = useState(false); // Pour le portal
  
  // Helper pour créer les handlers de touch optimisés pour iOS
  const createTouchHandlers = (dropdownKey: string) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.stopPropagation();
      // Sur iOS, enregistrer la position Y du touch pour détecter le scroll
      if (isIOS && e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
      }
      setIsScrollingList(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.stopPropagation();
      touchStartYRef.current = null;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Sur iOS, délai plus long pour être sûr que le scroll est terminé
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrollingList(false);
      }, isIOS ? 500 : 300);
    },
    onTouchMove: (e: React.TouchEvent) => {
      e.stopPropagation();
      setIsScrollingList(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Sur iOS, empêcher le scroll de la page si on détecte un mouvement dans la liste
      if (isIOS && touchStartYRef.current !== null && e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        const deltaY = Math.abs(currentY - touchStartYRef.current);
        // Si le mouvement est significatif (scroll dans la liste), empêcher le scroll de la page
        if (deltaY > 5) {
          const list = listElementRefs.current[dropdownKey];
          if (list) {
            // Vérifier si la liste peut scroller
            const canScroll = list.scrollHeight > list.clientHeight;
            if (canScroll) {
              // Empêcher le scroll de la page seulement si on scroll dans la liste
              e.preventDefault();
            }
          }
        }
      }
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.stopPropagation();
      touchStartYRef.current = null;
      setIsScrollingList(false);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    },
    onScroll: (e: React.UIEvent) => {
      e.stopPropagation();
      setIsScrollingList(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Sur iOS, délai plus long
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrollingList(false);
      }, isIOS ? 500 : 300);
    },
    onWheel: (e: React.WheelEvent) => {
      // Empêcher le scroll de la page quand on scroll dans la liste (desktop)
      e.stopPropagation();
    }
  });

  // Notifier le parent quand l'état d'ouverture change
  useEffect(() => {
    onDropdownStateChange?.(!!activeDropdown);
    // Émettre un événement pour masquer le player sur mobile
    familyEvents.dropdownOpen(!!activeDropdown);
  }, [activeDropdown, onDropdownStateChange]);

  // Fermer les listes ouvertes quand les dropdowns sont masqués par le scroll
  // Mais ne pas fermer si l'utilisateur est en train de scroller dans la liste
  // Protection renforcée : délai et vérification multiple
  useEffect(() => {
    // Ne jamais fermer si on est en train de scroller dans la liste
    if (isScrollingList) {
      return;
    }
    
    // Ne fermer que si les dropdowns sont masqués ET qu'un dropdown est ouvert
    // Avec un délai pour éviter les fermetures intempestives
    if (!isVisible && activeDropdown) {
      const timeoutId = setTimeout(() => {
        // Vérifier à nouveau que l'état n'a pas changé
        if (!isScrollingList && activeDropdown) {
      closeDropdown();
    }
      }, 500); // Délai plus long pour être sûr
      
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, activeDropdown, closeDropdown, isScrollingList]);

  // Cleanup du timeout au démontage
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Pour le portal sur mobile
  useEffect(() => {
    setMounted(true);
  }, []);

  // État pour la hauteur des boutons (mobile)
  const [buttonsHeight, setButtonsHeight] = useState(0);
  
  // Mettre à jour la hauteur des boutons pour le positionnement du dropdown mobile
  useEffect(() => {
    if (isMobile && buttonsContainerRef.current) {
      const updateHeight = () => {
        setButtonsHeight(buttonsContainerRef.current?.offsetHeight || 0);
      };
      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, [isMobile]);

  // Z-index géré par CSS via .family-dropdowns-container
  // Base: var(--z-dropdowns) = 10003
  // Ouvert: var(--z-dropdowns-open) = 10004
  const finalZIndex = activeDropdown ? 10004 : 10003; // Gardé pour compatibilité

  const selectItem = (item: string) => {
    onItemSelect(item);
    closeDropdown(); // Fermer le dropdown après sélection
  };

  const djs = [
    "Woodneymo",
    "Niel",
    "Rita Amoureux",
    "Sungoma",
    "Le Sympathique",
    "Hax",
    "Deezee",
    "Mabrada",
    "Bengala",
    "Emkay",
    "Kythmos",
    "Boutcha bwa"
  ];

  const danseurs = [
    "Lexou",
    "Vins Crespo",
    "Hamilton",
    "H4",
    "Elisa Poelmans",
    "Daniela Barbieiri",
    "Dikilla",
    "Wizlex",
    "Deyvron",
    "Deezee",
    "Malewa",
    "Flipside",
    "Larysha"
  ];

  const artistes = [
    "Le Juiice",
    "Shinobihana",
    "Scratchy",
    "Aeacus",
    "Furlax",
    "26 keuss",
    "Dor",
    "Bryte",
    "T9",
    "Anta Diop"
  ];

  // Fonction helper pour rendre le contenu d'un dropdown
  const renderDropdownContent = (items: string[], dropdownKey: string) => (
    <div className={`w-full flex ${isMobile ? 'flex-col' : 'flex-col-reverse'}`} style={{ gap: 0, alignItems: 'flex-start' }}>
      {items.map((item, index) => (
        <ItemWithHover
          key={item}
          item={item}
          index={index}
          onSelect={() => selectItem(item)}
          startInset={DROPDOWN_PADDING_X - 12}
        />
      ))}
    </div>
  );

  // Rendre le dropdown overlay mobile (séparé des boutons)
  const renderMobileDropdownOverlay = () => {
    if (!isMobile || !activeDropdown || !mounted) return null;

    const items = activeDropdown === 'djs' ? djs : activeDropdown === 'danseurs' ? danseurs : activeDropdown === 'artistes' ? artistes : [];

    return createPortal(
      <AnimatePresence>
        {activeDropdown && (
          <motion.div
            ref={(el) => { listElementRefs.current[activeDropdown] = el as HTMLDivElement; }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed left-0 right-0 bg-transparent"
            style={{ 
              bottom: `${buttonsHeight}px`, // Au-dessus des boutons
              width: '100%',
              zIndex: 10005,
              maxHeight: '80vh',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              overscrollBehavior: 'contain'
            }}
            {...createTouchHandlers(activeDropdown)}
          >
            {renderDropdownContent(items, activeDropdown)}
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <>
    <div 
        ref={buttonsContainerRef}
        className={`w-full flex flex-row family-dropdowns-container transition-opacity duration-300 ${isMenuHovered ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
      style={{ zIndex: finalZIndex }} // Gardé pour compatibilité avec autres pages
    >
      {/* Dropdown DJs */}
      {isMobile ? (
        // Sur mobile : bouton simple sans motion.div (hauteur fixe garantie)
        <div className="relative flex flex-1" ref={(el) => { dropdownRefs.current['djs'] = el; }}>
          <button
            onClick={() => toggleDropdown('djs')}
            className={`w-full font-title uppercase text-xs lg:text-sm tracking-wide py-2 md:py-3 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'} ${
              activeDropdown === 'djs' 
                ? 'bg-white text-green-500' 
                : 'bg-green-500 text-black hover:bg-green-600'
            }`}
            style={{ paddingLeft: `${DROPDOWN_PADDING_X}px`, paddingRight: `${DROPDOWN_PADDING_X}px` }}
          >
            DJs
          </button>
        </div>
      ) : (
        // Sur desktop : motion.div avec animations flex/width
      <motion.div 
          className={`relative flex flex-1`}
        ref={(el) => { dropdownRefs.current['djs'] = el; }}
        initial={false}
        animate={{
          flex: activeDropdown === 'djs' ? 1 : activeDropdown ? 0 : 1,
          width: activeDropdown === 'djs' ? '100%' : activeDropdown ? '0%' : undefined,
          opacity: activeDropdown === 'djs' ? 1 : activeDropdown ? 0 : 1,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{
          overflow: 'hidden',
        }}
        onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
          const currentTarget = e.currentTarget;
          if (!currentTarget) return;
          
          if (!currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => {
              if (activeDropdown === 'djs' && currentTarget && !currentTarget.contains(document.activeElement)) {
                closeDropdown();
              }
            }, 100);
          }
        }}
      >
        <button
          onClick={() => toggleDropdown('djs')}
            className={`w-full font-title uppercase text-xs lg:text-sm tracking-wide py-2 md:py-3 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'} ${
              activeDropdown === 'djs' 
                ? 'bg-white text-green-500' 
                : 'bg-green-500 text-black hover:bg-green-600'
            }`}
          style={{ paddingLeft: `${DROPDOWN_PADDING_X}px`, paddingRight: `${DROPDOWN_PADDING_X}px` }}
        >
          DJs
        </button>
        <AnimatePresence>
          {activeDropdown === 'djs' && (
            <motion.div
                ref={(el) => { listElementRefs.current['djs'] = el as HTMLDivElement; }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute bottom-full left-0 right-0 bg-transparent"
                    style={{ 
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  overscrollBehavior: 'contain'
                }}
                {...createTouchHandlers('djs')}
              >
                {renderDropdownContent(djs, 'djs')}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      )}
      
      {/* Dropdown Danseurs */}
      {isMobile ? (
        // Sur mobile : bouton simple sans motion.div (hauteur fixe garantie)
        <div className="relative flex flex-1" ref={(el) => { dropdownRefs.current['danseurs'] = el; }}>
          <button
            onClick={() => toggleDropdown('danseurs')}
            className={`w-full font-title uppercase text-xs lg:text-sm tracking-wide py-2 md:py-3 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'} ${
              activeDropdown === 'danseurs' 
                ? 'bg-white text-green-500' 
                : 'bg-green-500 text-black hover:bg-green-600'
            }`}
            style={{ paddingLeft: `${DROPDOWN_PADDING_X}px`, paddingRight: `${DROPDOWN_PADDING_X}px` }}
          >
            Danseurs
          </button>
        </div>
      ) : (
        // Sur desktop : motion.div avec animations flex/width
      <motion.div 
          className={`relative flex flex-1`}
        ref={(el) => { dropdownRefs.current['danseurs'] = el; }}
        initial={false}
        animate={{
          flex: activeDropdown === 'danseurs' ? 1 : activeDropdown ? 0 : 1,
          width: activeDropdown === 'danseurs' ? '100%' : activeDropdown ? '0%' : undefined,
          opacity: activeDropdown === 'danseurs' ? 1 : activeDropdown ? 0 : 1,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{
          overflow: 'hidden',
        }}
        onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
          const currentTarget = e.currentTarget;
          if (!currentTarget) return;
          
          if (!currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => {
              if (activeDropdown === 'danseurs' && currentTarget && !currentTarget.contains(document.activeElement)) {
                closeDropdown();
              }
            }, 100);
          }
        }}
      >
        <button
          onClick={() => toggleDropdown('danseurs')}
            className={`w-full font-title uppercase text-xs lg:text-sm tracking-wide py-2 md:py-3 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'} ${
              activeDropdown === 'danseurs' 
                ? 'bg-white text-green-500' 
                : 'bg-green-500 text-black hover:bg-green-600'
            }`}
          style={{ paddingLeft: `${DROPDOWN_PADDING_X}px`, paddingRight: `${DROPDOWN_PADDING_X}px` }}
        >
          Danseurs
        </button>
        <AnimatePresence>
          {activeDropdown === 'danseurs' && (
            <motion.div
                ref={(el) => { listElementRefs.current['danseurs'] = el as HTMLDivElement; }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute bottom-full left-0 right-0 bg-transparent"
                    style={{ 
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  overscrollBehavior: 'contain'
                }}
                {...createTouchHandlers('danseurs')}
              >
                {renderDropdownContent(danseurs, 'danseurs')}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      )}
      
      {/* Dropdown Artistes */}
      {isMobile ? (
        // Sur mobile : bouton simple sans motion.div (hauteur fixe garantie)
        <div className="relative flex flex-1" ref={(el) => { dropdownRefs.current['artistes'] = el; }}>
          <button
            onClick={() => toggleDropdown('artistes')}
            className={`w-full font-title uppercase text-xs lg:text-sm tracking-wide py-2 md:py-3 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'} ${
              activeDropdown === 'artistes' 
                ? 'bg-white text-green-500' 
                : 'bg-green-500 text-black hover:bg-green-600'
            }`}
            style={{ paddingLeft: `${DROPDOWN_PADDING_X}px`, paddingRight: `${DROPDOWN_PADDING_X}px` }}
          >
            Artistes
          </button>
        </div>
      ) : (
        // Sur desktop : motion.div avec animations flex/width
      <motion.div 
          className={`relative flex flex-1`}
        ref={(el) => { dropdownRefs.current['artistes'] = el; }}
        initial={false}
        animate={{
          flex: activeDropdown === 'artistes' ? 1 : activeDropdown ? 0 : 1,
          width: activeDropdown === 'artistes' ? '100%' : activeDropdown ? '0%' : undefined,
          opacity: activeDropdown === 'artistes' ? 1 : activeDropdown ? 0 : 1,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{
          overflow: 'hidden',
        }}
        onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
          const currentTarget = e.currentTarget;
          if (!currentTarget) return;
          
          if (!currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => {
              if (activeDropdown === 'artistes' && currentTarget && !currentTarget.contains(document.activeElement)) {
                closeDropdown();
              }
            }, 100);
          }
        }}
      >
        <button
          onClick={() => toggleDropdown('artistes')}
            className={`w-full font-title uppercase text-xs lg:text-sm tracking-wide py-2 md:py-3 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'} ${
              activeDropdown === 'artistes' 
                ? 'bg-white text-green-500' 
                : 'bg-green-500 text-black hover:bg-green-600'
            }`}
          style={{ paddingLeft: `${DROPDOWN_PADDING_X}px`, paddingRight: `${DROPDOWN_PADDING_X}px` }}
        >
          Artistes
        </button>
        <AnimatePresence>
          {activeDropdown === 'artistes' && (
            <motion.div
                ref={(el) => { listElementRefs.current['artistes'] = el as HTMLDivElement; }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute bottom-full left-0 right-0 bg-transparent"
                    style={{ 
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  overscrollBehavior: 'contain'
                }}
                {...createTouchHandlers('artistes')}
              >
                {renderDropdownContent(artistes, 'artistes')}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      )}
    </div>
      {/* Overlay mobile : dropdown rendu en portal (hors du flux des boutons) */}
      {renderMobileDropdownOverlay()}
    </>
  );
}
