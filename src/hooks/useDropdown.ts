"use client";

import { useState, useEffect, useRef } from 'react';

/**
 * Hook pour gérer l'état d'ouverture/fermeture d'un dropdown
 * 
 * RESPONSABILITÉ UNIQUE : Gérer l'état open/close d'un dropdown
 * 
 * Retourne :
 * - activeDropdown: string | null (le dropdown actuellement ouvert)
 * - toggleDropdown: (dropdown: string) => void
 * - closeDropdown: () => void
 * - dropdownRefs: refs pour chaque dropdown (pour click outside)
 */
export function useDropdown() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  // Fermer le dropdown quand on clique/touche en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (activeDropdown) {
        const dropdownElement = dropdownRefs.current[activeDropdown];
        const target = event.target as Node;
        
        // Vérifier si le touch/click est dans le dropdown ou dans une liste déroulante
        if (dropdownElement && !dropdownElement.contains(target)) {
          // Vérifier aussi si le touch est dans une liste déroulante (motion.div avec overflow-y)
          const isInDropdownList = (target as HTMLElement).closest('[style*="overflow-y"]');
          if (!isInDropdownList) {
            closeDropdown();
          }
        }
      }
    };

    if (activeDropdown) {
      // Petit délai pour éviter de fermer immédiatement après l'ouverture
      const timeoutId = setTimeout(() => {
        // Gérer les événements souris et touch pour compatibilité mobile
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
      }, 10);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [activeDropdown]);

  return {
    activeDropdown,
    toggleDropdown,
    closeDropdown,
    dropdownRefs,
  };
}

