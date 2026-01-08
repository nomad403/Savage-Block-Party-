"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMenu } from "@/hooks/useMenu";
import { useMenuHover } from "@/hooks/useMenuHover";
import { useDropdown } from "@/hooks/useDropdown";
import TextRevealLines from "@/components/text-reveal-lines";

// Padding horizontal du bouton dropdown - ajusté pour respiration du texte
const DROPDOWN_PADDING_X = 16; // 16px pour une meilleure respiration, proportionnel au header

interface FamilyDropdownsProps {
  onItemSelect: (item: string) => void;
  selectedItem: string | null;
}

export default function FamilyDropdowns({ onItemSelect, selectedItem }: FamilyDropdownsProps) {
  // Logique d'ouverture/fermeture extraite dans hook
  const { activeDropdown, toggleDropdown, closeDropdown, dropdownRefs } = useDropdown();
  const { isMenuOpen } = useMenu();
  const { isMenuHovered } = useMenuHover();

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
      </motion.div>
    </div>
  );
}
