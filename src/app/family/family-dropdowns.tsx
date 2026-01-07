"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMenu } from "@/hooks/useMenu";
import { useMenuHover } from "@/hooks/useMenuHover";
import TextRevealLines from "@/components/text-reveal-lines";

// Padding horizontal du bouton dropdown (doit correspondre au px-6 = 24px)
const DROPDOWN_PADDING_X = 2;

interface FamilyDropdownsProps {
  onItemSelect: (item: string) => void;
  selectedItem: string | null;
}

export default function FamilyDropdowns({ onItemSelect, selectedItem }: FamilyDropdownsProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { isMenuOpen } = useMenu();
  const { isMenuHovered } = useMenuHover();
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Sur la page family, les dropdowns ont toujours un z-index plus élevé que la waveform
  // La waveform a un z-index max de 10002, donc on met 10003 pour les dropdowns
  // Si un dropdown est ouvert, on augmente encore pour garantir la priorité
  // MAIS ils doivent être en dessous du header (z-[20000]) et des fonds des boutons menu
  // Le z-index est maintenant géré par CSS via la classe .family-dropdowns-container
  // On garde une valeur par défaut pour les autres pages
  const finalZIndex = activeDropdown ? 10004 : 10003;

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const selectItem = (item: string) => {
    onItemSelect(item);
    setActiveDropdown(null); // Fermer le dropdown après sélection
  };

  // Fermer le dropdown quand il perd le focus ou quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        const dropdownElement = dropdownRefs.current[activeDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setActiveDropdown(null);
        }
      }
    };

    if (activeDropdown) {
      // Petit délai pour éviter de fermer immédiatement après l'ouverture
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [activeDropdown]);

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
      className={`relative w-full flex flex-col md:flex-row family-dropdowns-container transition-opacity duration-300 ${isMenuHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ zIndex: finalZIndex }} // Gardé pour compatibilité avec autres pages
    >
      {/* Dropdown DJs */}
      <div 
        className="w-full md:w-1/3 relative"
        ref={(el) => { dropdownRefs.current['djs'] = el; }}
        onBlur={(e) => {
          // Ne fermer que si le focus va vraiment en dehors (pas vers un enfant)
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => {
              if (activeDropdown === 'djs' && !e.currentTarget.contains(document.activeElement)) {
                setActiveDropdown(null);
              }
            }, 100);
          }
        }}
      >
        <button
          onClick={() => toggleDropdown('djs')}
          className={`w-full text-black font-title uppercase text-base md:text-lg py-6 bg-green-500 hover:bg-green-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
          style={{ paddingLeft: `${DROPDOWN_PADDING_X}px`, paddingRight: `${DROPDOWN_PADDING_X}px` }}
        >
          DJs
        </button>
        <AnimatePresence>
          {activeDropdown === 'djs' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute bottom-full left-0 right-0 overflow-visible bg-transparent"
              style={{ maxHeight: '80vh' }}
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
      </div>
      
      {/* Dropdown Danseurs */}
      <div 
        className="w-full md:w-1/3 relative"
        ref={(el) => { dropdownRefs.current['danseurs'] = el; }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => {
              if (activeDropdown === 'danseurs' && !e.currentTarget.contains(document.activeElement)) {
                setActiveDropdown(null);
              }
            }, 100);
          }
        }}
      >
        <button
          onClick={() => toggleDropdown('danseurs')}
          className={`w-full text-black font-title uppercase text-base md:text-lg py-6 bg-green-500 hover:bg-green-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
          style={{ paddingLeft: `${DROPDOWN_PADDING_X}px`, paddingRight: `${DROPDOWN_PADDING_X}px` }}
        >
          Danseurs
        </button>
        <AnimatePresence>
          {activeDropdown === 'danseurs' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute bottom-full left-0 right-0 overflow-visible bg-transparent"
              style={{ maxHeight: '80vh' }}
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
      </div>
      
      {/* Dropdown Collab */}
      <div 
        className="w-full md:w-1/3 relative"
        ref={(el) => { dropdownRefs.current['collab'] = el; }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => {
              if (activeDropdown === 'collab' && !e.currentTarget.contains(document.activeElement)) {
                setActiveDropdown(null);
              }
            }, 100);
          }
        }}
      >
        <button
          onClick={() => toggleDropdown('collab')}
          className={`w-full text-black font-title uppercase text-base md:text-lg py-6 bg-green-500 hover:bg-green-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
          style={{ paddingLeft: `${DROPDOWN_PADDING_X}px`, paddingRight: `${DROPDOWN_PADDING_X}px` }}
        >
          Collab
        </button>
        <AnimatePresence>
          {activeDropdown === 'collab' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute bottom-full left-0 right-0 overflow-visible bg-transparent"
              style={{ maxHeight: '80vh' }}
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
      </div>
    </div>
  );
}
