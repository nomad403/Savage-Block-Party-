"use client";

import { useState } from 'react';
import { useAppEvent } from './useAppEvents';
import { useIsMobile } from './useMediaQuery';
import { usePageContext } from './usePageContext';

/**
 * Hook centralisé pour écouter l'état des items du shop
 * 
 * SOURCE UNIQUE DE VÉRITÉ pour consommer l'état des shop items dans les composants
 * qui ne sont pas la page shop elle-même.
 * 
 * La page shop (shop/page.tsx) gère son propre état local et émet les événements.
 * Ce hook écoute ces événements et expose l'état pour les autres composants.
 * 
 * @returns État des shop items (isSelected, isHovered, productId)
 */
export function useShopItemState() {
  const { isShop } = usePageContext();
  const isMobile = useIsMobile();
  
  const [isShopItemSelected, setIsShopItemSelected] = useState(false);
  const [isShopItemHovered, setIsShopItemHovered] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<number | null>(null);

  // Écouter l'événement de sélection d'un item dans le shop
  useAppEvent('shopItemSelected', (event) => {
    setIsShopItemSelected(event.detail.isSelected);
    // Note: L'événement shopItemSelected ne contient pas de productId
    // Le productId est géré localement par shop/page.tsx
  });
  
  // Écouter l'événement de hover d'un item dans le shop (mobile uniquement)
  useAppEvent('shopItemHovered', (event) => {
    if (isMobile && isShop) {
      setIsShopItemHovered(event.detail.isHovered);
      setHoveredProductId(event.detail.productId);
    } else {
      setIsShopItemHovered(false);
      setHoveredProductId(null);
    }
  });

  return {
    // États booléens (pour compatibilité avec le code existant)
    isShopItemSelected,
    isShopItemHovered,
    
    // IDs des produits (pour usage futur si nécessaire)
    selectedProductId,
    hoveredProductId,
  };
}

