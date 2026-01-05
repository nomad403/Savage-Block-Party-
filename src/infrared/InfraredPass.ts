/**
 * InfraredPass - Pass pour EffectComposer Three.js
 * Applique l'effet infrarouge réaliste en post-processing
 */

import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { ShaderMaterial, WebGLRenderer, WebGLRenderTarget } from 'three';

// Import des shaders GLSL
// @ts-ignore - Next.js webpack loader
import infraredVertexShader from './infrared.vert.glsl';
// @ts-ignore - Next.js webpack loader
import infraredFragmentShader from './infrared.frag.glsl';

export interface InfraredPassParams {
    vegetationBoost?: number;
    gamma?: number;
    exposure?: number;
    bloomStrength?: number;
    noiseAmount?: number;
    thermalIntensity?: number;
}

export class InfraredPass extends Pass {
    private material: ShaderMaterial;
    private fsQuad: FullScreenQuad;
    private _time: number = 0;

    constructor(params: InfraredPassParams = {}) {
        super();

        this.material = new ShaderMaterial({
            vertexShader: infraredVertexShader,
            fragmentShader: infraredFragmentShader,
            uniforms: {
                tDiffuse: { value: null },
                uTime: { value: 0.0 },
                uVegetationBoost: { value: params.vegetationBoost ?? 1.8 },
                uGamma: { value: params.gamma ?? 1.2 },
                uExposure: { value: params.exposure ?? 1.5 },
                uBloomStrength: { value: params.bloomStrength ?? 0.15 },
                uNoiseAmount: { value: params.noiseAmount ?? 0.03 },
                uThermalIntensity: { value: params.thermalIntensity ?? 0.8 },
            },
        });

        this.fsQuad = new FullScreenQuad(this.material);
    }

    /**
     * Met à jour le temps pour l'animation du grain
     */
    updateTime(time: number): void {
        this._time = time;
        this.material.uniforms.uTime.value = time;
    }

    /**
     * Définit l'intensité de la réponse IR pour la végétation
     */
    setVegetationBoost(value: number): void {
        this.material.uniforms.uVegetationBoost.value = Math.max(0.0, Math.min(3.0, value));
    }

    /**
     * Définit la courbe gamma du capteur
     */
    setGamma(value: number): void {
        this.material.uniforms.uGamma.value = Math.max(0.5, Math.min(2.5, value));
    }

    /**
     * Définit la compression dynamique (exposure)
     */
    setExposure(value: number): void {
        this.material.uniforms.uExposure.value = Math.max(0.1, Math.min(3.0, value));
    }

    /**
     * Définit la force du bloom optique
     */
    setBloomStrength(value: number): void {
        this.material.uniforms.uBloomStrength.value = Math.max(0.0, Math.min(1.0, value));
    }

    /**
     * Définit la quantité de grain optique animé
     */
    setNoiseAmount(value: number): void {
        this.material.uniforms.uNoiseAmount.value = Math.max(0.0, Math.min(0.1, value));
    }

    /**
     * Définit l'intensité de l'effet thermique
     */
    setThermalIntensity(value: number): void {
        this.material.uniforms.uThermalIntensity.value = Math.max(0.0, Math.min(1.0, value));
    }

    render(
        renderer: WebGLRenderer,
        writeBuffer: WebGLRenderTarget,
        readBuffer: WebGLRenderTarget
    ): void {
        this.material.uniforms.tDiffuse.value = readBuffer.texture;
        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
        } else {
            renderer.setRenderTarget(writeBuffer);
            if (this.clear) renderer.clear();
        }
        this.fsQuad.render(renderer);
    }

    setSize(width: number, height: number): void {
        // Pas de redimensionnement nécessaire pour un pass simple
    }

    dispose(): void {
        this.material.dispose();
        this.fsQuad.dispose();
    }
}

