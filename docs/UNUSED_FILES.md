# Fichiers et Éléments Inutilisés

## 🔴 Fichiers à Supprimer (Non Utilisés)

### 1. `src/hooks/useSoundCloudPlayer.ts`
**Statut:** ✅ **SUPPRIMÉ**

- **Raison:** Ce hook n'était jamais importé dans le projet
- **Alternative:** La logique SoundCloud est directement dans `components/player/soundcloud-player.tsx`
- **Action:** ✅ Supprimé avec succès

---

## 🟡 Fonctions Exportées Non Utilisées

### 2. `getPagePrimaryColor()` dans `src/hooks/usePagePrimaryColor.ts`
**Statut:** ✅ **UTILISÉE - À CONSERVER**

- **Raison:** Cette fonction est utilisée dans :
  - `useMenuHover.ts` (ligne 22) - pour obtenir la couleur depuis un pathname
  - `header.tsx` (ligne 161) - pour la couleur du fond du menu mobile au hover
- **Action:** ✅ Conservée - fonction nécessaire

---

## 🟢 Features Isolées (Non Intégrées)

### 3. `src/features/infrared/` - Système Infrarouge
**Statut:** ✅ **SUPPRIMÉ**

**Analyse:**
- ✅ Tous les fichiers étaient utilisés **entre eux** (cohérence interne)
- ❌ Aucun fichier n'était importé dans le reste de l'application
- 📝 Il s'agissait d'une feature Three.js/WebGL isolée non intégrée

**Action:** ✅ Supprimé avec succès

**Note importante:** 
- La classe CSS `.filter-infrared` est **conservée** dans `utilities.css` et **utilisée** dans plusieurs pages (family, presse, agenda, etc.)
- Cette classe CSS est un simple filtre CSS, indépendante des composants Three.js supprimés
- Le loader webpack pour GLSL dans `next.config.ts` peut être supprimé si aucun autre fichier GLSL n'est utilisé

---

## ✅ Fichiers Utilisés (À GARDER)

### Types
- ✅ `src/types/soundcloud.ts` - Utilisé via `/// <reference path="@/types/soundcloud" />`
- ✅ `src/types/audio-analysis.ts` - Utilisé dans `lib/api/soundcloud.ts` et `lib/utils/analysis-config.ts`

### Hooks
- ✅ `usePagePrimaryColor` (hook) - Utilisé dans header, header-player, useGlobalDynamicColors, useMenuHover
- ✅ `useScrollDirection` - Utilisé dans `family/page.tsx`
- ✅ `useScrollZIndex` - Utilisé dans `footer.tsx` et `soundcloud-player.tsx`

---

## 📊 Résumé

| Type | Nombre | Action |
|------|--------|--------|
| Fichiers à supprimer | 1 | `useSoundCloudPlayer.ts` |
| Fonctions inutilisées | 1 | `getPagePrimaryColor()` |
| Features isolées | 1 | `features/infrared/` (à décider) |

---

## 🎯 Recommandations

1. **Supprimer immédiatement:**
   - `src/hooks/useSoundCloudPlayer.ts`

2. **Décider pour:**
   - `getPagePrimaryColor()` - Supprimer ou documenter usage futur
   - `features/infrared/` - Garder si prévu, sinon déplacer/supprimer

3. **Vérifier avant suppression:**
   - S'assurer que `useSoundCloudPlayer` n'est pas référencé dans des commentaires ou documentation
   - Vérifier si `features/infrared/` est mentionné dans des plans futurs

