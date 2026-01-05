import { AnalysisConfig } from '../types/audio-analysis';

export const ANALYSIS_CONFIG: AnalysisConfig = {
  pollingRate: 50, // 50ms = 20 FPS pour la synchronisation
  updateFrequency: 6, // Vérifier toutes les 6 heures
  analysisDepth: 'detailed',
  maxConcurrentDownloads: 2, // Limiter pour éviter rate limits
  beatDetectionThreshold: 0.3, // Seuil pour détecter les beats
};

export const SOUNDCLOUD_CONFIG = {
  // SoundCloud User ID - À configurer selon votre compte
  USER_ID: process.env.SOUNDCLOUD_USER_ID || 'savageblockpartys',
  API_BASE_URL: 'https://api-v2.soundcloud.com',
  CLIENT_ID: process.env.SOUNDCLOUD_CLIENT_ID || '', // Optionnel si nécessaire
};

export const PATHS = {
  ANALYSIS_DIR: process.env.ANALYSIS_DIR || './public/analysis',
  INDEX_FILE: './public/analysis/index.json',
  MAX_FILE_SIZE_MB: 100, // Limite de taille pour les fichiers audio
};
