"use client";

import { useEffect } from 'react';
import { useGlobalDynamicColors } from '@/hooks/useGlobalDynamicColors';
import { useMenuHover } from '@/hooks/useMenuHover';
import { useShopItemState } from '@/hooks/useShopItemState';
import { usePageContext } from '@/hooks/usePageContext';

/**
 * Composant qui gère les classes CSS conditionnelles et les variables CSS globales
 * Remplace les manipulations DOM directes par un système de classes CSS robuste
 */
export default function DynamicColorProvider() {
  const { colors, currentTheme, isTransitioning } = useGlobalDynamicColors();
  const { isMenuHovered } = useMenuHover();
  const { isShopItemSelected, isShopItemHovered } = useShopItemState();
  const { isShop } = usePageContext();

  useEffect(() => {
    // Appliquer les couleurs dynamiques aux variables CSS globales
    const root = document.documentElement;
    
    // Couleurs principales
    root.style.setProperty('--dynamic-primary', colors.primary);
    root.style.setProperty('--dynamic-primary-hover', colors.primaryHover);
    root.style.setProperty('--dynamic-primary-faded', colors.primaryFaded);
    
    // Couleurs du menu
    root.style.setProperty('--dynamic-menu-color', colors.menuColor);
    root.style.setProperty('--dynamic-menu-hover-bg', colors.menuHoverBg);
    root.style.setProperty('--dynamic-menu-hover-text', colors.menuHoverText);
    
    // Couleurs du logo
    root.style.setProperty('--dynamic-logo-color', colors.logoColor);
    
    // Couleurs de la scrollbar
    root.style.setProperty('--dynamic-scrollbar-color', colors.scrollbarColor);
    root.style.setProperty('--dynamic-scrollbar-hover', colors.scrollbarHover);
    
    // Couleurs des effets
    root.style.setProperty('--dynamic-noise-overlay', colors.noiseOverlay);
    root.style.setProperty('--dynamic-grid-lines', colors.gridLines);
  }, [colors, currentTheme, isTransitioning]);

  // Appliquer les classes CSS conditionnelles sur le body et header
  useEffect(() => {
    const body = document.body;
    const header = document.querySelector('header');

    // Classes pour l'état du shop
    if (isShop) {
      body.classList.add('shop-page-active');
      
      if (isShopItemSelected) {
        body.classList.add('shop-item-selected');
        if (header) header.classList.add('shop-item-selected');
      } else {
        body.classList.remove('shop-item-selected');
        if (header) header.classList.remove('shop-item-selected');
      }

      if (isShopItemHovered) {
        body.classList.add('shop-item-hovered');
        if (header) header.classList.add('shop-item-hovered');
      } else {
        body.classList.remove('shop-item-hovered');
        if (header) header.classList.remove('shop-item-hovered');
      }
    } else {
      body.classList.remove('shop-page-active', 'shop-item-selected', 'shop-item-hovered');
      if (header) {
        header.classList.remove('shop-item-selected', 'shop-item-hovered');
      }
    }

    // Classes pour l'état du menu hover
    if (isMenuHovered) {
      body.classList.add('menu-hovered');
      if (header) header.classList.add('menu-hovered');
    } else {
      body.classList.remove('menu-hovered');
      if (header) header.classList.remove('menu-hovered');
    }

    // Cleanup
    return () => {
      body.classList.remove('shop-page-active', 'shop-item-selected', 'shop-item-hovered', 'menu-hovered');
      if (header) {
        header.classList.remove('shop-item-selected', 'shop-item-hovered', 'menu-hovered');
      }
    };
  }, [isShop, isShopItemSelected, isShopItemHovered, isMenuHovered]);

  // Ce composant ne rend rien, il ne fait que gérer les couleurs CSS et les classes
  return null;
}

