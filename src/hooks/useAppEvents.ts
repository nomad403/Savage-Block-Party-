"use client";

import { useEffect, useRef } from 'react';
import type { AppEvent } from '@/lib/events/app-events';
import { createAppEventListener } from '@/lib/events/app-events';

/**
 * Hook générique pour écouter un événement de l'application
 * 
 * @param type - Type d'événement à écouter
 * @param handler - Fonction appelée quand l'événement est déclenché
 * 
 * @example
 * useAppEvent('shopItemSelected', (event) => {
 *   console.log('Item selected:', event.detail.isSelected);
 * });
 */

export function useAppEvent<T extends AppEvent['type']>(
  type: T,
  handler: (event: CustomEvent<Extract<AppEvent, { type: T }>['detail']>) => void
): void {
  // Utiliser un ref pour garder la dernière version du handler
  const handlerRef = useRef(handler);
  
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const listener = createAppEventListener(type, (event) => {
      // TypeScript a besoin d'un cast explicite ici pour l'inférence de type
      handlerRef.current(event as any);
    });
    
    window.addEventListener(type, listener);

    return () => {
      window.removeEventListener(type, listener);
    };
  }, [type]);
}

/**
 * Hook pour écouter les événements du shop
 */
export function useShopEvents() {
  return {
    useItemSelected: (
      handler: (event: CustomEvent<{ isSelected: boolean }>) => void
    ) => useAppEvent('shopItemSelected', handler),
    useItemHovered: (
      handler: (event: CustomEvent<{ isHovered: boolean; productId: number | null }>) => void
    ) => useAppEvent('shopItemHovered', handler),
  };
}

/**
 * Hook pour écouter les événements du menu
 */
export function useMenuEvents() {
  return {
    useToggle: (
      handler: (event: CustomEvent<{ isOpen: boolean }>) => void
    ) => useAppEvent('menuToggle', handler),
    useItemHover: (
      handler: (event: CustomEvent<{ isHovered: boolean; itemHref: string | null }>) => void
    ) => useAppEvent('menuItemHover', handler),
  };
}

/**
 * Hook pour écouter les événements SoundCloud
 */
export function useSoundCloudEvents() {
  return {
    usePlay: (handler: () => void) => 
      useAppEvent('soundcloud-play', () => handler()),
    usePause: (handler: () => void) => 
      useAppEvent('soundcloud-pause', () => handler()),
    usePlayPause: (handler: () => void) => 
      useAppEvent('soundcloud-play-pause', () => handler()),
    usePrevious: (handler: () => void) => 
      useAppEvent('soundcloud-previous', () => handler()),
    useNext: (handler: () => void) => 
      useAppEvent('soundcloud-next', () => handler()),
    useTrackChange: (
      handler: (event: CustomEvent<{ title: string; artist: string }>) => void
    ) => useAppEvent('soundcloud-track-change', handler),
    useTrackChanged: (
      handler: (event: CustomEvent<any>) => void
    ) => useAppEvent('soundcloud-track-changed', handler),
    useColorChange: (
      handler: (event: CustomEvent<any>) => void
    ) => useAppEvent('soundcloud-color-change', handler),
    useWidgetFailed: (
      handler: (event: CustomEvent<any>) => void
    ) => useAppEvent('soundcloud-widget-failed', handler),
    useNetworkError: (handler: () => void) => 
      useAppEvent('soundcloud-network-error', () => handler()),
    useReinitialize: (handler: () => void) => 
      useAppEvent('soundcloud-reinitialize', () => handler()),
    useHealthChanged: (
      handler: (event: CustomEvent<string>) => void
    ) => useAppEvent('soundcloud-health-changed', handler),
  };
}

/**
 * Hook pour écouter les événements audio
 */
export function useAudioEvents() {
  return {
    useFeatures: (
      handler: (event: CustomEvent<{ rms: number; spectralCentroid: number; spectralFlux: number }>) => void
    ) => useAppEvent('audioFeatures', handler),
  };
}

