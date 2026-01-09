// Types pour le système d'analyse BPM et visualisation audio

export interface TrackSegment {
  start: number; // en secondes
  end: number;
  bpm: number;
}

export interface AudioAnalysis {
  trackId: string;
  title: string;
  segments: TrackSegment[];
  beats: number[]; // positions des beats en secondes
  energy: number[]; // courbe d'énergie (0-1), échantillonnée toutes les 0.1s
  meanBpm: number;
  duration: number; // durée totale en secondes
  analyzedAt: string; // ISO timestamp
}

export interface TrackIndexEntry {
  title: string;
  bpmFile: string;
  bpmMean: number;
  duration?: number;
  analyzedAt?: string;
}

export interface AnalysisIndex {
  updated_at: string; // ISO timestamp
  tracks: Record<string, TrackIndexEntry>; // key: "soundcloud:{trackId}"
}

export interface SoundCloudTrack {
  id: number;
  title: string;
  permalink_url: string;
  stream_url?: string;
  duration: number;
  user: {
    username: string;
  };
}

export interface AnalysisConfig {
  pollingRate: number; // ms entre chaque poll de position
  updateFrequency: number; // heures entre chaque check de nouveaux tracks
  analysisDepth: 'basic' | 'detailed'; // niveau d'analyse
  maxConcurrentDownloads: number;
  beatDetectionThreshold: number; // 0-1
}
