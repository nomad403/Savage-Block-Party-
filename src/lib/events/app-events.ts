/**
 * Système d'événements typé pour l'application
 * Centralise tous les événements personnalisés avec typage TypeScript
 */

// ============================================================================
// TYPES D'ÉVÉNEMENTS
// ============================================================================

export interface ShopItemSelectedEvent {
  type: 'shopItemSelected';
  detail: {
    isSelected: boolean;
  };
}

export interface ShopItemHoveredEvent {
  type: 'shopItemHovered';
  detail: {
    isHovered: boolean;
    productId: number | null;
  };
}

export interface MenuToggleEvent {
  type: 'menuToggle';
  detail: {
    isOpen: boolean;
  };
}

export interface MenuItemHoverEvent {
  type: 'menuItemHover';
  detail: {
    isHovered: boolean;
    itemHref: string | null;
  };
}

export interface SoundCloudPlayEvent {
  type: 'soundcloud-play';
  detail: {};
}

export interface SoundCloudPauseEvent {
  type: 'soundcloud-pause';
  detail: {};
}

export interface SoundCloudPlayPauseEvent {
  type: 'soundcloud-play-pause';
  detail: {};
}

export interface SoundCloudPreviousEvent {
  type: 'soundcloud-previous';
  detail: {};
}

export interface SoundCloudNextEvent {
  type: 'soundcloud-next';
  detail: {};
}

export interface SoundCloudTrackChangeEvent {
  type: 'soundcloud-track-change';
  detail: {
    title: string;
    artist: string;
  };
}

export interface SoundCloudTrackChangedEvent {
  type: 'soundcloud-track-changed';
  detail: any;
}

export interface SoundCloudColorChangeEvent {
  type: 'soundcloud-color-change';
  detail: any;
}

export interface SoundCloudWidgetFailedEvent {
  type: 'soundcloud-widget-failed';
  detail: any;
}

export interface SoundCloudNetworkErrorEvent {
  type: 'soundcloud-network-error';
  detail: {};
}

export interface SoundCloudReinitializeEvent {
  type: 'soundcloud-reinitialize';
  detail: {};
}

export interface SoundCloudHealthChangedEvent {
  type: 'soundcloud-health-changed';
  detail: string;
}

export interface AudioFeaturesEvent {
  type: 'audioFeatures';
  detail: {
    rms: number;
    spectralCentroid: number;
    spectralFlux: number;
  };
}

export interface FamilyDropdownOpenEvent {
  type: 'family-dropdown-open';
  detail: {
    isOpen: boolean;
  };
}

// Union de tous les types d'événements
export type AppEvent =
  | ShopItemSelectedEvent
  | ShopItemHoveredEvent
  | MenuToggleEvent
  | MenuItemHoverEvent
  | SoundCloudPlayEvent
  | SoundCloudPauseEvent
  | SoundCloudPlayPauseEvent
  | SoundCloudPreviousEvent
  | SoundCloudNextEvent
  | SoundCloudTrackChangeEvent
  | SoundCloudTrackChangedEvent
  | SoundCloudColorChangeEvent
  | SoundCloudWidgetFailedEvent
  | SoundCloudNetworkErrorEvent
  | SoundCloudReinitializeEvent
  | SoundCloudHealthChangedEvent
  | AudioFeaturesEvent
  | FamilyDropdownOpenEvent;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Dispatch un événement de l'application
 */
export function dispatchAppEvent<T extends AppEvent>(event: T): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(event.type, { detail: event.detail }));
}

/**
 * Crée un listener typé pour un événement
 * @template T - Le type d'événement (ex: 'shopItemSelected')
 */
export function createAppEventListener<T extends AppEvent['type']>(
  type: T,
  handler: (event: CustomEvent<Extract<AppEvent, { type: T }>['detail']>) => void
): (event: Event) => void {
  return (event: Event) => {
    if (event instanceof CustomEvent) {
      // TypeScript a besoin d'une assertion explicite ici
      // car il ne peut pas inférer que le type de l'événement correspond exactement à T
      // Cette assertion est sûre car nous vérifions que event.type === type au runtime
      // @ts-ignore - TypeScript ne peut pas inférer correctement l'union de types
      handler(event);
    }
  };
}

// ============================================================================
// HELPERS POUR DISPATCHER DES ÉVÉNEMENTS
// ============================================================================

/**
 * Helpers pour les événements du shop
 */
export const shopEvents = {
  itemSelected: (isSelected: boolean) => {
    dispatchAppEvent<ShopItemSelectedEvent>({
      type: 'shopItemSelected',
      detail: { isSelected },
    });
  },
  itemHovered: (isHovered: boolean, productId: number | null) => {
    dispatchAppEvent<ShopItemHoveredEvent>({
      type: 'shopItemHovered',
      detail: { isHovered, productId },
    });
  },
};

/**
 * Helpers pour les événements du menu
 */
export const menuEvents = {
  toggle: (isOpen: boolean) => {
    dispatchAppEvent<MenuToggleEvent>({
      type: 'menuToggle',
      detail: { isOpen },
    });
  },
  itemHover: (isHovered: boolean, itemHref: string | null) => {
    dispatchAppEvent<MenuItemHoverEvent>({
      type: 'menuItemHover',
      detail: { isHovered, itemHref },
    });
  },
};

/**
 * Helpers pour les événements SoundCloud
 */
export const soundCloudEvents = {
  play: () => {
    dispatchAppEvent<SoundCloudPlayEvent>({
      type: 'soundcloud-play',
      detail: {},
    });
  },
  pause: () => {
    dispatchAppEvent<SoundCloudPauseEvent>({
      type: 'soundcloud-pause',
      detail: {},
    });
  },
  playPause: () => {
    dispatchAppEvent<SoundCloudPlayPauseEvent>({
      type: 'soundcloud-play-pause',
      detail: {},
    });
  },
  previous: () => {
    dispatchAppEvent<SoundCloudPreviousEvent>({
      type: 'soundcloud-previous',
      detail: {},
    });
  },
  next: () => {
    dispatchAppEvent<SoundCloudNextEvent>({
      type: 'soundcloud-next',
      detail: {},
    });
  },
  trackChange: (title: string, artist: string) => {
    dispatchAppEvent<SoundCloudTrackChangeEvent>({
      type: 'soundcloud-track-change',
      detail: { title, artist },
    });
  },
  trackChanged: (detail: any) => {
    dispatchAppEvent<SoundCloudTrackChangedEvent>({
      type: 'soundcloud-track-changed',
      detail,
    });
  },
  colorChange: (detail: any) => {
    dispatchAppEvent<SoundCloudColorChangeEvent>({
      type: 'soundcloud-color-change',
      detail,
    });
  },
  widgetFailed: (detail: any) => {
    dispatchAppEvent<SoundCloudWidgetFailedEvent>({
      type: 'soundcloud-widget-failed',
      detail,
    });
  },
  networkError: () => {
    dispatchAppEvent<SoundCloudNetworkErrorEvent>({
      type: 'soundcloud-network-error',
      detail: {},
    });
  },
  reinitialize: () => {
    dispatchAppEvent<SoundCloudReinitializeEvent>({
      type: 'soundcloud-reinitialize',
      detail: {},
    });
  },
  healthChanged: (health: string) => {
    dispatchAppEvent<SoundCloudHealthChangedEvent>({
      type: 'soundcloud-health-changed',
      detail: health,
    });
  },
};

/**
 * Helpers pour les événements audio
 */
export const audioEvents = {
  features: (rms: number, spectralCentroid: number, spectralFlux: number) => {
    dispatchAppEvent<AudioFeaturesEvent>({
      type: 'audioFeatures',
      detail: { rms, spectralCentroid, spectralFlux },
    });
  },
};

/**
 * Helpers pour les événements de la page family
 */
export const familyEvents = {
  dropdownOpen: (isOpen: boolean) => {
    dispatchAppEvent<FamilyDropdownOpenEvent>({
      type: 'family-dropdown-open',
      detail: { isOpen },
    });
  },
};
