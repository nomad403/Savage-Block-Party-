"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

// Types DMX conformes aux standards
interface DMXUniverse {
  universe: number;
  channels: number[]; // 512 canaux max par univers
}

interface DMXFixture {
  id: string;
  name: string;
  startChannel: number;
  channels: {
    dimmer: number;
    red: number;
    green: number;
    blue: number;
    white?: number;
    strobe?: number;
    pan?: number;
    tilt?: number;
  };
}

interface DMXScene {
  id: string;
  name: string;
  fixtures: DMXFixture[];
  duration: number;
  fadeTime: number;
}

interface AudioToDMXMapping {
  frequency: {
    bass: number;      // 20-250 Hz
    mid: number;       // 250-4000 Hz  
    treble: number;    // 4000-20000 Hz
  };
  intensity: number;   // RMS -> DMX intensity (0-255)
  beat: boolean;       // Beat detection -> strobe
  bpm: number;         // BPM -> tempo effects
}

export function useDMXControl() {
  // États DMX conformes aux standards
  const [dmxEnabled, setDmxEnabled] = useState(false);
  const [dmxConnection, setDmxConnection] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [dmxUniverse, setDmxUniverse] = useState<DMXUniverse>({
    universe: 1,
    channels: new Array(512).fill(0)
  });
  const [dmxFixtures, setDmxFixtures] = useState<DMXFixture[]>([]);
  const [dmxScenes, setDmxScenes] = useState<DMXScene[]>([]);
  const [audioMapping, setAudioMapping] = useState<AudioToDMXMapping>({
    frequency: { bass: 0, mid: 0, treble: 0 },
    intensity: 0,
    beat: false,
    bpm: 120
  });

  // WebSocket pour communication DMX en temps réel
  const wsRef = useRef<WebSocket | null>(null);
  const dmxIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Connexion DMX via WebSocket (standard moderne)
  const connectDMX = useCallback(async (endpoint: string = 'ws://localhost:8080/dmx') => {
    try {
      setDmxConnection('connecting');
      
      // Connexion WebSocket pour DMX en temps réel
      wsRef.current = new WebSocket(endpoint);
      
      wsRef.current.onopen = () => {
        console.log('🎛️ Connexion DMX établie');
        setDmxConnection('connected');
        setDmxEnabled(true);
        
        // Envoyer configuration initiale
        wsRef.current?.send(JSON.stringify({
          type: 'init',
          universe: dmxUniverse.universe,
          fixtures: dmxFixtures
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleDMXMessage(data);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('🎛️ Erreur WebSocket DMX:', error);
        setDmxConnection('error');
      };
      
      wsRef.current.onclose = () => {
        console.log('🎛️ Connexion DMX fermée');
        setDmxConnection('disconnected');
        setDmxEnabled(false);
      };
      
    } catch (error) {
      console.error('🎛️ Erreur connexion DMX:', error);
      setDmxConnection('error');
    }
  }, [dmxUniverse.universe, dmxFixtures]);

  // Déconnexion DMX
  const disconnectDMX = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (dmxIntervalRef.current) {
      clearInterval(dmxIntervalRef.current);
      dmxIntervalRef.current = null;
    }
    
    setDmxEnabled(false);
    setDmxConnection('disconnected');
  }, []);

  // Gestion des messages DMX
  const handleDMXMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'fixture_update':
        setDmxFixtures(prev => 
          prev.map(fixture => 
            fixture.id === data.fixtureId 
              ? { ...fixture, ...data.updates }
              : fixture
          )
        );
        break;
      case 'scene_trigger':
        triggerDMXScene(data.sceneId);
        break;
      case 'error':
        console.error('🎛️ Erreur DMX:', data.message);
        break;
    }
  }, []);

  // Mapper les données audio vers DMX (conversion fréquences -> canaux)
  const mapAudioToDMX = useCallback((audioFeatures: any) => {
    if (!dmxEnabled || !audioFeatures) return;

    const { rms, spectralCentroid, spectralFlux, bpm } = audioFeatures;
    
    // Calculer les fréquences audio
    const bass = Math.min(255, Math.max(0, (rms || 0) * 255));
    const mid = Math.min(255, Math.max(0, (spectralCentroid || 0) * 255));
    const treble = Math.min(255, Math.max(0, (spectralFlux || 0) * 255));
    
    // Mettre à jour le mapping audio
    setAudioMapping(prev => ({
      ...prev,
      frequency: { bass, mid, treble },
      intensity: Math.min(255, Math.max(0, (rms || 0) * 255)),
      beat: (spectralFlux || 0) > 0.5,
      bpm: bpm || 120
    }));

    // Appliquer aux fixtures DMX
    updateDMXFixturesFromAudio({ bass, mid, treble, intensity: bass, beat: (spectralFlux || 0) > 0.5 });
  }, [dmxEnabled]);

  // Mettre à jour les fixtures DMX basées sur l'audio
  const updateDMXFixturesFromAudio = useCallback((audioData: any) => {
    const newChannels = [...dmxUniverse.channels];
    
    dmxFixtures.forEach(fixture => {
      const { startChannel, channels } = fixture;
      
      // Mapper les fréquences aux couleurs RGB
      newChannels[startChannel + channels.red] = audioData.bass;      // Rouge = Bass
      newChannels[startChannel + channels.green] = audioData.mid;      // Vert = Mid
      newChannels[startChannel + channels.blue] = audioData.treble;   // Bleu = Treble
      newChannels[startChannel + channels.dimmer] = audioData.intensity; // Intensité générale
      
      // Effet strobe sur les beats
      if (audioData.beat && channels.strobe) {
        newChannels[startChannel + channels.strobe] = 255;
        setTimeout(() => {
          newChannels[startChannel + channels.strobe] = 0;
        }, 100);
      }
    });
    
    setDmxUniverse(prev => ({ ...prev, channels: newChannels }));
    
    // Envoyer les données DMX via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'dmx_data',
        universe: dmxUniverse.universe,
        channels: newChannels
      }));
    }
  }, [dmxUniverse, dmxFixtures]);

  // Déclencher une scène DMX
  const triggerDMXScene = useCallback((sceneId: string) => {
    const scene = dmxScenes.find(s => s.id === sceneId);
    if (!scene) return;

    console.log(`🎛️ Déclenchement scène DMX: ${scene.name}`);
    
    // Appliquer la scène avec fade
    scene.fixtures.forEach(fixture => {
      const { startChannel, channels } = fixture;
      // Implémenter le fade progressif
      // ...
    });
  }, [dmxScenes]);

  // Ajouter une fixture DMX
  const addDMXFixture = useCallback((fixture: Omit<DMXFixture, 'id'>) => {
    const newFixture: DMXFixture = {
      ...fixture,
      id: `fixture_${Date.now()}`
    };
    
    setDmxFixtures(prev => [...prev, newFixture]);
    
    // Envoyer au serveur DMX
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'add_fixture',
        fixture: newFixture
      }));
    }
  }, []);

  // Créer une scène DMX
  const createDMXScene = useCallback((scene: Omit<DMXScene, 'id'>) => {
    const newScene: DMXScene = {
      ...scene,
      id: `scene_${Date.now()}`
    };
    
    setDmxScenes(prev => [...prev, newScene]);
  }, []);

  // Écouter les événements audio pour mapping DMX
  useEffect(() => {
    const handleAudioFeatures = (event: CustomEvent) => {
      mapAudioToDMX(event.detail);
    };

    window.addEventListener('audioFeatures', handleAudioFeatures as EventListener);
    
    return () => {
      window.removeEventListener('audioFeatures', handleAudioFeatures as EventListener);
    };
  }, [mapAudioToDMX]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      disconnectDMX();
    };
  }, [disconnectDMX]);

  return {
    // États
    dmxEnabled,
    dmxConnection,
    dmxUniverse,
    dmxFixtures,
    dmxScenes,
    audioMapping,
    
    // Actions
    connectDMX,
    disconnectDMX,
    addDMXFixture,
    createDMXScene,
    triggerDMXScene,
    mapAudioToDMX,
    
    // Utilitaires
    getDMXStatus: () => ({
      enabled: dmxEnabled,
      connection: dmxConnection,
      universe: dmxUniverse.universe,
      fixturesCount: dmxFixtures.length,
      scenesCount: dmxScenes.length
    })
  };
}
