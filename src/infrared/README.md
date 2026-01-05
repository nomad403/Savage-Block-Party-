# Système d'effet infrarouge thermique réaliste

Système de post-processing infrarouge thermique basé sur WebGL/Three.js avec shaders GPU pour un rendu réaliste et performant. L'effet utilise l'inversion des couleurs et une palette thermique (rouge chaud, bleu froid).

## Architecture

```
/infrared/
  ├── infrared.vert.glsl      # Vertex shader (quad plein écran)
  ├── infrared.frag.glsl      # Fragment shader (effet IR)
  ├── InfraredMaterial.ts     # Matériau Three.js standalone
  ├── InfraredPass.ts         # Pass pour EffectComposer
  ├── InfraredRenderer.tsx    # Composant React d'intégration
  └── index.ts                # Exports principaux
```

## Utilisation

### Avec EffectComposer (recommandé)

```typescript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { InfraredPass } from '@/infrared';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const infraredPass = new InfraredPass({
    vegetationBoost: 1.8,
    gamma: 1.2,
    exposure: 1.5,
    bloomStrength: 0.15,
    noiseAmount: 0.03,
    thermalIntensity: 0.8,
});
infraredPass.renderToScreen = true;
composer.addPass(infraredPass);

// Dans la boucle d'animation
infraredPass.updateTime(time);
composer.render();
```

### Avec composant React (vidéo HTML5)

```tsx
import { InfraredRenderer } from '@/infrared';
import { useRef } from 'react';

function VideoWithInfrared() {
    const videoRef = useRef<HTMLVideoElement>(null);

    return (
        <>
            <video
                ref={videoRef}
                src="/path/to/video.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{ display: 'none' }}
            />
            <InfraredRenderer
                videoElement={videoRef.current}
                width={1920}
                height={1080}
                vegetationBoost={1.8}
                gamma={1.2}
                exposure={1.5}
                bloomStrength={0.15}
                noiseAmount={0.03}
                thermalIntensity={0.8}
            />
        </>
    );
}
```

### Avec InfraredMaterial (standalone)

```typescript
import { InfraredMaterial } from '@/infrared';
import { VideoTexture } from 'three';

const material = new InfraredMaterial({
    map: videoTexture,
    vegetationBoost: 1.8,
    gamma: 1.2,
    exposure: 1.5,
    bloomStrength: 0.15,
    noiseAmount: 0.03,
    thermalIntensity: 0.8,
});

// Mise à jour du temps pour l'animation
material.updateTime(time);
```

## Paramètres

### `vegetationBoost` [0.0 - 3.0]
Intensité de la réponse IR pour la végétation. Valeur par défaut: `1.8`
- Plus élevé = végétation plus claire (réflexion NIR forte)

### `gamma` [0.5 - 2.5]
Courbe non linéaire du capteur. Valeur par défaut: `1.2`
- Plus élevé = contraste plus doux
- Plus bas = contraste plus dur

### `exposure` [0.1 - 3.0]
Compression dynamique. Valeur par défaut: `1.5`
- Plus élevé = image plus claire
- Plus bas = image plus sombre

### `bloomStrength` [0.0 - 1.0]
Force du bloom optique. Valeur par défaut: `0.15`
- Plus élevé = halos plus prononcés sur les zones lumineuses

### `noiseAmount` [0.0 - 0.1]
Quantité de grain optique animé. Valeur par défaut: `0.03`
- Plus élevé = grain plus visible

### `thermalIntensity` [0.0 - 1.0]
Intensité de l'effet thermique. Valeur par défaut: `0.8`
- 0.0 = RGB inversé uniquement
- 1.0 = palette thermique pure (rouge chaud, bleu froid)
- Valeurs intermédiaires = mélange progressif

## Caractéristiques techniques

- ✅ **1 seule passe shader** - Performance optimale
- ✅ **Zéro branching conditionnel** - Exécution uniforme sur GPU
- ✅ **Accélération GPU native** - Pas de calcul CPU
- ✅ **Temps réel** - 60fps sur matériel moderne
- ✅ **Mobile-friendly** - Optimisé pour appareils mobiles
- ✅ **Physiquement cohérent** - Basé sur réponse spectrale NIR réelle

## Pipeline shader

1. **Inversion des couleurs** (fondamental pour effet thermique)
2. **Manipulation des canaux RGB** :
   - Rouge : renforcé (zones chaudes)
   - Vert : transition (zones tempérées)
   - Bleu : renforcé (zones froides)
3. Conversion vers luminance pour calcul température
4. Détection végétation via canal vert original
5. Calcul température (combinaison luminance + végétation)
6. Courbe non linéaire type capteur (pow)
7. Compression dynamique (exposure)
8. Application palette thermique (bleu → cyan → vert → jaune → orange → rouge)
9. Mélange avec RGB inversé selon `thermalIntensity`
10. Bloom optique subtil (zones chaudes)
11. Grain optique animé (bruit stable)

## Résultat visuel

- **Zones chaudes** : Rouge/Orange/Jaune (corps, sources de chaleur)
- **Zones tempérées** : Vert/Cyan (végétation, objets neutres)
- **Zones froides** : Bleu/Cyan (ciel, ombres, objets froids)
- Gradient thermique réaliste et fluide
- Sensation caméra thermique réelle


