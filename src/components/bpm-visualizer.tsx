"use client";

import { useEffect, useState } from 'react';

interface AudioFeatures {
  rms: number;
  spectralCentroid: number;
  spectralRolloff?: number;
  spectralFlux?: number;
  spectralSpread?: number;
}

interface BPMVisualizerProps {
  bpm: number | null;
  audioFeatures: AudioFeatures | null;
  isAnalyzing: boolean;
  className?: string;
}

export default function BPMVisualizer({ bpm, audioFeatures, isAnalyzing, className = "" }: BPMVisualizerProps) {
  const [beatPulse, setBeatPulse] = useState(0);
  const [colorIntensity, setColorIntensity] = useState(0);

  // Effet de pulsation basé sur le BPM
  useEffect(() => {
    if (!bpm || !audioFeatures) return;

    const beatInterval = 60000 / bpm; // Intervalle en ms entre les beats
    const pulseDuration = beatInterval * 0.1; // Durée de la pulsation (10% du beat)

    const interval = setInterval(() => {
      setBeatPulse(1);
      setTimeout(() => setBeatPulse(0), pulseDuration);
    }, beatInterval);

    return () => clearInterval(interval);
  }, [bpm]);

  // Effet de couleur basé sur les caractéristiques audio
  useEffect(() => {
    if (!audioFeatures) return;

    const { rms, spectralCentroid } = audioFeatures;
    
    // Intensité basée sur le RMS (volume)
    const intensity = Math.min(rms * 2, 1);
    setColorIntensity(intensity);

    // Déclencher des effets visuels basés sur les données audio
    window.dispatchEvent(new CustomEvent('audioVisualEffects', {
      detail: {
        rms,
        spectralCentroid,
        intensity,
        bpm
      }
    }));
  }, [audioFeatures, bpm]);

  if (isAnalyzing) {
    return (
      <div className={`fixed top-4 right-4 z-[10010] ${className}`}>
        <div className="bg-black/80 text-yellow-400 px-3 py-2 rounded-lg text-sm font-mono">
          🎵 Analyse BPM...
        </div>
      </div>
    );
  }

  if (!bpm || !audioFeatures) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-[10010] ${className}`}>
      {/* Affichage BPM */}
      <div className="bg-black/80 text-yellow-400 px-3 py-2 rounded-lg text-sm font-mono mb-2">
        <div className="flex items-center gap-2">
          <span>BPM:</span>
          <span 
            className={`font-bold transition-all duration-100 ${
              beatPulse > 0 ? 'text-white scale-110' : ''
            }`}
            style={{
              transform: `scale(${1 + beatPulse * 0.2})`,
              textShadow: beatPulse > 0 ? '0 0 10px #fbbf24' : 'none'
            }}
          >
            {Math.round(bpm)}
          </span>
        </div>
      </div>

      {/* Barre de volume visuelle */}
      <div className="bg-black/80 px-3 py-2 rounded-lg">
        <div className="text-yellow-400 text-xs mb-1">Volume</div>
        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-100"
            style={{ 
              width: `${Math.min(audioFeatures.rms * 100, 100)}%`,
              opacity: 0.7 + colorIntensity * 0.3
            }}
          />
        </div>
      </div>

      {/* Effet de pulsation globale */}
      <div 
        className="fixed inset-0 pointer-events-none z-[10005]"
        style={{
          background: `radial-gradient(circle at center, rgba(251, 191, 36, ${beatPulse * 0.1}) 0%, transparent 70%)`,
          transition: 'all 0.1s ease-out'
        }}
      />
    </div>
  );
}
