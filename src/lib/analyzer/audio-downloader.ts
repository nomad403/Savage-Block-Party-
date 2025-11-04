import { SoundCloudTrack } from '../types/audio-analysis';
import { SOUNDCLOUD_CONFIG, PATHS } from '../config/analysis.config';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';

/**
 * Télécharge un fichier audio depuis SoundCloud
 * Utilise soundcloud-downloader si disponible, sinon fallback sur stream_url
 */
export async function downloadTrackAudio(
  track: SoundCloudTrack,
  outputPath: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Créer le répertoire si nécessaire
      const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Essayer d'utiliser soundcloud-downloader en premier
      try {
        const { download } = await import('soundcloud-downloader');
        const stream = await download(track.permalink_url);
        
        const fileStream = createWriteStream(outputPath);
        stream.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Audio téléchargé: ${track.title}`);
          resolve(outputPath);
        });

        fileStream.on('error', (err) => {
          console.error(`❌ Erreur écriture fichier: ${err.message}`);
          reject(err);
        });

        stream.on('error', (err) => {
          console.error(`❌ Erreur téléchargement: ${err.message}`);
          reject(err);
        });

        return;
      } catch (downloaderError) {
        console.warn('⚠️ soundcloud-downloader non disponible, utilisation du stream_url...');
      }

      // Fallback: utiliser stream_url directement
      if (!track.stream_url) {
        reject(new Error(`Pas de stream_url disponible pour le track ${track.id}`));
        return;
      }

      // Ajouter client_id si nécessaire
      const streamUrl = track.stream_url.includes('?') 
        ? `${track.stream_url}&client_id=${SOUNDCLOUD_CONFIG.CLIENT_ID}`
        : `${track.stream_url}?client_id=${SOUNDCLOUD_CONFIG.CLIENT_ID}`;

      const protocol = streamUrl.startsWith('https') ? https : http;
      
      protocol.get(streamUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Erreur HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const fileStream = createWriteStream(outputPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Audio téléchargé via stream_url: ${track.title}`);
          resolve(outputPath);
        });

        fileStream.on('error', (err) => {
          reject(err);
        });
      }).on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Nettoie un nom de fichier pour éviter les caractères problématiques
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100); // Limiter la longueur
}
