"use client";

import { useState } from 'react';
import { useAppEvent } from './useAppEvents';

export function useMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useAppEvent('menuToggle', (event) => {
    setIsMenuOpen(event.detail.isOpen);
  });

  return { isMenuOpen };
}

