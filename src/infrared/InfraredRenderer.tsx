/**
 * InfraredRenderer - Composant React pour appliquer l'effet infrarouge
 * Utilise Three.js avec EffectComposer pour post-processing
 */

"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { InfraredPass } from './InfraredPass';

export interface InfraredRendererProps {
    videoElement: HTMLVideoElement | null;
    width?: number;
    height?: number;
    vegetationBoost?: number;
    gamma?: number;
    exposure?: number;
    bloomStrength?: number;
    noiseAmount?: number;
    thermalIntensity?: number;
    onReady?: (composer: EffectComposer) => void;
}

export function InfraredRenderer({
    videoElement,
    width = 1920,
    height = 1080,
    vegetationBoost = 1.8,
    gamma = 1.2,
    exposure = 1.5,
    bloomStrength = 0.15,
    noiseAmount = 0.03,
    thermalIntensity = 0.8,
    onReady,
}: InfraredRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const composerRef = useRef<EffectComposer | null>(null);
    const infraredPassRef = useRef<InfraredPass | null>(null);
    const textureRef = useRef<THREE.VideoTexture | null>(null);
    const meshRef = useRef<THREE.Mesh | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (!containerRef.current || !videoElement) return;

        const container = containerRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Créer texture vidéo
        const videoTexture = new THREE.VideoTexture(videoElement);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBAFormat;

        // Créer quad plein écran
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.MeshBasicMaterial({ map: videoTexture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // EffectComposer
        const composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        // InfraredPass
        const infraredPass = new InfraredPass({
            vegetationBoost,
            gamma,
            exposure,
            bloomStrength,
            noiseAmount,
            thermalIntensity,
        });
        infraredPass.renderToScreen = true;
        composer.addPass(infraredPass);

        // Références
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        composerRef.current = composer;
        infraredPassRef.current = infraredPass;
        textureRef.current = videoTexture;
        meshRef.current = mesh;

        setIsInitialized(true);
        if (onReady) {
            onReady(composer);
        }

        // Animation loop
        let time = 0;
        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            
            time += 0.016; // ~60fps
            infraredPass.updateTime(time);
            
            composer.render();
        };
        animate();

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement);
            }
            videoTexture.dispose();
            material.dispose();
            geometry.dispose();
            renderer.dispose();
            composer.dispose();
            infraredPass.dispose();
        };
    }, [videoElement, width, height, onReady]);

    // Mise à jour des paramètres
    useEffect(() => {
        if (!infraredPassRef.current) return;
        infraredPassRef.current.setVegetationBoost(vegetationBoost);
    }, [vegetationBoost]);

    useEffect(() => {
        if (!infraredPassRef.current) return;
        infraredPassRef.current.setGamma(gamma);
    }, [gamma]);

    useEffect(() => {
        if (!infraredPassRef.current) return;
        infraredPassRef.current.setExposure(exposure);
    }, [exposure]);

    useEffect(() => {
        if (!infraredPassRef.current) return;
        infraredPassRef.current.setBloomStrength(bloomStrength);
    }, [bloomStrength]);

    useEffect(() => {
        if (!infraredPassRef.current) return;
        infraredPassRef.current.setNoiseAmount(noiseAmount);
    }, [noiseAmount]);

    useEffect(() => {
        if (!infraredPassRef.current) return;
        infraredPassRef.current.setThermalIntensity(thermalIntensity);
    }, [thermalIntensity]);

    // Redimensionnement
    useEffect(() => {
        if (!rendererRef.current || !composerRef.current) return;
        rendererRef.current.setSize(width, height);
        composerRef.current.setSize(width, height);
    }, [width, height]);

    return <div ref={containerRef} className="w-full h-full" />;
}


