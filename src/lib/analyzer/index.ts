import { AudioAnalysis, SoundCloudTrack, AnalysisIndex } from '../types/audio-analysis';
import { downloadTrackAudio, sanitizeFilename } from './audio-downloader';
import { analyzeBPM } from './bpm-analyzer';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PATHS } from '../config/analysis.config';

/**
 * Analyse complète d'un track SoundCloud
 * 1. Télécharge l'audio
 * 2. Analyse BPM/beats/energy
 * 3. Sauvegarde le JSON d'analyse
 * 4. Met à jour l'index
 */
export async function analyzeTrack(track: SoundCloudTrack): Promise<AudioAnalysis> {
  const trackId = track.id.toString();
  const tempAudioPath = join(PATHS.ANALYSIS_DIR, 'temp', `${trackId}_${sanitizeFilename(track.title)}.mp3`);
  const analysisPath = join(PATHS.ANALYSIS_DIR, `${trackId}.json`);

  try {
    // Vérifier si l'analyse existe déjà
    if (existsSync(analysisPath)) {
      console.log(`ℹ️ Analyse déjà existante pour ${track.title}`);
      const existing = JSON.parse(readFileSync(analysisPath, 'utf-8')) as AudioAnalysis;
      return existing;
    }

    console.log(`🎵 Début de l'analyse pour: ${track.title}`);

    // 1. Télécharger l'audio
    await downloadTrackAudio(track, tempAudioPath);

    // 2. Analyser BPM
    const analysis = await analyzeBPM(tempAudioPath, trackId, track.title);

    // Ajouter la durée du track si disponible
    if (track.duration) {
      analysis.duration = track.duration / 1000; // Convertir ms en secondes
    }

    // 3. Sauvegarder l'analyse
    ensureAnalysisDir();
    writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log(`✅ Analyse sauvegardée: ${analysisPath}`);

    // 4. Mettre à jour l'index
    await updateIndex(track, analysis);

    // 5. Nettoyer le fichier temporaire
    try {
      const fs = await import('fs/promises');
      await fs.unlink(tempAudioPath);
    } catch (cleanupError) {
      console.warn(`⚠️ Impossible de supprimer le fichier temporaire: ${tempAudioPath}`);
    }

    return analysis;
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse du track ${track.title}:`, error);
    throw error;
  }
}

/**
 * Met à jour l'index global des analyses
 */
export async function updateIndex(track: SoundCloudTrack, analysis: AudioAnalysis): Promise<void> {
  const indexPath = PATHS.INDEX_FILE;
  
  let index: AnalysisIndex;
  
  if (existsSync(indexPath)) {
    index = JSON.parse(readFileSync(indexPath, 'utf-8')) as AnalysisIndex;
  } else {
    index = {
      updated_at: new Date().toISOString(),
      tracks: {},
    };
  }

  const trackKey = `soundcloud:${track.id}`;
  
  // Vérifier si le track existe déjà pour éviter les doublons
  if (index.tracks[trackKey]) {
    console.log(`ℹ️ Track ${trackKey} déjà dans l'index, mise à jour...`);
  }

  index.tracks[trackKey] = {
    title: track.title,
    bpmFile: `/analysis/${track.id}.json`,
    bpmMean: analysis.meanBPM,
    duration: analysis.duration,
    analyzedAt: analysis.analyzedAt,
  };

  index.updated_at = new Date().toISOString();

  ensureAnalysisDir();
  writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`✅ Index mis à jour: ${indexPath}`);
}

/**
 * Charge l'index des analyses
 */
export function loadIndex(): AnalysisIndex | null {
  const indexPath = PATHS.INDEX_FILE;
  
  if (!existsSync(indexPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(indexPath, 'utf-8')) as AnalysisIndex;
  } catch (error) {
    console.error('❌ Erreur lors du chargement de l\'index:', error);
    return null;
  }
}

/**
 * Vérifie qu'un track a déjà été analysé
 */
export function isTrackAnalyzed(trackId: number): boolean {
  const analysisPath = join(PATHS.ANALYSIS_DIR, `${trackId}.json`);
  return existsSync(analysisPath);
}

/**
 * Charge l'analyse d'un track
 */
export function loadAnalysis(trackId: number): AudioAnalysis | null {
  const analysisPath = join(PATHS.ANALYSIS_DIR, `${trackId}.json`);
  
  if (!existsSync(analysisPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(analysisPath, 'utf-8')) as AudioAnalysis;
  } catch (error) {
    console.error(`❌ Erreur lors du chargement de l'analyse pour ${trackId}:`, error);
    return null;
  }
}

/**
 * S'assure que le répertoire d'analyse existe
 */
function ensureAnalysisDir(): void {
  if (!existsSync(PATHS.ANALYSIS_DIR)) {
    mkdirSync(PATHS.ANALYSIS_DIR, { recursive: true });
  }
  
  const tempDir = join(PATHS.ANALYSIS_DIR, 'temp');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }
}
