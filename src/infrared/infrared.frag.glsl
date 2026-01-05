// Fragment shader pour effet infrarouge thermique réaliste
// Basé sur inversion des couleurs et palette thermique (rouge chaud, bleu froid)

uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uVegetationBoost;  // Intensité IR végétation [0.0 - 3.0]
uniform float uGamma;            // Courbe capteur [0.5 - 2.5]
uniform float uExposure;          // Compression dynamique [0.1 - 3.0]
uniform float uBloomStrength;    // Force bloom optique [0.0 - 1.0]
uniform float uNoiseAmount;      // Quantité grain optique [0.0 - 0.1]
uniform float uThermalIntensity; // Intensité effet thermique [0.0 - 1.0]

varying vec2 vUv;

// Fonction de bruit pour grain optique animé
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Bruit animé stable
float animatedNoise(vec2 uv) {
    vec2 nuv = uv * 512.0 + uTime * 0.5;
    float n = noise(floor(nuv));
    n += noise(floor(nuv) + vec2(1.0, 0.0)) * 0.5;
    n += noise(floor(nuv) + vec2(0.0, 1.0)) * 0.25;
    n += noise(floor(nuv) + vec2(1.0, 1.0)) * 0.125;
    return n * 0.5714285714285714; // Normalisation
}

// Conversion RGB vers luminance (pondération standard)
float rgbToLuminance(vec3 rgb) {
    return dot(rgb, vec3(0.2126, 0.7152, 0.0722));
}

// Détection implicite de végétation via canal vert
// La végétation réfléchit fortement en NIR, simulé via amplification du vert
float vegetationIRResponse(float green, float luminance) {
    // Amplification progressive basée sur le canal vert
    float vegSignal = smoothstep(0.15, 0.85, green);
    // Boost IR pour végétation (réponse spectrale NIR)
    return vegSignal * uVegetationBoost;
}

// Courbe non linéaire type capteur IR
float sensorCurve(float value) {
    // Courbe gamma pour simuler la réponse non linéaire du capteur
    return pow(max(value, 0.0), 1.0 / uGamma);
}

// Compression dynamique type capteur (exposure)
float dynamicCompression(float value) {
    // Compression logarithmique douce
    return 1.0 - exp(-value * uExposure);
}

// Palette thermique monochrome : conversion température → couleur
// 0.0 = froid (gris foncé) → 1.0 = chaud (gris clair avec teinte rouge subtile)
vec3 thermalPalette(float temperature) {
    // Clamp température entre 0 et 1
    temperature = clamp(temperature, 0.0, 1.0);
    
    // Gradient thermique monochrome avec teinte rouge subtile :
    // 0.0-0.5 : Gris très foncé → Gris moyen (froid)
    // 0.5-1.0 : Gris moyen → Gris clair avec teinte rouge subtile (chaud)
    
    vec3 color;
    
    // Application d'une courbe de contraste pour renforcer les différences
    // Utilisation de smoothstep pour créer une transition plus nette
    float contrastCurve = smoothstep(0.2, 0.8, temperature);
    
    // Calcul de la luminance (base monochrome) avec contraste renforcé
    // Les zones froides restent très sombres, les zones chaudes deviennent plus claires
    float luminance = mix(0.1, 0.95, contrastCurve);
    
    // Application d'une teinte rouge très subtile qui augmente avec la température
    // Plus la température est élevée, plus la teinte rouge est présente
    float redTint = smoothstep(0.4, 1.0, temperature) * 0.15; // Teinte rouge subtile (max 15%)
    
    // Base monochrome avec teinte rouge progressive et contraste renforcé
    color = vec3(
        luminance + redTint,           // Rouge légèrement renforcé pour zones chaudes
        luminance * 0.95,              // Vert légèrement atténué
        luminance * 0.9                // Bleu plus atténué pour effet chaud
    );
    
    return color;
}

// Bloom optique subtil basé sur luminance
vec3 applyBloom(vec3 color, float luminance) {
    // Seuil pour bloom (zones très lumineuses/chaudes)
    float bloomThreshold = 0.7;
    float bloomFactor = smoothstep(bloomThreshold, 1.0, luminance);
    // Bloom doux et diffus (légèrement chaud)
    vec3 bloomColor = vec3(1.0, 0.6, 0.2) * bloomFactor * uBloomStrength * 0.3;
    return color + bloomColor;
}

void main() {
    // Échantillonnage de la texture source
    vec4 texColor = texture2D(tDiffuse, vUv);
    vec3 rgb = texColor.rgb;
    
    // Étape 1: Inversion des couleurs (fondamental pour effet thermique)
    vec3 inverted = vec3(1.0) - rgb;
    
    // Étape 2: Manipulation des canaux RGB pour effet thermique
    // Renforcement des rouges (zones chaudes) et bleus (zones froides)
    float r = inverted.r;
    float g = inverted.g;
    float b = inverted.b;
    
    // Amplification différentielle des canaux
    // Rouge = chaleur, Bleu = froid, Vert = transition
    r = pow(r, 0.8);  // Renforce les rouges
    g = pow(g, 1.1);  // Légèrement atténué pour transition
    b = pow(b, 0.9);  // Renforce les bleus
    
    // Recomposition avec pondération thermique
    vec3 thermalRGB = vec3(r * 1.2, g * 0.9, b * 1.1);
    
    // Étape 3: Conversion vers luminance pour calcul température
    float luminance = rgbToLuminance(thermalRGB);
    
    // Étape 4: Détection végétation via canal vert original
    float green = rgb.g;
    float vegIR = vegetationIRResponse(green, luminance);
    
    // Étape 5: Calcul température (combinaison luminance + végétation)
    float temperature = luminance + vegIR * 0.3;
    // Application d'une courbe de contraste plus agressive pour renforcer les différences
    temperature = smoothstep(0.15, 0.85, temperature);
    
    // Étape 6: Courbe non linéaire type capteur
    float curved = sensorCurve(temperature);
    
    // Étape 7: Compression dynamique type capteur
    float compressed = dynamicCompression(curved);
    
    // Étape 8: Application palette thermique
    vec3 thermalColor = thermalPalette(compressed);
    
    // Étape 9: Mélange avec RGB inversé pour effet plus réaliste
    // uThermalIntensity contrôle le mélange entre RGB inversé et palette pure
    vec3 finalColor = mix(thermalRGB, thermalColor, uThermalIntensity);
    
    // Étape 10: Bloom optique subtil
    finalColor = applyBloom(finalColor, compressed);
    
    // Étape 11: Grain optique animé
    float grain = animatedNoise(vUv);
    grain = (grain - 0.5) * uNoiseAmount;
    finalColor += grain;
    
    // Clamp final pour éviter les valeurs hors gamme
    finalColor = clamp(finalColor, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, texColor.a);
}


