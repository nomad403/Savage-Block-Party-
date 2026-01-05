/**
 * InfraredVideo - Composant wrapper pour appliquer l'effet infrarouge à une vidéo
 * Exemple d'intégration simple et prête à l'emploi
 */

"use client";

import { useEffect, useRef, useState } from 'react';
import { InfraredRenderer } from './InfraredRenderer';

export interface InfraredVideoProps {
    src: string;
    className?: string;
    width?: number;
    height?: number;
    autoPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
    playsInline?: boolean;
    // Paramètres IR
    vegetationBoost?: number;
    gamma?: number;
    exposure?: number;
    bloomStrength?: number;
    noiseAmount?: number;
    thermalIntensity?: number;
}

export function InfraredVideo({
    src,
    className = '',
    width = 1920,
    height = 1080,
    autoPlay = true,
    loop = true,
    muted = true,
    playsInline = true,
    vegetationBoost = 1.8,
    gamma = 1.2,
    exposure = 1.5,
    bloomStrength = 0.15,
    noiseAmount = 0.03,
    thermalIntensity = 0.8,
}: InfraredVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedData = () => {
            setVideoElement(video);
            setIsReady(true);
        };

        video.addEventListener('loadeddata', handleLoadedData);
        
        // Si la vidéo est déjà chargée
        if (video.readyState >= 2) {
            handleLoadedData();
        }

        return () => {
            video.removeEventListener('loadeddata', handleLoadedData);
        };
    }, []);

    return (
        <div className={`relative w-full h-full ${className}`}>
            {/* Vidéo source (cachée) */}
            <video
                ref={videoRef}
                src={src}
                autoPlay={autoPlay}
                loop={loop}
                muted={muted}
                playsInline={playsInline}
                className="hidden"
                preload="auto"
            />
            
            {/* Renderer infrarouge */}
            {isReady && videoElement && (
                <InfraredRenderer
                    videoElement={videoElement}
                    width={width}
                    height={height}
                    vegetationBoost={vegetationBoost}
                    gamma={gamma}
                    exposure={exposure}
                    bloomStrength={bloomStrength}
                    noiseAmount={noiseAmount}
                    thermalIntensity={thermalIntensity}
                />
            )}
        </div>
    );
}


