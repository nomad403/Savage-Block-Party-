# AUDIT OPTIMISATIONS - Centralisation, Indépendance, Unicité & Robustesse

**Date:** 2025-01-27  
**Objectif:** Identifier les optimisations possibles pour rendre les logiques centralisées, indépendantes, uniques et robustes.

---

## ✅ AMÉLIORATIONS DÉJÀ EFFECTUÉES

### 1. **Centralisation de la détection de page** ✅
- ✅ Hook `usePageContext()` créé et utilisé partout
- ✅ Plus de duplication de logique `pathname === "/" || pathname?.startsWith("/xxx")`

### 2. **Système d'événements typé** ✅
- ✅ `src/lib/events/app-events.ts` centralise tous les événements
- ✅ Hooks `useAppEvent()` pour écouter les événements
- ✅ Helpers typés (`shopEvents`, `menuEvents`, `soundCloudEvents`)

### 3. **Détection mobile centralisée** ✅
- ✅ Hook `useMediaQuery()` et `useIsMobile()` créés
- ✅ Breakpoints standardisés dans `BREAKPOINTS`

### 4. **CSS global optimisé** ✅
- ✅ `globals.css` réduit de 1444 à ~400 lignes
- ✅ CSS extrait par page (`shop.css`, `agenda.css`, `family.css`, `presse.css`)
- ✅ `body:has()` réduit de 136 à ~6 occurrences
- ✅ `!important` réduit de 379 à ~9 occurrences

### 5. **Logique de couleur centralisée** ✅
- ✅ `useGlobalDynamicColors()` centralise toute la logique de couleur
- ✅ `DynamicColorProvider` applique les couleurs via variables CSS

---

## 🔴 PROBLÈMES CRITIQUES RESTANTS

### 1. **DUPLICATION D'ÉTAT POUR SHOP ITEMS**

**Problème:**
- `isShopItemSelected` et `isShopItemHovered` sont gérés dans **3 endroits différents** :
  1. `useGlobalDynamicColors.ts` (lignes 52-53, 128-139)
  2. `header.tsx` (lignes 21-22, 57-68)
  3. `shop/page.tsx` (lignes 58-59, 72-85)

**Impact:**
- Risque d'incohérence entre les états
- Logique dispersée et difficile à maintenir
- Chaque composant doit écouter les mêmes événements

**Recommandation:**
- Créer un hook `useShopItemState()` qui centralise :
  ```typescript
  export function useShopItemState() {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    
    // Écouter les événements une seule fois
    useAppEvent('shopItemSelected', ...);
    useAppEvent('shopItemHovered', ...);
    
    return { selectedId, hoveredId, setSelectedId, setHoveredId };
  }
  ```
- Utiliser ce hook dans `useGlobalDynamicColors`, `header.tsx` et `shop/page.tsx`

**Fichiers concernés:**
- `src/hooks/useGlobalDynamicColors.ts`
- `src/components/layout/header/header.tsx`
- `src/app/(routes)/shop/page.tsx`

---

### 2. **DUPLICATION D'ÉTAT POUR MENU HOVER**

**Problème:**
- `hoveredMenuItem` est géré dans **2 endroits** :
  1. `header.tsx` (ligne 20, 77-79, 153-161)
  2. `useMenuHover.ts` (via événements)

**Impact:**
- Logique dupliquée entre état local et hook
- Risque de désynchronisation

**Recommandation:**
- Utiliser uniquement `useMenuHover()` dans `header.tsx`
- Supprimer l'état local `hoveredMenuItem` du header
- Le hook `useMenuHover` doit être la source unique de vérité

**Fichiers concernés:**
- `src/components/layout/header/header.tsx`
- `src/hooks/useMenuHover.ts`

---

### 3. **MANIPULATION DOM DIRECTE RESTANTE**

**Problème:**
- Encore **8 fichiers** utilisent `setProperty` ou manipulation DOM directe :
  1. `header.tsx` (lignes 165-175) - Burger menu spans avec `!important`
  2. `header-player.tsx` - Probablement des manipulations de couleur
  3. `custom-scrollbar.tsx` - Styles de scrollbar
  4. `dynamic-color-provider.tsx` (lignes 35-53) - Variables CSS (acceptable)
  5. `gallery-flash.tsx` - Probablement des animations
  6. `bg-video-home.tsx` - Probablement des styles
  7. `shop/page.tsx` - Probablement des styles
  8. `shop.css` - Styles CSS (acceptable)

**Impact:**
- Difficile à déboguer
- Risque de conflits avec CSS
- Logique dispersée

**Recommandation:**
- **header.tsx (lignes 165-175):** Remplacer par classes CSS conditionnelles
  - Créer une classe `.header-burger-mobile--black` dans CSS
  - Appliquer via `className` conditionnel au lieu de `setProperty`
  
- **Autres fichiers:** Analyser chaque cas et remplacer par classes CSS ou variables CSS quand possible

**Fichiers concernés:**
- `src/components/layout/header/header.tsx` (priorité haute)
- `src/components/layout/header/header-player.tsx`
- `src/components/ui/custom-scrollbar.tsx`
- `src/components/features/gallery-flash.tsx`
- `src/components/features/bg-video-home.tsx`
- `src/app/(routes)/shop/page.tsx`

---

### 4. **LOGIQUE DE COULEUR ENCORE DISPERSÉE**

**Problème:**
- `header.tsx` calcule encore ses propres couleurs (lignes 148-161) :
  ```typescript
  const shouldBeBlack = hoveredMenuItem || (isShop && isMobile && (isShopItemSelected || isShopItemHovered));
  const logoColor = shouldBeBlack ? "#000000" : pagePrimaryColor;
  const menuTextColor = hoveredMenuItem ? "#000000" : pagePrimaryColor;
  const cartIconColor = shouldBeBlack ? "#000000" : pagePrimaryColor;
  ```
- Cette logique est **dupliquée** avec `useGlobalDynamicColors` (lignes 143-145)

**Impact:**
- Risque d'incohérence entre header et autres composants
- Logique dupliquée = maintenance difficile

**Recommandation:**
- **Utiliser uniquement `colors` de `useGlobalDynamicColors` dans `header.tsx`**
- Supprimer tous les calculs de couleur locaux
- Le header doit être un **consommateur passif** des couleurs globales

**Fichiers concernés:**
- `src/components/layout/header/header.tsx` (lignes 148-161)

---

### 5. **DÉPENDANCE CIRCULAIRE POTENTIELLE**

**Problème:**
- `useGlobalDynamicColors` dépend de :
  - `usePageContext` ✅
  - `usePagePrimaryColor` ✅
  - `useMenuHover` ✅
  - `useIsMobile` ✅
  - `useAppEvent` (pour shop items) ⚠️
  
- `useMenuHover` dépend de :
  - `useAppEvent` (pour menu items) ✅
  - `getPagePrimaryColor` ✅

- `header.tsx` dépend de :
  - `useGlobalDynamicColors` ✅
  - `usePagePrimaryColor` ⚠️ (duplication)
  - `useMenuHover` ✅
  - `useAppEvent` (pour shop items) ⚠️ (duplication)

**Impact:**
- Risque de re-renders inutiles
- Logique dupliquée entre composants

**Recommandation:**
- **header.tsx** ne doit utiliser QUE `useGlobalDynamicColors` pour les couleurs
- Supprimer `usePagePrimaryColor` du header (déjà dans `useGlobalDynamicColors`)
- Supprimer `useAppEvent` du header (déjà dans `useGlobalDynamicColors`)

**Fichiers concernés:**
- `src/components/layout/header/header.tsx`

---

## 🟡 PROBLÈMES MOYENS

### 6. **HOOKS AVEC TROP DE RESPONSABILITÉS**

**Problème:**
- `useGlobalDynamicColors` (255 lignes) gère :
  - Détection de page ✅
  - Couleurs par page ✅
  - Couleurs dynamiques (audio) ✅
  - État shop items ⚠️ (devrait être dans `useShopItemState`)
  - État menu hover ⚠️ (devrait être dans `useMenuHover`)
  - Calcul de toutes les couleurs ✅

**Recommandation:**
- Extraire la gestion d'état shop items vers `useShopItemState()`
- `useGlobalDynamicColors` ne doit que **consommer** les états, pas les gérer

**Fichiers concernés:**
- `src/hooks/useGlobalDynamicColors.ts`

---

### 7. **ÉCOUTE D'ÉVÉNEMENTS MULTIPLE**

**Problème:**
- `shopItemSelected` est écouté dans :
  1. `useGlobalDynamicColors.ts` (ligne 128)
  2. `header.tsx` (ligne 57)
  
- `shopItemHovered` est écouté dans :
  1. `useGlobalDynamicColors.ts` (ligne 133)
  2. `header.tsx` (ligne 62)

**Impact:**
- Duplication de logique
- Risque de désynchronisation

**Recommandation:**
- Centraliser dans `useShopItemState()`
- Les autres composants consomment via ce hook

**Fichiers concernés:**
- `src/hooks/useGlobalDynamicColors.ts`
- `src/components/layout/header/header.tsx`

---

### 8. **CALCULS DE COULEUR DUPLIQUÉS**

**Problème:**
- `useGlobalDynamicColors` calcule `shouldBeBlack` (ligne 144)
- `header.tsx` recalcule `shouldBeBlack` (ligne 153)
- Logique identique mais dupliquée

**Recommandation:**
- Utiliser uniquement `colors.logoColor` de `useGlobalDynamicColors`
- Supprimer le calcul dans `header.tsx`

**Fichiers concernés:**
- `src/components/layout/header/header.tsx`

---

### 9. **VARIABLES CSS SOUS-UTILISÉES**

**Problème:**
- `header.tsx` utilise encore des valeurs en dur :
  - `width: '36px'`, `height: '36px'` (ligne 247-248)
  - `width: '32px'`, `height: '32px'` (ligne 274-275)
  - `width: '22px'`, `height: '22px'` (ligne 281, 293)

**Recommandation:**
- Créer des variables CSS pour les tailles d'icônes
- Utiliser `var(--icon-size-md)`, `var(--icon-size-sm)`, etc.

**Fichiers concernés:**
- `src/components/layout/header/header.tsx`
- `src/app/styles/globals.css` ou `utilities.css`

---

## 🟢 AMÉLIORATIONS SUGGÉRÉES

### 10. **CRÉER UN HOOK `useHeaderColors()`**

**Recommandation:**
- Extraire toute la logique de couleur du header vers un hook dédié
- Le header devient un composant de présentation pur
- Facilite les tests et la maintenance

**Structure:**
```typescript
export function useHeaderColors() {
  const { colors } = useGlobalDynamicColors();
  const { isMenuHovered } = useMenuHover();
  
  return {
    logoColor: colors.logoColor,
    menuTextColor: colors.menuColor,
    cartIconColor: colors.logoColor, // Même logique que logo
    mobileMenuBgColor: isMenuHovered ? getPagePrimaryColor(...) : "transparent",
  };
}
```

---

### 11. **STANDARDISER LES BREAKPOINTS**

**Problème:**
- `useMediaQuery.ts` définit `BREAKPOINTS.mobile = 768`
- Mais certains fichiers utilisent encore `767` ou `768` en dur

**Recommandation:**
- Utiliser uniquement `useIsMobile()` partout
- Supprimer toutes les vérifications `window.innerWidth <= 767`

**Fichiers concernés:**
- Vérifier tous les fichiers qui utilisent `window.innerWidth`

---

## 📊 MÉTRIQUES ACTUELLES

- **Duplication d'état shop items:** 3 endroits → Objectif: 1 hook
- **Duplication d'état menu hover:** 2 endroits → Objectif: 1 hook
- **Manipulation DOM directe:** 8 fichiers → Objectif: 0 (sauf variables CSS)
- **Calculs de couleur dupliqués:** 2 endroits → Objectif: 1 source
- **Écoute d'événements multiple:** 2 endroits par événement → Objectif: 1 hook

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1: Centralisation des états (Priorité Haute)

1. **Créer `useShopItemState()` hook**
   - Centraliser `isShopItemSelected` et `isShopItemHovered`
   - Utiliser dans `useGlobalDynamicColors`, `header.tsx`, `shop/page.tsx`

2. **Simplifier `useMenuHover()`**
   - S'assurer qu'il est la source unique de vérité
   - Supprimer l'état local `hoveredMenuItem` du header

3. **Nettoyer `useGlobalDynamicColors()`**
   - Supprimer la gestion d'état shop items (déplacer vers `useShopItemState`)
   - Ne garder que la consommation des états

### Phase 2: Suppression manipulation DOM (Priorité Haute)

4. **Remplacer `setProperty` dans `header.tsx`**
   - Créer classes CSS conditionnelles
   - Supprimer `useEffect` avec manipulation DOM (lignes 165-175)

5. **Analyser autres fichiers**
   - Remplacer par classes CSS ou variables CSS quand possible

### Phase 3: Simplification header (Priorité Moyenne)

6. **Créer `useHeaderColors()` hook**
   - Extraire toute la logique de couleur
   - Header devient composant de présentation pur

7. **Supprimer dépendances dupliquées**
   - Supprimer `usePagePrimaryColor` du header
   - Supprimer `useAppEvent` du header
   - Utiliser uniquement `useGlobalDynamicColors`

### Phase 4: Standardisation (Priorité Basse)

8. **Variables CSS pour tailles**
   - Créer variables pour icônes
   - Utiliser partout

9. **Breakpoints standardisés**
   - Vérifier tous les usages de `window.innerWidth`
   - Remplacer par `useIsMobile()`

---

## ✅ PRINCIPES À RESPECTER

1. **Centralisation:** Une seule source de vérité pour chaque logique
2. **Indépendance:** Chaque hook/composant doit être indépendant et réutilisable
3. **Unicité:** Pas de duplication de logique
4. **Robustesse:** Gestion d'erreurs, types TypeScript, pas de side effects cachés

---

**Note:** Cet audit identifie les optimisations possibles sans modifier le comportement actuel. Toutes les modifications devront être testées pour garantir la conservation des placements, comportements et logiques existants.

