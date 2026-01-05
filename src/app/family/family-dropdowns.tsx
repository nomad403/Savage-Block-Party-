"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMenu } from "@/hooks/useMenu";
import TextRevealLines from "@/components/text-reveal-lines";

interface FamilyDropdownsProps {
  onItemSelect: (item: string) => void;
  selectedItem: string | null;
}

export default function FamilyDropdowns({ onItemSelect, selectedItem }: FamilyDropdownsProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { isMenuOpen } = useMenu();
  
  // Sur la page family, les dropdowns ont toujours un z-index plus élevé que la waveform
  // La waveform a un z-index max de 10002, donc on met 10003 pour les dropdowns
  // Si un dropdown est ouvert, on augmente encore pour garantir la priorité
  const finalZIndex = activeDropdown ? 10004 : 10003;

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const selectItem = (item: string) => {
    onItemSelect(item);
    setActiveDropdown(null); // Fermer le dropdown après sélection
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
      className="relative w-full flex flex-col md:flex-row"
      style={{ zIndex: finalZIndex }}
    >
      {/* Dropdown DJs */}
      <div className="w-full md:w-1/3 relative">
        <button
          onClick={() => toggleDropdown('djs')}
          className={`w-full text-black font-title uppercase text-base md:text-lg py-6 px-6 bg-green-500 hover:bg-green-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
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
                      overflow: 'hidden',
                      flexShrink: 0,
                      width: '100%'
                    }}
                  >
                    <TextRevealLines
                      text={dj}
                      color="#22C55E"
                      className="font-text font-semibold tracking-tight leading-none text-4xl text-black whitespace-nowrap"
                      delayStep={0.1}
                      noPadding={true}
                      horizontalPadding={24}
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
      <div className="w-full md:w-1/3 relative">
        <button
          onClick={() => toggleDropdown('danseurs')}
          className={`w-full text-black font-title uppercase text-base md:text-lg py-6 px-6 bg-green-500 hover:bg-green-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
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
                      overflow: 'hidden',
                      flexShrink: 0,
                      width: '100%'
                    }}
                  >
                    <TextRevealLines
                      text={danseur}
                      color="#22C55E"
                      className="font-text font-semibold tracking-tight leading-none text-4xl text-black whitespace-nowrap"
                      delayStep={0.1}
                      noPadding={true}
                      horizontalPadding={24}
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
      <div className="w-full md:w-1/3 relative">
        <button
          onClick={() => toggleDropdown('collab')}
          className={`w-full text-black font-title uppercase text-base md:text-lg py-6 px-6 bg-green-500 hover:bg-green-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
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
                      overflow: 'hidden',
                      flexShrink: 0,
                      width: '100%'
                    }}
                  >
                    <TextRevealLines
                      text={collab}
                      color="#22C55E"
                      className="font-text font-semibold tracking-tight leading-none text-4xl text-black whitespace-nowrap"
                      delayStep={0.1}
                      noPadding={true}
                      horizontalPadding={24}
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
