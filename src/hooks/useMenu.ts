"use client";

import { useState, useEffect } from 'react';

export function useMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleMenuToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsMenuOpen(customEvent.detail?.isOpen || false);
    };

    window.addEventListener('menuToggle', handleMenuToggle);
    
    return () => {
      window.removeEventListener('menuToggle', handleMenuToggle);
    };
  }, []);

  return { isMenuOpen };
}

