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

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        const dropdownElement = dropdownRefs.current[activeDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          closeDropdown();
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

  return {
    activeDropdown,
    toggleDropdown,
    closeDropdown,
    dropdownRefs,
  };
}

