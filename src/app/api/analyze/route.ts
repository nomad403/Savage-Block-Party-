import { NextRequest, NextResponse } from 'next/server';
import { fetchAllTracks, findNewTracks } from '@/lib/soundcloud/fetcher';
import { analyzeTrack, loadIndex } from '@/lib/analyzer';
import { SOUNDCLOUD_CONFIG, ANALYSIS_CONFIG, PATHS } from '@/lib/config/analysis.config';

/**
 * API Route pour analyser les nouveaux tracks SoundCloud
 * 
 * GET /api/analyze?force=true - Force l'analyse même si le track existe déjà
 * GET /api/analyze - Analyse uniquement les nouveaux tracks
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';

    console.log('🎵 Démarrage de l\'analyse des tracks SoundCloud...');

    // 1. Charger l'index existant
    const index = loadIndex();
    console.log(`ℹ️ Index actuel: ${index ? Object.keys(index.tracks).length : 0} tracks`);

    // 2. Récupérer tous les tracks SoundCloud
    const allTracks = await fetchAllTracks(SOUNDCLOUD_CONFIG.USER_ID);
    console.log(`📊 Total tracks SoundCloud: ${allTracks.length}`);

    // 3. Identifier les nouveaux tracks (ou tous si force=true)
    const tracksToAnalyze = force ? allTracks : findNewTracks(allTracks, index);
    console.log(`🆕 Tracks à analyser: ${tracksToAnalyze.length}`);

    if (tracksToAnalyze.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun nouveau track à analyser',
        analyzed: 0,
        total: allTracks.length,
      });
    }

    // 4. Analyser les tracks (avec limitation de concurrence)
    const analyzed: string[] = [];
    const errors: Array<{ trackId: string; error: string }> = [];

    // Traiter les tracks par batch pour éviter de surcharger
    const batchSize = ANALYSIS_CONFIG.maxConcurrentDownloads;
    for (let i = 0; i < tracksToAnalyze.length; i += batchSize) {
      const batch = tracksToAnalyze.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (track) => {
          try {
            await analyzeTrack(track);
            analyzed.push(track.id.toString());
            console.log(`✅ Track analysé: ${track.title} (${analyzed.length}/${tracksToAnalyze.length})`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            errors.push({ trackId: track.id.toString(), error: errorMessage });
            console.error(`❌ Erreur pour ${track.title}:`, errorMessage);
          }
        })
      );

      // Attendre un peu entre les batches pour éviter les rate limits
      if (i + batchSize < tracksToAnalyze.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 5. Recharger l'index mis à jour
    const updatedIndex = loadIndex();

    return NextResponse.json({
      success: true,
      message: `Analyse terminée: ${analyzed.length} tracks analysés, ${errors.length} erreurs`,
      analyzed: analyzed.length,
      errors: errors.length,
      total: allTracks.length,
      newIndexCount: updatedIndex ? Object.keys(updatedIndex.tracks).length : 0,
      errors_details: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('❌ Erreur dans /api/analyze:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
