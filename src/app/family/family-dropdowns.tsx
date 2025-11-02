"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMenu } from "@/hooks/useMenu";

// Composant pour l'animation de révélation ligne par ligne (version robuste)
function LineByLineText({ text, className, delay = 0 }: { text: string; className: string; delay?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const textElement = container.querySelector(`.${className.split(' ')[0]}`) as HTMLElement;
    if (!textElement) return;

    // Calculer les dimensions de chaque ligne
    const lines = text.split('\n').filter(line => line.trim());
    const lineData = lines.map((line, index) => {
      // Créer un élément temporaire pour mesurer
      const tempElement = document.createElement('div');
      tempElement.className = className;
      tempElement.textContent = line;
      tempElement.style.position = 'absolute';
      tempElement.style.visibility = 'hidden';
      tempElement.style.whiteSpace = 'nowrap';
      document.body.appendChild(tempElement);
      
      const rect = tempElement.getBoundingClientRect();
      document.body.removeChild(tempElement);
      
      return {
        text: line,
        width: rect.width,
        height: rect.height,
        top: index * rect.height // Pas d'espacement entre les lignes
      };
    });

    // Créer les overlays d'animation
    lineData.forEach((line, index) => {
      const overlay = document.createElement('div');
      overlay.className = 'text-reveal-line';
      overlay.style.cssText = `
        position: absolute;
        top: ${line.top}px;
        left: 0px;
        width: ${line.width}px;
        height: ${line.height}px;
        overflow: hidden;
        z-index: -1;
        padding: 0;
      `;
      
      const beforeElement = document.createElement('div');
      beforeElement.style.cssText = `
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: #22C55E;
        transform: translateX(-100%);
        transition: transform 0.6s ease;
        pointer-events: none;
        will-change: transform;
      `;
      
      overlay.appendChild(beforeElement);
      container.appendChild(overlay);
      lineRefs.current[index] = overlay;

      // Déclencher l'animation avec délai
      setTimeout(() => {
        beforeElement.style.transform = 'translateX(0)';
      }, delay + (index * 200));
    });

    return () => {
      lineRefs.current.forEach(overlay => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      });
    };
  }, [text, className, delay]);

  return (
    <div ref={containerRef} className="relative">
      <div className={className}>
        {text}
      </div>
    </div>
  );
}

interface FamilyDropdownsProps {
  onItemSelect: (item: string) => void;
  selectedItem: string | null;
}

export default function FamilyDropdowns({ onItemSelect, selectedItem }: FamilyDropdownsProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { isMenuOpen } = useMenu();

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
    <div className="absolute top-0 left-0 right-0 z-20 flex">
      {/* Dropdown DJs */}
      <div className="flex-1 relative bg-green-500">
        <button
          onClick={() => toggleDropdown('djs')}
          className={`w-full text-black font-title uppercase text-lg py-4 px-6 hover:bg-green-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
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
              className="absolute top-full left-0 right-0 overflow-hidden"
            >
              <div className="w-1/3">
                {djs.map((dj, index) => (
                  <div 
                    key={dj}
                    onClick={() => selectItem(dj)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <LineByLineText
                      text={dj}
                      className="font-text font-semibold tracking-tight leading-tight text-4xl text-black whitespace-nowrap"
                      delay={index * 100}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Dropdown Danseurs */}
      <div className="flex-1 relative bg-green-500">
        <button
          onClick={() => toggleDropdown('danseurs')}
          className={`w-full text-black font-title uppercase text-lg py-4 px-6 hover:bg-green-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
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
              className="absolute top-full left-0 right-0 overflow-hidden"
            >
              <div className="w-1/3">
                {danseurs.map((danseur, index) => (
                  <div 
                    key={danseur}
                    onClick={() => selectItem(danseur)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <LineByLineText
                      text={danseur}
                      className="font-text font-semibold tracking-tight leading-tight text-4xl text-black whitespace-nowrap"
                      delay={index * 100}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Dropdown Collab */}
      <div className="flex-1 relative bg-green-500">
        <button
          onClick={() => toggleDropdown('collab')}
          className={`w-full text-black font-title uppercase text-lg py-4 px-6 hover:bg-green-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
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
              className="absolute top-full left-0 right-0 overflow-hidden"
            >
              <div className="w-1/3">
                {collabs.map((collab, index) => (
                  <div 
                    key={collab}
                    onClick={() => selectItem(collab)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <LineByLineText
                      text={collab}
                      className="font-text font-semibold tracking-tight leading-tight text-4xl text-black whitespace-nowrap"
                      delay={index * 100}
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
