"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMenu } from "@/hooks/useMenu";
import { useMenuHover } from "@/hooks/useMenuHover";
import { useDropdown } from "@/hooks/useDropdown";
import { TextRevealLines } from "@/components/ui";

// Détecter iOS pour appliquer des corrections spécifiques
const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

// Padding horizontal du bouton dropdown - ajusté pour respiration du texte
const DROPDOWN_PADDING_X = 16; // 16px pour une meilleure respiration, proportionnel au header

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
  const [isScrollingList, setIsScrollingList] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const listElementRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
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

  // Z-index géré par CSS via .family-dropdowns-container
  // Base: var(--z-dropdowns) = 10003
  // Ouvert: var(--z-dropdowns-open) = 10004
  const finalZIndex = activeDropdown ? 10004 : 10003; // Gardé pour compatibilité

  const selectItem = (item: string) => {
    onItemSelect(item);
    closeDropdown(); // Fermer le dropdown après sélection
  };

  const djs = [
    "Niel",
    "HAX", 
    "Le Sympathique",
    "Rita Amoureux",
    "Sungoma",
    "Bengala",
    "Darlean",
    "Woodneymo"
  ];

  const danseurs = [
    "Vins Crespo",
    "Rocket", 
    "Milliard",
    "Morgane",
    "Ambre"
  ];

  const collabs = [
    "Good Dirty Sound",
    "Grind Camp", 
    "Antrebloc",
    "Comuna 13",
    "La Chapiteau (Marseille)",
    "La Mûrisserie (Marseille)",
    "Virage",
    "Trabendo",
    "Check Club",
    "Dock B",
    "La Rotonde"
  ];

  return (
    <div 
      className={`w-full flex ${activeDropdown ? 'flex-col md:flex-row' : 'flex-row'} family-dropdowns-container transition-opacity duration-300 ${isMenuHovered ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
      style={{ zIndex: finalZIndex }} // Gardé pour compatibilité avec autres pages
    >
      {/* Dropdown DJs */}
      <motion.div 
        className={`relative ${activeDropdown && activeDropdown !== 'djs' ? 'hidden md:flex' : 'flex'} md:flex-1`}
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
          // Ne fermer que si le focus va vraiment en dehors (pas vers un enfant)
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
          className={`w-full text-black font-title uppercase text-xs lg:text-sm tracking-wide py-2 md:py-3 bg-green-500 hover:bg-green-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
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
              <div className="w-full flex flex-col-reverse" style={{ gap: 0, alignItems: 'flex-start' }}>
                {djs.map((dj, index) => (
                  <div 
                    key={dj}
                    onClick={() => selectItem(dj)}
                    className="cursor-pointer hover:opacity-80 transition-opacity relative"
                    style={{ 
                      margin: 0,
                      padding: 0,
                      overflow: 'visible',
                      flexShrink: 0,
                      width: '100%'
                    }}
                  >
                    <TextRevealLines
                      text={dj}
                      color="#22C55E"
                      className="font-text font-semibold tracking-tight leading-[1.1] text-4xl text-black whitespace-nowrap"
                      delayStep={0.1}
                      density="tight"
                      horizontalPadding={12}
                      startInset={DROPDOWN_PADDING_X - 12}
                      endInset={1}
                      itemIndex={index}
                      itemDelay={0.05}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Dropdown Danseurs */}
      <motion.div 
        className={`relative ${activeDropdown && activeDropdown !== 'danseurs' ? 'hidden md:flex' : 'flex'} md:flex-1`}
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
          className={`w-full text-black font-title uppercase text-xs lg:text-sm tracking-wide py-2 md:py-3 bg-green-500 hover:bg-green-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
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
              <div className="w-full flex flex-col-reverse" style={{ gap: 0, alignItems: 'flex-start' }}>
                {danseurs.map((danseur, index) => (
                  <div 
                    key={danseur}
                    onClick={() => selectItem(danseur)}
                    className="cursor-pointer hover:opacity-80 transition-opacity relative"
                    style={{ 
                      margin: 0,
                      padding: 0,
                      overflow: 'visible',
                      flexShrink: 0,
                      width: '100%'
                    }}
                  >
                    <TextRevealLines
                      text={danseur}
                      color="#22C55E"
                      className="font-text font-semibold tracking-tight leading-[1.1] text-4xl text-black whitespace-nowrap"
                      delayStep={0.1}
                      density="tight"
                      horizontalPadding={12}
                      startInset={DROPDOWN_PADDING_X - 12}
                      endInset={1}
                      itemIndex={index}
                      itemDelay={0.05}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Dropdown Collab */}
      <motion.div 
        className={`relative ${activeDropdown && activeDropdown !== 'collab' ? 'hidden md:flex' : 'flex'} md:flex-1`}
        ref={(el) => { dropdownRefs.current['collab'] = el; }}
        initial={false}
        animate={{
          flex: activeDropdown === 'collab' ? 1 : activeDropdown ? 0 : 1,
          width: activeDropdown === 'collab' ? '100%' : activeDropdown ? '0%' : undefined,
          opacity: activeDropdown === 'collab' ? 1 : activeDropdown ? 0 : 1,
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
              if (activeDropdown === 'collab' && currentTarget && !currentTarget.contains(document.activeElement)) {
                closeDropdown();
              }
            }, 100);
          }
        }}
      >
        <button
          onClick={() => toggleDropdown('collab')}
          className={`w-full text-black font-title uppercase text-xs lg:text-sm tracking-wide py-2 md:py-3 bg-green-500 hover:bg-green-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
          style={{ paddingLeft: `${DROPDOWN_PADDING_X}px`, paddingRight: `${DROPDOWN_PADDING_X}px` }}
        >
          Collab
        </button>
        <AnimatePresence>
          {activeDropdown === 'collab' && (
            <motion.div
              ref={(el) => { listElementRefs.current['collab'] = el as HTMLDivElement; }}
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
              {...createTouchHandlers('collab')}
            >
              <div className="w-full flex flex-col-reverse" style={{ gap: 0, alignItems: 'flex-start' }}>
                {collabs.map((collab, index) => (
                  <div 
                    key={collab}
                    onClick={() => selectItem(collab)}
                    className="cursor-pointer hover:opacity-80 transition-opacity relative"
                    style={{ 
                      margin: 0,
                      padding: 0,
                      overflow: 'visible',
                      flexShrink: 0,
                      width: '100%'
                    }}
                  >
                    <TextRevealLines
                      text={collab}
                      color="#22C55E"
                      className="font-text font-semibold tracking-tight leading-[1.1] text-4xl text-black whitespace-nowrap"
                      delayStep={0.1}
                      density="tight"
                      horizontalPadding={12}
                      startInset={DROPDOWN_PADDING_X - 12}
                      endInset={1}
                      itemIndex={index}
                      itemDelay={0.05}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
