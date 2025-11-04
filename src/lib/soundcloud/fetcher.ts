import { SoundCloudTrack } from '../types/audio-analysis';
import { SOUNDCLOUD_CONFIG } from '../config/analysis.config';

/**
 * Récupère tous les tracks publics d'un utilisateur SoundCloud
 */
export async function fetchAllTracks(userId: string): Promise<SoundCloudTrack[]> {
  const allTracks: SoundCloudTrack[] = [];
  let nextHref: string | null = `${SOUNDCLOUD_CONFIG.API_BASE_URL}/users/${userId}/tracks?limit=200`;

  try {
    while (nextHref) {
      console.log(`📥 Récupération des tracks depuis: ${nextHref}`);
      
      const response: Response = await fetch(nextHref, {
        headers: {
          'Accept': 'application/json',
          // Ajouter client_id si nécessaire
          ...(SOUNDCLOUD_CONFIG.CLIENT_ID && { 'Authorization': `OAuth ${SOUNDCLOUD_CONFIG.CLIENT_ID}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // SoundCloud API peut retourner une collection ou un objet avec une propriété collection
      const tracks: SoundCloudTrack[] = Array.isArray(data) ? data : (data.collection || []);
      
      allTracks.push(...tracks);
      console.log(`✅ ${tracks.length} tracks récupérés (total: ${allTracks.length})`);

      // Vérifier s'il y a une page suivante
      nextHref = data.next_href || null;
      
      // Limiter le nombre de requêtes pour éviter les rate limits
      if (nextHref && allTracks.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Attendre 500ms entre les requêtes
      }
    }

    console.log(`✅ Total: ${allTracks.length} tracks récupérés`);
    return allTracks;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tracks:', error);
    throw error;
  }
}

/**
 * Compare les tracks SoundCloud avec l'index pour trouver les nouveaux tracks
 */
export function findNewTracks(
  soundcloudTracks: SoundCloudTrack[],
  index: { tracks: Record<string, any> } | null
): SoundCloudTrack[] {
  if (!index) {
    return soundcloudTracks; // Si pas d'index, tous les tracks sont "nouveaux"
  }

  return soundcloudTracks.filter(track => {
    const trackKey = `soundcloud:${track.id}`;
    return !index.tracks[trackKey];
  });
}
