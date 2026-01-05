/**
 * InfraredMaterial - Matériau Three.js pour effet infrarouge réaliste
 * Basé sur shader GLSL custom avec réponse spectrale physique
 */

import { ShaderMaterial, Texture, Uniform } from 'three';

// Import des shaders GLSL
// @ts-ignore - Next.js webpack loader
import infraredVertexShader from './infrared.vert.glsl';
// @ts-ignore - Next.js webpack loader
import infraredFragmentShader from './infrared.frag.glsl';

export interface InfraredMaterialParams {
    map?: Texture | null;
    time?: number;
    vegetationBoost?: number;  // [0.0 - 3.0] - Intensité IR végétation
    gamma?: number;            // [0.5 - 2.5] - Courbe capteur
    exposure?: number;         // [0.1 - 3.0] - Compression dynamique
    bloomStrength?: number;    // [0.0 - 1.0] - Force bloom optique
    noiseAmount?: number;      // [0.0 - 0.1] - Quantité grain optique
    thermalIntensity?: number; // [0.0 - 1.0] - Intensité effet thermique
}

export class InfraredMaterial extends ShaderMaterial {
    private _time: number = 0;
    private _vegetationBoost: number = 1.8;
    private _gamma: number = 1.2;
    private _exposure: number = 1.5;
    private _bloomStrength: number = 0.15;
    private _noiseAmount: number = 0.03;
    private _thermalIntensity: number = 0.8;

    constructor(params: InfraredMaterialParams = {}) {
        super({
            vertexShader: infraredVertexShader,
            fragmentShader: infraredFragmentShader,
            uniforms: {
                tDiffuse: new Uniform(params.map || null),
                uTime: new Uniform(0.0),
                uVegetationBoost: new Uniform(1.8),
                uGamma: new Uniform(1.2),
                uExposure: new Uniform(1.5),
                uBloomStrength: new Uniform(0.15),
                uNoiseAmount: new Uniform(0.03),
                uThermalIntensity: new Uniform(0.8),
            },
        });

        // Appliquer les paramètres
        if (params.map !== undefined) {
            this.uniforms.tDiffuse.value = params.map;
        }
        if (params.time !== undefined) {
            this._time = params.time;
            this.uniforms.uTime.value = params.time;
        }
        if (params.vegetationBoost !== undefined) {
            this.setVegetationBoost(params.vegetationBoost);
        }
        if (params.gamma !== undefined) {
            this.setGamma(params.gamma);
        }
        if (params.exposure !== undefined) {
            this.setExposure(params.exposure);
        }
        if (params.bloomStrength !== undefined) {
            this.setBloomStrength(params.bloomStrength);
        }
        if (params.noiseAmount !== undefined) {
            this.setNoiseAmount(params.noiseAmount);
        }
        if (params.thermalIntensity !== undefined) {
            this.setThermalIntensity(params.thermalIntensity);
        }
    }

    /**
     * Met à jour le temps pour l'animation du grain
     */
    updateTime(time: number): void {
        this._time = time;
        this.uniforms.uTime.value = time;
    }

    /**
     * Définit l'intensité de la réponse IR pour la végétation
     * @param value [0.0 - 3.0] - Valeur par défaut: 1.8
     */
    setVegetationBoost(value: number): void {
        this._vegetationBoost = Math.max(0.0, Math.min(3.0, value));
        this.uniforms.uVegetationBoost.value = this._vegetationBoost;
    }

    /**
     * Définit la courbe gamma du capteur
     * @param value [0.5 - 2.5] - Valeur par défaut: 1.2
     */
    setGamma(value: number): void {
        this._gamma = Math.max(0.5, Math.min(2.5, value));
        this.uniforms.uGamma.value = this._gamma;
    }

    /**
     * Définit la compression dynamique (exposure)
     * @param value [0.1 - 3.0] - Valeur par défaut: 1.5
     */
    setExposure(value: number): void {
        this._exposure = Math.max(0.1, Math.min(3.0, value));
        this.uniforms.uExposure.value = this._exposure;
    }

    /**
     * Définit la force du bloom optique
     * @param value [0.0 - 1.0] - Valeur par défaut: 0.15
     */
    setBloomStrength(value: number): void {
        this._bloomStrength = Math.max(0.0, Math.min(1.0, value));
        this.uniforms.uBloomStrength.value = this._bloomStrength;
    }

    /**
     * Définit la quantité de grain optique animé
     * @param value [0.0 - 0.1] - Valeur par défaut: 0.03
     */
    setNoiseAmount(value: number): void {
        this._noiseAmount = Math.max(0.0, Math.min(0.1, value));
        this.uniforms.uNoiseAmount.value = this._noiseAmount;
    }

    /**
     * Définit l'intensité de l'effet thermique
     * @param value [0.0 - 1.0] - Valeur par défaut: 0.8
     * 0.0 = RGB inversé uniquement, 1.0 = palette thermique pure
     */
    setThermalIntensity(value: number): void {
        this._thermalIntensity = Math.max(0.0, Math.min(1.0, value));
        this.uniforms.uThermalIntensity.value = this._thermalIntensity;
    }

    /**
     * Définit la texture source
     */
    setMap(texture: Texture | null): void {
        this.uniforms.tDiffuse.value = texture;
    }

    // Getters pour les valeurs actuelles
    get time(): number { return this._time; }
    get vegetationBoost(): number { return this._vegetationBoost; }
    get gamma(): number { return this._gamma; }
    get exposure(): number { return this._exposure; }
    get bloomStrength(): number { return this._bloomStrength; }
    get noiseAmount(): number { return this._noiseAmount; }
    get thermalIntensity(): number { return this._thermalIntensity; }
}

