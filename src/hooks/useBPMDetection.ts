"use client";

import { useEffect, useState, useRef, useCallback } from 'react';

// Imports avec gestion d'erreur pour éviter les erreurs de runtime
let analyze: any, guess: any, Meyda: any;

try {
  const beatDetector = require('web-audio-beat-detector');
  analyze = beatDetector.analyze;
  guess = beatDetector.guess;
} catch (error) {
  console.warn('web-audio-beat-detector non disponible:', error);
}

try {
  Meyda = require('meyda');
} catch (error) {
  console.warn('Meyda non disponible:', error);
}

interface BPMAnalysis {
  bpm: number;
  offset: number;
  tempo: number;
}

interface AudioFeatures {
  rms: number;
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: number;
  spectralSpread: number;
}

interface BPMDetectionResult {
  bpm: number | null;
  audioFeatures: AudioFeatures | null;
  isAnalyzing: boolean;
  error: string | null;
}

export function useBPMDetection() {
  const [result, setResult] = useState<BPMDetectionResult>({
    bpm: null,
    audioFeatures: null,
    isAnalyzing: false,
    error: null
  });

  // 🔥 NOUVEAU : État pour désactiver Meyda si elle cause des erreurs
  const [meydaDisabled, setMeydaDisabled] = useState(false);
  const [meydaErrorCount, setMeydaErrorCount] = useState(0);
  const maxMeydaErrors = 5; // Désactiver Meyda après 5 erreurs consécutives

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<any>(null);
  const meydaAnalyzerRef = useRef<any>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // 🔥 SOLUTION STABLE CONTEXT7 : Créer l'AudioContext uniquement à la première interaction utilisateur
  const getOrCreateAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('🎧 AudioContext créé');
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('🎧 AudioContext relancé par interaction');
      }

      return audioContextRef.current;
    } catch (error) {
      console.error('Erreur création/reprise AudioContext:', error);
      setResult(prev => ({ ...prev, error: 'Impossible d\'initialiser l\'AudioContext' }));
      return null;
    }
  }, []);

  // Fonction pour forcer la reprise de l'AudioContext (exposée pour usage externe)
  const resumeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) return false;
    
    try {
      if (audioContextRef.current.state === 'suspended') {
        console.log('🔄 Reprise forcée de l\'AudioContext...');
        await audioContextRef.current.resume();
        console.log('✅ AudioContext repris avec succès');
        return true;
      } else if (audioContextRef.current.state === 'running') {
        console.log('✅ AudioContext déjà actif');
        return true;
      } else {
        console.warn('⚠️ AudioContext dans un état inattendu:', audioContextRef.current.state);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la reprise de l\'AudioContext:', error);
      return false;
    }
  }, []);

  // Analyser le BPM d'un AudioBuffer
  const analyzeBPM = useCallback(async (audioBuffer: AudioBuffer): Promise<BPMAnalysis | null> => {
    try {
      if (!guess) {
        console.warn('web-audio-beat-detector non disponible, analyse BPM désactivée');
        return null;
      }

      setResult(prev => ({ ...prev, isAnalyzing: true, error: null }));
      
      const analysis = await guess(audioBuffer);
      console.log('🎵 BPM détecté:', analysis);
      
      setResult(prev => ({ 
        ...prev, 
        bpm: analysis.bpm,
        isAnalyzing: false 
      }));
      
      return analysis;
    } catch (error) {
      console.error('Erreur analyse BPM:', error);
      setResult(prev => ({ 
        ...prev, 
        error: 'Erreur lors de l\'analyse BPM',
        isAnalyzing: false 
      }));
      return null;
    }
  }, []);

  // Configurer Meyda pour l'analyse en temps réel
  const setupMeydaAnalyzer = useCallback((audioElement: HTMLAudioElement) => {
    if (!audioContextRef.current) return;

    try {
      // Créer le source node depuis l'élément audio
      const source = audioContextRef.current.createMediaElementSource(audioElement);
      sourceRef.current = source;
      
      // Connecter au destination pour entendre l'audio
      source.connect(audioContextRef.current.destination);

      // Créer l'analyseur Meyda
      const meydaAnalyzer = Meyda.createMeydaAnalyzer({
        audioContext: audioContextRef.current,
        source: source,
        bufferSize: 512,
        featureExtractors: [
          'rms',
          'spectralCentroid', 
          'spectralRolloff',
          'spectralFlux',
          'spectralSpread'
        ],
        callback: (features: any) => {
          const audioFeatures: AudioFeatures = {
            rms: features.rms || 0,
            spectralCentroid: features.spectralCentroid || 0,
            spectralRolloff: features.spectralRolloff || 0,
            spectralFlux: features.spectralFlux || 0,
            spectralSpread: features.spectralSpread || 0
          };

          setResult(prev => ({ 
            ...prev, 
            audioFeatures 
          }));

          // Déclencher un événement personnalisé pour les effets visuels
          window.dispatchEvent(new CustomEvent('audioFeatures', { 
            detail: audioFeatures 
          }));
        }
      });

      meydaAnalyzerRef.current = meydaAnalyzer;
      meydaAnalyzer.start();
      
      console.log('🎛️ Meyda analyzer démarré');
    } catch (error) {
      console.error('Erreur configuration Meyda:', error);
      setResult(prev => ({ 
        ...prev, 
        error: 'Erreur configuration analyseur audio' 
      }));
    }
  }, []);

  // 🔥 NOUVEAU : Système de fallback pour générer des features audio simulées
  const generateFallbackAudioFeatures = useCallback(() => {
    // Générer des features audio simulées basées sur le temps et des patterns
    const now = Date.now();
    const timeFactor = (now % 10000) / 10000; // Cycle de 10 secondes
    
    // Simuler des variations d'intensité audio
    const baseIntensity = 0.3 + 0.2 * Math.sin(timeFactor * Math.PI * 2);
    const beatFactor = Math.sin(timeFactor * Math.PI * 8) * 0.3; // 8 beats par cycle
    const randomFactor = (Math.random() - 0.5) * 0.1; // Variation aléatoire
    
    const intensity = Math.max(0, Math.min(1, baseIntensity + beatFactor + randomFactor));
    
    const audioFeatures: AudioFeatures = {
      rms: intensity * 0.15, // RMS simulé
      spectralCentroid: intensity * 0.8, // Centroïde spectral simulé
      spectralRolloff: intensity * 0.6, // Rolloff simulé
      spectralFlux: intensity * 0.4, // Flux spectral simulé
      spectralSpread: intensity * 0.3, // Spread simulé
    };
    
    setResult(prev => ({
      ...prev,
      audioFeatures,
      isAnalyzing: true
    }));

    // Dispatcher l'événement pour les autres composants
    window.dispatchEvent(new CustomEvent('audioFeatures', { detail: audioFeatures }));
  }, []);

  // 🔥 CORRECTION : Analyser le vrai flux audio connecté à l'AudioContext
  const analyzeSoundCloudAudio = useCallback(async (audioElement: HTMLAudioElement) => {
    const ctx = audioContextRef.current;
    if (!ctx) {
      console.warn('❌ AudioContext non disponible');
      return;
    }

    if (!Meyda) {
      console.warn('❌ Meyda non disponible');
      return;
    }

    try {
      // 🔥 CRUCIAL : Créer la source depuis l'élément audio connecté
      const source = ctx.createMediaElementSource(audioElement);
      
      // 🔥 CRUCIAL : Créer l'analyseur Meyda avec le vrai flux
      const analyzer = Meyda.createMeydaAnalyzer({
        audioContext: ctx,
        source,
        bufferSize: 512, // Buffer plus petit pour plus de réactivité
        featureExtractors: ["rms", "spectralCentroid", "spectralFlux"],
        callback: (features) => {
          if (!features) return;
          
          // 🔥 CRUCIAL : Logs pour vérifier que Meyda reçoit des données
          console.log("🎧 Frame:", features.rms?.toFixed(3), features.spectralFlux?.toFixed(3));
          
          const audioFeatures: AudioFeatures = {
            rms: features.rms || 0,
            spectralCentroid: features.spectralCentroid || 0,
            spectralRolloff: 0,
            spectralFlux: features.spectralFlux || 0,
            spectralSpread: 0,
          };
          
          setResult(prev => ({
            ...prev,
            audioFeatures,
            isAnalyzing: true
          }));

          // Dispatcher l'événement pour les autres composants
          window.dispatchEvent(new CustomEvent('audioFeatures', { detail: audioFeatures }));
        },
      });

      analyzer.start();
      meydaAnalyzerRef.current = analyzer;
      console.log('✅ Meyda démarré sur le vrai flux audio');
      
    } catch (error) {
      console.error('❌ Erreur analyse audio:', error);
    }
  }, []);

  // 🔥 SOLUTION STABLE CONTEXT7 : Heartbeat pour éviter les suspensions automatiques
  useEffect(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    const heartbeat = setInterval(async () => {
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
          console.log('🔄 AudioContext heartbeat → resumed');
        } catch (error) {
          console.warn('⚠️ Échec heartbeat AudioContext:', error);
        }
      }
    }, 3000);

    return () => clearInterval(heartbeat);
  }, []);

  // 🔥 NOUVEAU : Surveiller les erreurs Meyda et désactiver si nécessaire
  useEffect(() => {
    if (meydaErrorCount >= maxMeydaErrors && !meydaDisabled) {
      console.warn(`⚠️ Meyda désactivée après ${maxMeydaErrors} erreurs consécutives`);
      setMeydaDisabled(true);
      
      // Arrêter l'analyseur Meyda actuel
      if (meydaAnalyzerRef.current) {
        try {
          meydaAnalyzerRef.current.stop();
          meydaAnalyzerRef.current = null;
        } catch (error) {
          console.warn('Erreur arrêt analyseur Meyda:', error);
        }
      }
      
      // Démarrer le système de fallback
      const fallbackInterval = setInterval(generateFallbackAudioFeatures, 200);
      
      return () => clearInterval(fallbackInterval);
    }
  }, [meydaErrorCount, maxMeydaErrors, meydaDisabled, generateFallbackAudioFeatures]);

  // Nettoyer les ressources
  const cleanup = useCallback(() => {
    if (meydaAnalyzerRef.current) {
      meydaAnalyzerRef.current.stop();
      meydaAnalyzerRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Cleanup au démontage
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ...result,
    analyzeSoundCloudAudio,
    analyzeBPM,
    cleanup,
    resumeAudioContext, // Exposer la fonction de reprise pour usage externe
    audioContextRef, // Exposer la référence pour surveillance externe
    meydaDisabled, // Exposer l'état de Meyda pour debugging
    meydaErrorCount // Exposer le compteur d'erreurs pour debugging
  };
}
