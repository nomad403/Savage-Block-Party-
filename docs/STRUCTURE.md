# Structure du Projet - Organisation Professionnelle

## 📁 Architecture Complète

### `/src/app/` - Next.js App Router
```
app/
├── (routes)/              # Route group - regroupe toutes les routes
│   ├── agenda/
│   │   ├── page.tsx
│   │   ├── agenda-events-list.tsx
│   │   └── agenda.css
│   ├── family/
│   │   ├── page.tsx
│   │   ├── family-dropdowns.tsx
│   │   └── family.css
│   ├── presse/
│   │   ├── page.tsx
│   │   └── presse.css
│   ├── shop/
│   │   ├── page.tsx
│   │   └── shop.css
│   └── page.tsx           # Home page (/)
├── styles/                # CSS globaux centralisés
│   ├── globals.css
│   ├── fonts.css
│   ├── iframes.css
│   ├── scrollbar.css
│   └── utilities.css
├── layout.tsx              # Layout racine (Next.js requis)
├── sitemap.ts              # Sitemap (Next.js requis)
├── robots.txt              # Robots.txt (Next.js requis)
├── manifest.webmanifest    # Manifest (Next.js requis)
└── favicon.ico             # Favicon (Next.js requis)
```

**Note:** Le route group `(routes)` n'affecte pas les URLs. Les routes restent identiques :
- `(routes)/agenda/page.tsx` → `/agenda`
- `(routes)/page.tsx` → `/`

### `/src/components/` - Composants React organisés
```
components/
├── layout/                 # Composants de layout (header, footer)
│   ├── header/
│   │   ├── header.tsx
│   │   ├── header-player.tsx
│   │   └── index.ts
│   ├── footer.tsx
│   └── index.ts
├── menu/                   # Composants de menu
│   ├── menu-overlay.tsx
│   ├── menu-aware-section.tsx
│   └── index.ts
├── player/                 # Composants audio
│   ├── soundcloud-player.tsx
│   └── index.ts
├── ui/                     # Composants UI réutilisables
│   ├── custom-scrollbar.tsx
│   ├── scroll-hint.tsx
│   ├── text-reveal-lines.tsx
│   └── index.ts
├── features/               # Features spécifiques
│   ├── bg-video-home.tsx
│   ├── gallery-flash.tsx
│   ├── story-overlay.tsx
│   └── index.ts
└── providers/              # Context providers
    ├── dynamic-color-provider.tsx
    └── index.ts
```

### `/src/hooks/` - React Hooks
```
hooks/
├── useAppEvents.ts
├── useDropdown.ts
├── useGlobalDynamicColors.ts
├── useMediaQuery.ts
├── useMenu.ts
├── useMenuHover.ts
├── usePageContext.ts
├── usePagePrimaryColor.ts
├── useScrollDirection.ts
├── useScrollZIndex.ts
└── useSoundCloudPlayer.ts
```

### `/src/lib/` - Bibliothèques et utilitaires
```
lib/
├── events/
│   └── app-events.ts       # Système d'événements typé
├── api/
│   ├── events.ts           # API pour récupérer les événements (Shotgun/Dice)
│   └── soundcloud.ts       # API SoundCloud
└── utils/
    └── analysis-config.ts  # Configuration pour l'analyse audio
```

### `/src/types/` - Types TypeScript centralisés
```
types/
├── soundcloud.ts           # Types SoundCloud
└── audio-analysis.ts       # Types pour l'analyse audio
```

### `/src/features/` - Features complexes isolées
```
features/
└── infrared/
    ├── index.ts
    ├── InfraredMaterial.ts
    ├── InfraredPass.ts
    ├── InfraredRenderer.tsx
    ├── InfraredVideo.tsx
    ├── infrared.frag.glsl
    ├── infrared.vert.glsl
    ├── glsl.d.ts
    └── README.md
```

### `/docs/` - Documentation
```
docs/
├── AUDIT_CODE.md
├── STRUCTURE.md
└── deprecated/
```

## 🎯 Principes d'Organisation

### 1. **Séparation par responsabilité**
- Chaque dossier a une responsabilité claire et unique
- Pas de mélange de préoccupations

### 2. **Index files pour exports**
- Chaque sous-dossier de composants exporte via `index.ts`
- Facilite les imports : `import { Header } from '@/components/layout'`

### 3. **Imports absolus**
- Tous les imports utilisent le préfixe `@/` (configuré dans `tsconfig.json`)
- Plus de problèmes de chemins relatifs lors des déplacements

### 4. **CSS scoped par page**
- Chaque page a son propre fichier CSS
- Styles globaux dans `/app/styles/`

### 5. **Types centralisés**
- Tous les types dans `/src/types/`
- Facilite la réutilisation et la maintenance

### 6. **API séparée**
- Les appels API dans `/src/lib/api/`
- Séparation claire entre logique métier et appels externes

### 7. **Events centralisés**
- Système d'événements dans `/src/lib/events/`
- Communication inter-composants typée

### 8. **Features isolées**
- Features complexes (comme infrared) dans `/features/`
- Isolation pour faciliter la maintenance

## 📝 Fichiers à la racine de `/src/app/`

Ces fichiers **DOIVENT** rester à la racine selon les conventions Next.js :
- `layout.tsx` - Layout racine
- `page.tsx` - Page d'accueil
- `sitemap.ts` - Génération automatique du sitemap
- `robots.txt` - Fichier robots
- `manifest.webmanifest` - Manifest PWA
- `favicon.ico` - Favicon

## ✅ Avantages de cette structure

1. **Maintenabilité** : Chaque domaine dans son dossier
2. **Scalabilité** : Facile d'ajouter de nouvelles features
3. **Clarté** : Structure logique et prévisible
4. **Professionnalisme** : Organisation standard de l'industrie
5. **Imports simplifiés** : Chemins absolus avec `@/`
6. **Isolation** : Features complexes isolées

## 🔄 Migration effectuée

- ✅ CSS globaux → `app/styles/`
- ✅ Composants organisés par catégorie
- ✅ Header et Footer → `components/layout/`
- ✅ Types centralisés → `types/`
- ✅ API séparée → `lib/api/`
- ✅ Events centralisés → `lib/events/`
- ✅ Features isolées → `features/`
- ✅ Documentation → `docs/`
- ✅ Dossiers vides supprimés
- ✅ Tous les imports mis à jour
