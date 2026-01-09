# AUDIT COMPLET DU CODE - ROBUSTESSE, CENTRALISATION & SIMPLIFICATION

**Date:** $(date)
**Objectif:** Conserver tous les placements, comportements et logiques actuels tout en solidifiant la robustesse, la centralisation et la simplification du code pour le rendre professionnel et scalable.

---

## 🟥 PROBLÈMES CRITIQUES (À CORRIGER EN PRIORITÉ)

### 1. **CSS GLOBAL SURCHARGÉ (globals.css - 1444 lignes)**

**Problème:**
- `globals.css` fait office de moteur de layout, logique métier, routing, z-index et animation
- 136 occurrences de `body:has(#xxx-root)` créant une dépendance forte au routing
- 379 occurrences de `!important` indiquant des conflits de spécificité
- Mélange de règles globales et spécifiques par page

**Impact:**
- Debug difficile (règles tardives + !important)
- Chaque nouvelle page nécessite des règles `body:has()`
- Risque d'effets collatéraux entre pages
- Maintenance complexe

**Recommandation:**
- Extraire les règles spécifiques par page vers des fichiers CSS dédiés (comme `family.css`)
- Créer `shop.css`, `presse.css`, `agenda.css`
- Réserver `globals.css` aux variables CSS, reset, et utilitaires vraiment globaux
- Réduire drastiquement l'utilisation de `body:has()` en faveur de classes CSS appliquées côté React

**Fichiers concernés:**
- `src/app/globals.css` (1444 lignes)
- Toutes les pages utilisant `body:has()`

---

### 2. **DUPLICATION DE LOGIQUE DE DÉTECTION DE PAGE**

**Problème:**
- La logique `pathname === "/" || pathname?.startsWith("/xxx")` est dupliquée dans 7+ fichiers
- Chaque composant recalcule indépendamment la page actuelle

**Fichiers concernés:**
- `src/components/header.tsx` (lignes 24-28)
- `src/components/soundcloud-player-simple.tsx` (lignes 13-17)
- `src/components/header-player.tsx` (lignes 17-18)
- `src/hooks/useGlobalDynamicColors.ts` (lignes 39-43)
- `src/components/bg-video-home.tsx`
- `src/components/custom-scrollbar.tsx`
- `src/hooks/usePagePrimaryColor.ts`

**Recommandation:**
- Créer un hook centralisé `usePageContext()` qui retourne:
  ```typescript
  {
    pathname: string,
    isHome: boolean,
    isAgenda: boolean,
    isFamily: boolean,
    isShop: boolean,
    isPresse: boolean,
    pageId: string, // "home" | "agenda" | "family" | "shop" | "presse"
    rootId: string // "#home-root" | "#agenda-root" | etc.
  }
  ```
- Remplacer toutes les duplications par ce hook unique

---

### 3. **COMMUNICATION ENTRE COMPOSANTS VIA CUSTOM EVENTS (111 occurrences)**

**Problème:**
- 111 occurrences de `CustomEvent`, `dispatchEvent`, `addEventListener`, `removeEventListener`
- Communication découplée et difficile à tracer
- Pas de typage TypeScript pour les événements
- Risque de fuites mémoire si les listeners ne sont pas correctement nettoyés

**Exemples:**
- `shopItemSelected`, `shopItemHovered`, `menuItemHover`, `soundcloud-color-change`, `soundcloud-play`, `soundcloud-pause`, `soundcloud-track-change`, `menuToggle`, `audioFeatures`

**Recommandation:**
- Créer un système d'événements typé dans `src/lib/events.ts`
- Centraliser tous les événements avec types TypeScript
- Créer des hooks pour chaque type d'événement (ex: `useShopItemEvents()`, `useMenuEvents()`)
- Documenter clairement le flux de communication

**Fichiers concernés:**
- `src/app/shop/page.tsx` (lignes 67-97)
- `src/components/header.tsx` (lignes 58-84)
- `src/components/header-player.tsx` (lignes 26-56)
- `src/hooks/useGlobalDynamicColors.ts` (lignes 60-71, 81-128, 131-141)
- `src/hooks/useMenu.ts` (lignes 8-19)
- `src/hooks/useMenuHover.ts` (lignes 17-34)
- Et 10+ autres fichiers

---

### 4. **MANIPULATION DOM DIRECTE POUR LES STYLES (setProperty avec !important)**

**Problème:**
- Utilisation excessive de `element.style.setProperty(..., 'important')` pour forcer les styles
- Logique de couleur dispersée entre CSS et JavaScript
- Difficile à maintenir et à déboguer

**Exemples:**
- `src/components/header.tsx` (lignes 86-123, 125-161) - Couleurs du logo, menu, panier
- `src/components/header-player.tsx` (lignes 71-131) - Couleurs du player
- `src/app/shop/page.tsx` (lignes 99-161) - Force les couleurs du header

**Recommandation:**
- Centraliser toute la logique de couleur dans `useGlobalDynamicColors`
- Utiliser des classes CSS conditionnelles plutôt que `setProperty`
- Créer un système de classes CSS dynamiques basé sur l'état (ex: `header--shop-item-selected`, `header--menu-hovered`)
- Réduire drastiquement l'utilisation de `!important` en CSS

---

### 5. **DÉTECTION MOBILE DUPLIQUÉE (25 occurrences)**

**Problème:**
- `typeof window !== 'undefined' && window.innerWidth <= 767` est dupliqué dans 10 fichiers
- Pas de gestion du resize
- Incohérences possibles entre les breakpoints

**Fichiers concernés:**
- `src/components/header.tsx` (lignes 88-89, 127)
- `src/app/shop/page.tsx` (lignes 78, 101)
- `src/components/header-player.tsx` (lignes 73-75)
- Et 7+ autres fichiers

**Recommandation:**
- Créer un hook `useMediaQuery(breakpoint)` ou `useIsMobile()`
- Centraliser les breakpoints dans un fichier de configuration
- Gérer automatiquement le resize avec `window.matchMedia`

---

### 6. **LOGIQUE DE COULEUR DISPERSÉE ET COMPLEXE**

**Problème:**
- Logique de couleur répartie entre:
  - `useGlobalDynamicColors` (hook principal)
  - `usePagePrimaryColor` (couleurs par page)
  - `header.tsx` (manipulation DOM directe)
  - `header-player.tsx` (manipulation DOM directe)
  - `shop/page.tsx` (force les couleurs)
  - `globals.css` (règles CSS avec !important)

**Impact:**
- Difficile de comprendre quelle couleur sera appliquée dans quel contexte
- Risque de conflits et d'incohérences
- Debug complexe

**Recommandation:**
- Centraliser TOUTE la logique de couleur dans `useGlobalDynamicColors`
- Créer un système de "modes" de couleur (ex: `normal`, `menu-hovered`, `item-selected`, `item-hovered`)
- Utiliser des classes CSS conditionnelles plutôt que manipulation DOM
- Documenter clairement la hiérarchie des couleurs

---

## 🟨 PROBLÈMES MOYENS (À AMÉLIORER)

### 7. **COMPOSANTS AVEC TROP DE RESPONSABILITÉS**

**Problème:**
- `header.tsx` (494 lignes) gère:
  - Layout du header
  - Navigation
  - Menu mobile
  - Couleurs dynamiques
  - Écoute d'événements
  - Manipulation DOM
  - Logique de hover

- `shop/page.tsx` (955 lignes) gère:
  - Layout des produits
  - Scroll horizontal/vertical
  - Sélection d'items
  - Hover d'items
  - Événements CustomEvent
  - Force les couleurs du header
  - Animation du texte défilant

**Recommandation:**
- Extraire des sous-composants (ex: `MobileMenu`, `DesktopNav`, `CartIcon`)
- Extraire des hooks (ex: `useShopItemSelection()`, `useShopItemHover()`)
- Séparer la logique métier de la présentation

---

### 8. **VARIABLES CSS SOUS-EXPLOITÉES**

**Problème:**
- Variables CSS bien introduites mais certaines valeurs restent dupliquées en JS
- Calculs "mentaux" au lieu d'utiliser les variables CSS

**Exemples:**
- `--shop-item-core-width` défini en CSS mais recalculé en JS
- Hauteurs calculées en dur (`80px`, `96px`, `172px`) au lieu d'utiliser `--header-height-mobile`, `--footer-total-height-mobile`

**Recommandation:**
- Faire des variables CSS la source de vérité unique
- Lire les variables CSS depuis JS avec `getComputedStyle` si nécessaire
- Documenter toutes les variables CSS et leurs usages

---

### 9. **STACKING CONTEXTS IMPLICITES**

**Problème:**
- Trop de `transform`, `filter`, `backdrop-filter` créant des stacking contexts invisibles
- Risque de bugs subtils sur Safari/iOS

**Exemples:**
- `.filter-infrared { transform: translateZ(0); }` sur chaque média
- `backdrop-filter` dans le menu
- `transform` sur des containers de haut niveau

**Recommandation:**
- Documenter tous les stacking contexts créés
- Éviter `transform` sur des containers de haut niveau (sauf pour animation)
- Réserver `transform` aux éléments animés uniquement

---

### 10. **STYLES INLINE ET STYLES CSS MÉLANGÉS**

**Problème:**
- Mélange de styles inline (via `style={}`) et classes CSS
- Incohérences possibles entre les deux approches

**Exemples:**
- `src/app/shop/page.tsx` utilise beaucoup de styles inline
- `src/components/header.tsx` utilise `setProperty` pour les styles

**Recommandation:**
- Préférer les classes CSS conditionnelles
- Utiliser les styles inline uniquement pour les valeurs dynamiques (ex: `transform: translateX(${x}px)`)
- Centraliser les styles dans des fichiers CSS ou des modules CSS

---

## 🟩 POINTS POSITIFS (À CONSERVER)

### ✅ **Séparation des layers (Family page)**
- Structure claire: Background → Content → Dropdowns → Header
- Bonne utilisation de z-index via variables CSS

### ✅ **Hooks réutilisables**
- `useDropdown`, `useScrollDirection`, `useMenu`, `useMenuHover` sont bien conçus
- Bonne séparation des responsabilités

### ✅ **Variables CSS pour layout**
- `--player-height-mobile`, `--waveform-height`, `--footer-total-height-mobile` bien définies
- Variables z-index documentées

### ✅ **TextRevealLines robuste**
- Utilise `inline-block` et `::before` pour shrink-to-fit
- Plus de `getBoundingClientRect` ou `ResizeObserver`

---

## 📋 PLAN D'ACTION RECOMMANDÉ

### Phase 1: Centralisation (Priorité Haute)
1. ✅ Créer `usePageContext()` hook pour remplacer les duplications
2. ✅ Créer système d'événements typé dans `src/lib/events.ts`
3. ✅ Créer `useMediaQuery()` hook pour remplacer les détections mobile dupliquées
4. ✅ Centraliser toute la logique de couleur dans `useGlobalDynamicColors`

### Phase 2: Extraction CSS (Priorité Haute)
1. ✅ Extraire règles Shop vers `src/app/shop/shop.css`
2. ✅ Extraire règles Presse vers `src/app/presse/presse.css`
3. ✅ Extraire règles Agenda vers `src/app/agenda/agenda.css`
4. ✅ Réduire `globals.css` aux variables, reset et utilitaires globaux

### Phase 3: Refactoring Composants (Priorité Moyenne)
1. ✅ Extraire sous-composants de `header.tsx`
2. ✅ Extraire hooks de `shop/page.tsx`
3. ✅ Réduire manipulation DOM directe au profit de classes CSS

### Phase 4: Documentation (Priorité Basse)
1. ✅ Documenter la hiérarchie des couleurs
2. ✅ Documenter tous les événements CustomEvent
3. ✅ Documenter les stacking contexts
4. ✅ Documenter les variables CSS et leurs usages

---

## 📊 MÉTRIQUES ACTUELLES

- **globals.css:** 1444 lignes (objectif: < 500 lignes)
- **body:has():** 136 occurrences (objectif: < 20)
- **!important:** 379 occurrences (objectif: < 50)
- **CustomEvent:** 111 occurrences (objectif: centralisé et typé)
- **Détection mobile dupliquée:** 25 occurrences (objectif: 1 hook)
- **Détection page dupliquée:** 7+ fichiers (objectif: 1 hook)

---

## 🎯 OBJECTIFS FINAUX

1. **Robustesse:** Code prévisible, sans effets collatéraux entre pages
2. **Centralisation:** Une seule source de vérité pour chaque logique
3. **Simplicité:** Code lisible, maintenable, scalable
4. **Professionnalisme:** Architecture claire, patterns cohérents, documentation

---

**Note:** Cet audit identifie les problèmes sans modifier le comportement actuel. Toutes les modifications devront être testées pour garantir la conservation des placements, comportements et logiques existants.

