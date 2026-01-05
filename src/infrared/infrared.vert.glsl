// Vertex shader pour l'effet infrarouge
// Passe simple pour un quad plein écran

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}




