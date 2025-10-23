"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

declare global {
	interface Window {
		SC: any;
	}
}

export default function SoundCloudPlayer() {
	const pathname = usePathname();
	const isHome = pathname === "/";
	const isAgenda = pathname?.startsWith("/agenda");
	const waveformColor = isHome ? "bg-yellow-400" : (isAgenda ? "bg-black" : "bg-yellow-400");
	const waveformColorFaded = isHome ? "bg-yellow-400/30" : (isAgenda ? "bg-black/30" : "bg-yellow-400/30");
	const playerColor = isHome ? "text-yellow-400" : (isAgenda ? "text-black" : "text-yellow-400");
	const playerBgColor = isHome ? "bg-yellow-400" : (isAgenda ? "bg-black" : "bg-yellow-400");
	
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [trackTitle, setTrackTitle] = useState<string>("Savage Block Party");
	const [artistName, setArtistName] = useState<string>("Latest tracks");
	const [artworkUrl, setArtworkUrl] = useState<string>("/home/images/logo_orange.png");
	const [permalinkUrl, setPermalinkUrl] = useState<string>("https://soundcloud.com/savageblockpartys");
	const [waveformImageUrl, setWaveformImageUrl] = useState<string>("");
	const [waveformSamples, setWaveformSamples] = useState<number[] | null>(null);
	const [durationMs, setDurationMs] = useState<number>(0);
	const waveformRef = useRef<HTMLDivElement | null>(null);
	const [barCount, setBarCount] = useState<number>(300);
	const [progress, setProgress] = useState<number>(0);
	const [isMounted, setIsMounted] = useState(false);
	const [isPlayerExpanded, setIsPlayerExpanded] = useState(true);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const widgetRef = useRef<any>(null);
	const [soundcloudUrl, setSoundcloudUrl] = useState<string>("");
	const [hasInitializedRandomTrack, setHasInitializedRandomTrack] = useState(false);

	// Générer l'URL SoundCloud avec paramètre aléatoire côté client seulement
	useEffect(() => {
		// URL de base pour la playlist Savage Block Party
		const baseUrl = `https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/savageblockpartys&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`;
		setSoundcloudUrl(baseUrl);
	}, []);

	// Fonction utilitaire pour charger la waveform
	const loadWaveform = useCallback((waveformUrl: string, context: string = '') => {
		console.log(`🌊 ${context}Récupération waveform:`, waveformUrl);
		if (waveformUrl.endsWith('.json')) {
			fetch(waveformUrl)
				.then((r) => {
					if (!r.ok) throw new Error(`HTTP ${r.status}`);
					return r.json();
				})
				.then((json) => {
					const samples: number[] = json?.samples || json?.data || [];
					if (samples.length > 0) {
						console.log(`✅ ${context}Waveform samples chargés:`, samples.length);
						setWaveformSamples(samples);
						setWaveformImageUrl("");
					} else {
						console.log(`⚠️ ${context}Aucun sample trouvé dans le JSON`);
						setWaveformSamples(null);
						setWaveformImageUrl("");
					}
				})
				.catch((error) => {
					console.log(`❌ ${context}Erreur chargement waveform JSON:`, error);
					setWaveformSamples(null);
					setWaveformImageUrl("");
				});
		} else {
			console.log(`✅ ${context}Waveform image URL:`, waveformUrl);
			setWaveformSamples(null);
			setWaveformImageUrl(waveformUrl);
		}
	}, []);

	// Éviter l'erreur d'hydratation
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Écouter l'état du menu
	useEffect(() => {
		const handleMenuToggle = (event: CustomEvent) => {
			const { isOpen } = event.detail;
			setIsMenuOpen(isOpen);
		};

		window.addEventListener('menuToggle', handleMenuToggle as EventListener);
		return () => {
			window.removeEventListener('menuToggle', handleMenuToggle as EventListener);
		};
	}, []);

	// Réduire le player sur les autres pages que la home
	useEffect(() => {
		const newExpanded = pathname === "/";
		console.log('📍 Changement de page:', {
			pathname,
			newExpanded,
			currentExpanded: isPlayerExpanded,
			willUpdate: newExpanded !== isPlayerExpanded,
			timestamp: new Date().toISOString()
		});
		// Toujours réduire le player sur les pages non-home
		if (pathname !== "/") {
			setIsPlayerExpanded(false);
		} else {
			setIsPlayerExpanded(true);
		}
	}, [pathname]);

	// Réinitialiser le widget quand l'état change
	useEffect(() => {
		if (window.SC && widgetRef.current) {
			// Vérifier que le widget est toujours valide
			try {
				widgetRef.current.isPaused((paused: boolean) => {
					setIsPlaying(!paused);
				});
			} catch (error) {
				console.log('Widget SoundCloud perdu, réinitialisation...');
				// Réinitialiser le widget
				const iframe = document.getElementById('soundcloud-widget') as HTMLIFrameElement;
				if (iframe) {
					widgetRef.current = window.SC.Widget(iframe);
					// Les événements seront réinitialisés automatiquement
				}
			}
		}
	}, [isPlayerExpanded]);
	// Vérifier périodiquement l'état du widget pour maintenir la synchronisation
	useEffect(() => {
		const interval = setInterval(() => {
			if (widgetRef.current && window.SC) {
				try {
					widgetRef.current.isPaused((paused: boolean) => {
						const newIsPlaying = !paused;
						setIsPlaying(prev => {
							if (prev !== newIsPlaying) {
								return newIsPlaying;
							}
							return prev;
						});
					});
					
					// Vérifier périodiquement les infos du track
					widgetRef.current.getCurrentSound((sound: any) => {
						if (sound && sound.title && sound.title !== trackTitle) {
							console.log('🔄 Mise à jour périodique des infos:', sound.title);
							setTrackTitle(sound.title);
							setArtistName(sound.user?.username || "Latest tracks");
							const art = (sound.artwork_url || sound.user?.avatar_url || "/home/images/logo_orange.png") as string;
							setArtworkUrl(art.replace("-large", "-t200x200"));
							
							// Vérifier aussi la waveform
							const wf: string | undefined = sound.waveform_url || sound.visual_waveform_url;
							if (wf && wf !== waveformImageUrl) {
								loadWaveform(wf, 'Périodique ');
							}
						}
					});
				} catch (error) {
					console.log('❌ Erreur polling:', error);
				}
			}
		}, 3000); // Vérifier toutes les 3 secondes

		return () => clearInterval(interval);
	}, [trackTitle]);

	// Charger l'API SoundCloud et initialiser le widget
	useEffect(() => {
		const updateFromCurrentSound = () => {
			try {
				widgetRef.current.getCurrentSound((sound: any) => {
					if (!sound) {
						console.log('⚠️ Aucun son actuel, récupération des sons...');
						// Si pas de son actuel, récupérer la liste des sons
						widgetRef.current.getSounds((sounds: any[]) => {
							if (sounds && sounds.length > 0) {
								const first = sounds[0];
								setTrackTitle(first.title || "Savage Block Party");
								setArtistName(first.user?.username || "Latest tracks");
								const art = (first.artwork_url || first.user?.avatar_url || "/home/images/logo_orange.png") as string;
								setArtworkUrl(art.replace("-large", "-t200x200"));
								setPermalinkUrl(first.permalink_url || "https://soundcloud.com/savageblockpartys");
								const wf0: string | undefined = first.waveform_url || first.visual_waveform_url;
								if (wf0) {
									loadWaveform(wf0, 'Fallback ');
								}
								if (typeof first.duration === 'number') setDurationMs(first.duration);
							}
						});
						return;
					}
					
					console.log('🎵 Mise à jour des infos:', sound.title);
					setTrackTitle(sound.title || "Savage Block Party");
					setArtistName(sound.user?.username || "Latest tracks");
					const art = (sound.artwork_url || sound.user?.avatar_url || "/home/images/logo_orange.png") as string;
					setArtworkUrl(art.replace("-large", "-t200x200"));
					setPermalinkUrl(sound.permalink_url || "https://soundcloud.com/savageblockpartys");
					const wf: string | undefined = sound.waveform_url || sound.visual_waveform_url;
					if (wf) {
						loadWaveform(wf, 'Current ');
					} else {
						console.log('⚠️ Aucune waveform disponible');
						setWaveformSamples(null);
						setWaveformImageUrl("");
					}
					try { widgetRef.current.getDuration((ms: number) => setDurationMs(ms || 0)); } catch {}
				});
			} catch (error) {
				console.log('❌ Erreur updateFromCurrentSound:', error);
			}
		};

		const setupWidgetEvents = () => {
			if (!widgetRef.current) return;
			
			widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
				try {
					widgetRef.current.getSounds((sounds: any[]) => {
						if (sounds && sounds.length > 0) {
							// Sélectionner un son aléatoire seulement lors du premier chargement
							if (!hasInitializedRandomTrack) {
								const randomIndex = Math.floor(Math.random() * sounds.length);
								const randomSound = sounds[randomIndex];
								console.log(`🎲 Son sélectionné aléatoirement (premier chargement): ${randomIndex + 1}/${sounds.length} - ${randomSound.title}`);
								
								setTrackTitle(randomSound.title || "");
								setArtistName(randomSound.user?.username || "");
								const art = (randomSound.artwork_url || randomSound.user?.avatar_url || "/home/images/logo_orange.png") as string;
								setArtworkUrl(art.replace("-large", "-t200x200"));
								setPermalinkUrl(randomSound.permalink_url || "https://soundcloud.com/savageblockpartys");
								const wf0: string | undefined = randomSound.waveform_url || randomSound.visual_waveform_url;
								if (wf0) {
									loadWaveform(wf0, 'READY ');
								}
								if (typeof randomSound.duration === 'number') setDurationMs(randomSound.duration);
								
								// Aller au son sélectionné aléatoirement
								try {
									widgetRef.current.skip(randomIndex);
								} catch (error) {
									console.log('Erreur skip vers son aléatoire:', error);
								}
								
								// Marquer comme initialisé pour éviter les changements lors de navigation
								setHasInitializedRandomTrack(true);
							} else {
								// Navigation normale - utiliser le premier son ou le son actuel
								const first = sounds[0];
								setTrackTitle(first.title || "");
								setArtistName(first.user?.username || "");
								const art = (first.artwork_url || first.user?.avatar_url || "/home/images/logo_orange.png") as string;
								setArtworkUrl(art.replace("-large", "-t200x200"));
								setPermalinkUrl(first.permalink_url || "https://soundcloud.com/savageblockpartys");
								const wf0: string | undefined = first.waveform_url || first.visual_waveform_url;
								if (wf0) {
									loadWaveform(wf0, 'READY ');
								}
								if (typeof first.duration === 'number') setDurationMs(first.duration);
								console.log(`🎵 Navigation normale - son actuel: ${first.title}`);
							}
						}
					});
				} catch {}

				updateFromCurrentSound();
				widgetRef.current.isPaused((paused: boolean) => setIsPlaying(!paused));
				try { widgetRef.current.getDuration((ms: number) => setDurationMs(ms || 0)); } catch {}
				widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
					setIsPlaying(true);
					updateFromCurrentSound();
				});
				widgetRef.current.bind(window.SC.Widget.Events.PAUSE, () => {
					setIsPlaying(false);
				});
				widgetRef.current.bind(window.SC.Widget.Events.PLAY_PROGRESS, (e: any) => {
					if (typeof e?.relativePosition === 'number') setProgress(e.relativePosition);
				});
				widgetRef.current.bind(window.SC.Widget.Events.SEEK, (e: any) => {
					if (typeof e?.relativePosition === 'number') setProgress(e.relativePosition);
					try { widgetRef.current.getDuration((ms: number) => setDurationMs(ms || 0)); } catch {}
				});
				widgetRef.current.bind(window.SC.Widget.Events.FINISH, () => {
					setIsPlaying(false);
					setProgress(0);
				});
			});
		};

		const loadSoundCloudAPI = () => {
			if (window.SC) {
				initializeWidget();
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://w.soundcloud.com/player/api.js';
			script.onload = () => {
				initializeWidget();
			};
			document.head.appendChild(script);
		};

		const initializeWidget = () => {
			const iframe = document.getElementById('soundcloud-widget') as HTMLIFrameElement;
			if (iframe && window.SC) {
				widgetRef.current = window.SC.Widget(iframe);
				setupWidgetEvents();
			}
		};

		loadSoundCloudAPI();
	}, [pathname]);

	// Ajuster dynamiquement le nombre de barres pour occuper toute la largeur
	useEffect(() => {
		if (pathname !== "/") return;
		if (!waveformRef.current) return;
		const element = waveformRef.current;
		const resizeObserver = new ResizeObserver((entries) => {
			const width = entries[0]?.contentRect?.width || 0;
			const count = Math.max(60, Math.floor(width / 3));
			setBarCount(count);
		});
		resizeObserver.observe(element);
		return () => resizeObserver.disconnect();
	}, [pathname]);

	const handlePlayPause = useCallback(() => {
		// Vérifier que le widget est prêt et initialisé
		if (!widgetRef.current || !window.SC) {
			console.log('Widget SoundCloud pas encore prêt');
			return;
		}
		
		try {
			// Vérifier que le widget est bien connecté
			widgetRef.current.isPaused((paused: boolean) => {
				if (widgetRef.current) {
					try {
						if (paused) {
							widgetRef.current.play();
						} else {
							widgetRef.current.pause();
						}
					} catch (error) {
						console.log('Erreur lors du play/pause:', error);
						// Réessayer après un court délai
						setTimeout(() => {
							if (widgetRef.current) {
								try {
									if (paused) {
										widgetRef.current.play();
									} else {
										widgetRef.current.pause();
									}
								} catch (retryError) {
									console.log('Erreur lors du retry:', retryError);
								}
							}
						}, 100);
					}
				}
			});
		} catch (error) {
			console.log('Erreur lors de la vérification du statut:', error);
		}
	}, []);

	const handleMuteToggle = useCallback(() => {
		// Vérifier que le widget est prêt et initialisé
		if (!widgetRef.current || !window.SC) {
			console.log('Widget SoundCloud pas encore prêt pour mute');
			return;
		}
		
		try {
			if (isMuted) {
				widgetRef.current.setVolume(100);
				setIsMuted(false);
			} else {
				widgetRef.current.setVolume(0);
				setIsMuted(true);
			}
		} catch (error) {
			console.log('Erreur lors du mute toggle:', error);
			// Réessayer après un court délai
			setTimeout(() => {
				if (widgetRef.current) {
					try {
						if (isMuted) {
							widgetRef.current.setVolume(100);
							setIsMuted(false);
						} else {
							widgetRef.current.setVolume(0);
							setIsMuted(true);
						}
					} catch (retryError) {
						console.log('Erreur lors du retry mute:', retryError);
					}
				}
			}, 100);
		}
	}, [isMuted]);

	function AutoScrollText({ text, className }: { text: string; className?: string }) {
		const containerRef = useRef<HTMLDivElement>(null);
		const [shouldScroll, setShouldScroll] = useState(false);

		useEffect(() => {
			const el = containerRef.current;
			if (!el) return;
			const check = () => setShouldScroll(el.scrollWidth > el.clientWidth);
			check();
			const ro = new ResizeObserver(check);
			ro.observe(el);
			return () => ro.disconnect();
		}, []);

		return (
			<div ref={containerRef} className={["overflow-hidden", "min-w-0", className].filter(Boolean).join(" ")}> 
				{shouldScroll ? (
					<div className="whitespace-nowrap flex gap-8 animate-marquee">
						<span>{text}</span>
						<span aria-hidden>{text}</span>
					</div>
				) : (
					<div className="whitespace-nowrap">{text}</div>
				)}
				<style jsx>{`
					@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
					.animate-marquee { animation: marquee 12s linear infinite; }
				`}</style>
			</div>
		);
	}

	// Version compacte - toujours visible (stabilisée)
	const CompactPlayer = useCallback(({ isMenuOpen }: { isMenuOpen: boolean }) => {
		// console.log('🔍 CompactPlayer rendu:', {
		// 	isPlayerExpanded,
		// 	timestamp: new Date().toISOString(),
		// 	stackTrace: new Error().stack?.split('\n').slice(1, 4)
		// });
		return (
		<div className="fixed left-6 top-[50%] z-[10002] flex items-center gap-4" style={{ transform: "translateY(-50%)", willChange: "transform" }}>
			{/* Image SoundCloud en vignette */}
			<div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
				<img 
					src={artworkUrl} 
					alt={trackTitle || "Track artwork"} 
					className="w-full h-full object-cover"
				/>
			</div>
			
			{/* Conteneur avec titre/artiste et boutons */}
			<div className="flex flex-col gap-2 h-20">
				{/* Titre et artiste */}
				<div className="w-64">
					<div className={`font-title text-sm leading-tight truncate ${isHome ? 'text-yellow-400' : 'text-cyan-400'}`}>
						{trackTitle || "Savage Block Party"}
					</div>
					<AutoScrollText 
						text={artistName || "Latest tracks"} 
						className={`font-text text-xs mt-1 ${isHome ? 'text-yellow-400/80' : 'text-cyan-400/80'}`}
					/>
				</div>
				
				{/* Conteneur des boutons avec fond cyan sur agenda */}
				<div className={`flex items-center gap-4 ${isAgenda ? 'player-compact-agenda animate-in' : ''}`}>
				{/* Bouton mute */}
				<button 
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						console.log('🎵 Bouton mute cliqué:', {
							isMuted,
							timestamp: new Date().toISOString(),
							event: e.type,
							target: e.target
						});
						handleMuteToggle();
					}}
					className="w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
					title={isMuted ? "Activer le son" : "Couper le son"}
				>
					{isMuted ? (
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={playerColor}>
							<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
						</svg>
					) : (
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={playerColor}>
							<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
						</svg>
					)}
				</button>
			
				{/* Boutons selon la page */}
				{!isMenuOpen && (
					<>
						{/* Bouton play - seulement sur les pages non-home */}
						{!isHome && (
							<button 
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handlePlayPause();
								}}
								className="w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
								title={isPlaying ? "Pause" : "Play"}
							>
								{isPlaying ? (
									<div className="flex gap-0.5">
										<div className={`w-1 h-4 ${playerBgColor}`}></div>
										<div className={`w-1 h-4 ${playerBgColor}`}></div>
									</div>
								) : (
									<div className={`w-0 h-0 border-l-[8px] ${isAgenda ? 'border-l-black' : 'border-l-yellow-400'} border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-0.5`}></div>
								)}
							</button>
						)}
						
						{/* Bouton skip - seulement sur les pages non-home */}
						{!isHome && (
							<button 
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									try { widgetRef.current?.next(); } catch {}
								}}
								className="w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
								title="Suivant"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={playerColor}>
									<path d="M7 6l7 6-7 6V6zm9 0h2v12h-2V6z" />
								</svg>
							</button>
						)}
						
						{/* Bouton expansion - seulement sur la page home */}
						{isHome && (
							<button 
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									console.log('🔄 Bouton expansion cliqué:', {
										currentExpanded: isPlayerExpanded,
										newExpanded: !isPlayerExpanded,
										timestamp: new Date().toISOString(),
										event: e.type,
										target: e.target
									});
									setIsPlayerExpanded(!isPlayerExpanded);
								}}
								className={`w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity relative z-[10001] cursor-pointer ${
									isPlayerExpanded 
										? `${playerBgColor} border ${playerBgColor} rounded-l-lg` 
										: 'rounded-r-lg'
								}`}
								title={isPlayerExpanded ? "Masquer le player" : "Révéler le player"}
								style={{ pointerEvents: 'auto' }}
							>
								<svg 
									width="16" 
									height="16" 
									viewBox="0 0 24 24" 
									fill="currentColor" 
									className={isPlayerExpanded ? (isAgenda ? "text-white" : "text-black") : playerColor}
								>
									{isPlayerExpanded ? (
										<path d="M15 18l-6-6 6-6"/>
									) : (
										<path d="M9 6l6 6-6 6"/>
									)}
								</svg>
							</button>
						)}
					</>
				)}
				</div>
			</div>
		</div>
		);
	}, [isPlayerExpanded, artworkUrl, trackTitle, artistName, isMuted, handleMuteToggle, setIsPlayerExpanded, isMenuOpen, isHome, playerBgColor, playerColor, isAgenda, isPlaying, handlePlayPause]);


	// Si le player est réduit OU si le menu est ouvert, afficher la version compacte
	if (!isPlayerExpanded || isMenuOpen) {
		return (
			<>
				{/* Widget SoundCloud toujours actif */}
				{soundcloudUrl && (
					<iframe
						id="soundcloud-widget"
						width="0"
						height="0"
						tabIndex={-1}
						scrolling="no"
						frameBorder="0"
						title="Savage Block Party SoundCloud Player"
						allow="autoplay; encrypted-media"
						src={soundcloudUrl}
						style={{
							position: "fixed",
							width: 0,
							height: 0,
							opacity: 0,
							visibility: "hidden",
							pointerEvents: "none",
							zIndex: -1,
						}}
					/>
				)}
				
				{/* Waveform toujours visible */}
				{isMounted && createPortal(
					<div
						ref={waveformRef}
						className="w-full h-24 select-none cursor-pointer bg-transparent relative z-[10001]"
					onClick={(e) => {
						console.log('🎯 Clic sur waveform (compact):', {
							hasRef: !!waveformRef.current,
							hasWidget: !!widgetRef.current,
							clientX: e.clientX,
							timestamp: new Date().toISOString()
						});
						if (!waveformRef.current || !widgetRef.current) return;
						const rect = waveformRef.current.getBoundingClientRect();
						const x = e.clientX - rect.left;
						const rel = Math.max(0, Math.min(1, x / rect.width));
						console.log('📍 Position calculée (compact):', { x, rel, width: rect.width });
						try {
							widgetRef.current.getDuration((ms: number) => {
								const targetMs = (ms || durationMs || 0) * rel;
								console.log('⏰ Seek vers (compact):', { targetMs, durationMs: ms || durationMs });
								if (targetMs > 0) widgetRef.current.seekTo(targetMs);
							});
						} catch (error) {
							console.log('❌ Erreur seek (compact):', error);
							if (durationMs > 0) widgetRef.current.seekTo(durationMs * rel);
						}
					}}
					>
						{waveformSamples && waveformSamples.length > 0 ? (
							<div
								className="h-full w-full items-end"
								style={{ display: "grid", gridTemplateColumns: `repeat(${barCount}, minmax(0, 1fr))`, columnGap: 1 }}
							>
								{Array.from({ length: barCount }).map((_, i) => {
									const sampleIndex = Math.floor(((barCount - 1 - i) / Math.max(1, barCount - 1)) * (waveformSamples.length - 1));
									const v = waveformSamples[sampleIndex] ?? 0;
									const h = Math.max(1, Math.round((v / 255) * 80));
									const played = i / Math.max(1, barCount) <= progress;
									return (
										<div key={i} style={{ height: h, width: '2px' }} className={played ? waveformColor : waveformColorFaded} />
									);
								})}
							</div>
						) : waveformImageUrl ? (
							<div className="relative h-full w-full overflow-hidden" style={{ transform: 'scaleY(-1)' }}>
							<img src={waveformImageUrl} alt="waveform" className="w-full h-full object-cover opacity-20" />
								<div className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}>
								<img src={waveformImageUrl} alt="waveform-progress" className="w-full h-full object-cover opacity-80" />
								</div>
							</div>
						) : (
						<div className="flex items-end gap-[0.5px] h-full w-full">
							{Array.from({ length: barCount }).map((_, i) => {
								const sin = Math.sin((i / Math.max(1, barCount)) * Math.PI);
								const h = Math.max(1, Math.round(sin * 80));
								return <div key={i} style={{ height: h, width: '1px' }} className={waveformColorFaded} />;
							})}
							</div>
						)}
					</div>,
					document.getElementById('sbp-footer-waveform') as HTMLElement
				)}
				
				<CompactPlayer isMenuOpen={isMenuOpen} />
			</>
		);
	}

	return (
		<>
			{/* Widget SoundCloud toujours actif */}
			{soundcloudUrl && (
				<iframe
					id="soundcloud-widget"
					width="0"
					height="0"
					tabIndex={-1}
					scrolling="no"
					frameBorder="0"
					title="Savage Block Party SoundCloud Player"
					allow="autoplay; encrypted-media"
					src={soundcloudUrl}
					style={{
						position: "fixed",
						width: 0,
						height: 0,
						opacity: 0,
						visibility: "hidden",
						pointerEvents: "none",
						zIndex: -1,
					}}
				/>
			)}
			
			{/* Waveform toujours visible */}
			{isMounted && createPortal(
				<div
					ref={waveformRef}
					className="w-full h-24 select-none cursor-pointer bg-transparent relative z-[10001]"
					onClick={(e) => {
						console.log('🎯 Clic sur waveform:', {
							hasRef: !!waveformRef.current,
							hasWidget: !!widgetRef.current,
							clientX: e.clientX,
							timestamp: new Date().toISOString()
						});
						if (!waveformRef.current || !widgetRef.current) return;
						const rect = waveformRef.current.getBoundingClientRect();
						const x = e.clientX - rect.left;
						const rel = Math.max(0, Math.min(1, x / rect.width));
						console.log('📍 Position calculée:', { x, rel, width: rect.width });
						try {
							widgetRef.current.getDuration((ms: number) => {
								const targetMs = (ms || durationMs || 0) * rel;
								console.log('⏰ Seek vers:', { targetMs, durationMs: ms || durationMs });
								if (targetMs > 0) widgetRef.current.seekTo(targetMs);
							});
						} catch (error) {
							console.log('❌ Erreur seek:', error);
							if (durationMs > 0) widgetRef.current.seekTo(durationMs * rel);
						}
					}}
				>
					{waveformSamples && waveformSamples.length > 0 ? (
						<div
							className="h-full w-full items-end"
							style={{ display: "grid", gridTemplateColumns: `repeat(${barCount}, minmax(0, 1fr))`, columnGap: 1 }}
						>
							{Array.from({ length: barCount }).map((_, i) => {
								const sampleIndex = Math.floor(((barCount - 1 - i) / Math.max(1, barCount - 1)) * (waveformSamples.length - 1));
								const v = waveformSamples[sampleIndex] ?? 0;
								const h = Math.max(1, Math.round((v / 255) * 80));
								const played = i / Math.max(1, barCount) <= progress;
								return (
									<div key={i} style={{ height: h, width: '2px' }} className={played ? waveformColor : waveformColorFaded} />
								);
							})}
						</div>
					) : waveformImageUrl ? (
						<div className="relative h-full w-full overflow-hidden" style={{ transform: 'scaleY(-1)' }}>
						<img src={waveformImageUrl} alt="waveform" className="w-full h-full object-cover opacity-20" />
							<div className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}>
							<img src={waveformImageUrl} alt="waveform-progress" className="w-full h-full object-cover opacity-80" />
							</div>
						</div>
					) : (
					<div className="flex items-end gap-[0.5px] h-full w-full">
						{Array.from({ length: barCount }).map((_, i) => {
							const sin = Math.sin((i / Math.max(1, barCount)) * Math.PI);
							const h = Math.max(1, Math.round(sin * 80));
							return <div key={i} style={{ height: h, width: '1px' }} className={waveformColorFaded} />;
						})}
						</div>
					)}
				</div>,
				document.getElementById('sbp-footer-waveform') as HTMLElement
			)}
			
			{/* Si le player est réduit OU si le menu est ouvert, afficher la version compacte */}
			{(!isPlayerExpanded || isMenuOpen) ? (
				<>
					<CompactPlayer isMenuOpen={isMenuOpen} />
				</>
			) : (
				<>
					{/* Play button centered */}
					<div className="fixed inset-0 z-[30] pointer-events-none">
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
							<button 
								onClick={handlePlayPause}
								className="w-40 h-40 flex items-center justify-center hover:opacity-80 transition-opacity"
							>
							{isPlaying ? (
								<div className="flex gap-1">
									<div className={`w-2 h-12 ${playerBgColor}`}></div>
									<div className={`w-2 h-12 ${playerBgColor}`}></div>
								</div>
							) : (
								<div className={`w-0 h-0 border-l-[32px] ${isAgenda ? 'border-l-black' : 'border-l-yellow-400'} border-t-[24px] border-t-transparent border-b-[24px] border-b-transparent ml-2`}></div>
							)}
							</button>
						</div>
					</div>

					{/* Title left side with mute button and reduce button (fixed) */}
					<div className={`fixed left-6 top-1/2 -translate-y-1/2 z-[25] ${playerColor} px-4 flex items-center gap-6`}>
						<div>
							<div className="font-title text-base leading-tight">{trackTitle || ""}</div>
							<AutoScrollText text={artistName || ""} className={`font-text text-sm ${playerColor}/80 mt-0.5`} />
						</div>
						{/* Mute button */}
						<button 
							onClick={handleMuteToggle}
							className="w-14 h-14 flex items-center justify-center hover:opacity-80 transition-opacity"
							title={isMuted ? "Activer le son" : "Couper le son"}
						>
							{isMuted ? (
								<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={playerColor}>
									<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
								</svg>
							) : (
								<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={playerColor}>
									<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
								</svg>
							)}
						</button>
						{/* Reduce button */}
						<button 
							onClick={() => setIsPlayerExpanded(false)}
							className="w-14 h-14 flex items-center justify-center hover:opacity-80 transition-opacity"
							title="Réduire le player"
						>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={playerColor}>
								<path d="M15 6l-6 6 6 6"/>
							</svg>
						</button>
					</div>

					{/* Skip button centered right */}
					<div className="fixed right-6 top-1/2 -translate-y-1/2 z-[30] flex items-center">
						<button
							onClick={() => { try { widgetRef.current?.next(); } catch {} }}
							className="w-28 h-28 flex items-center justify-center hover:opacity-80 transition-opacity"
							title="Suivant"
						>
							<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className={playerColor}>
								<path d="M7 6l7 6-7 6V6zm9 0h2v12h-2V6z" />
							</svg>
						</button>
					</div>
				</>
			)}
		</>
	);
}