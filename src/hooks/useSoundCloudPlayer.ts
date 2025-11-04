"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
/// <reference path="../types/soundcloud.d.ts" />

interface SoundCloudTrack {
	title: string;
	user: {
		username: string;
	};
	artwork_url?: string;
	permalink_url?: string;
	waveform_url?: string;
}

interface UseSoundCloudPlayerReturn {
	// États
	isPlaying: boolean;
	isMuted: boolean;
	trackTitle: string;
	artistName: string;
	artworkUrl: string;
	permalinkUrl: string;
	isApiLoaded: boolean;
	isLoadingRandomTrack: boolean;
	progress: number;
	durationMs: number;
	
	// Widget ref pour accès externe
	widgetRef: React.MutableRefObject<any>;
	
	// Actions
	loadRandomTrack: () => Promise<void>;
	togglePlayPause: () => void;
	toggleMute: () => void;
	seek: (position: number) => void;
	
	// Callbacks pour les événements
	onTrackChanged?: (track: SoundCloudTrack) => void;
	onPlayStateChanged?: (isPlaying: boolean) => void;
	onProgressChanged?: (progress: number, duration: number) => void;
}

export function useSoundCloudPlayer(
	onTrackChanged?: (track: SoundCloudTrack) => void,
	onPlayStateChanged?: (isPlaying: boolean) => void,
	onProgressChanged?: (progress: number, duration: number) => void
): UseSoundCloudPlayerReturn {
	const widgetRef = useRef<any>(null);
	const iframeRef = useRef<HTMLIFrameElement | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [trackTitle, setTrackTitle] = useState<string>("Savage Block Party");
	const [artistName, setArtistName] = useState<string>("Latest tracks");
	const [artworkUrl, setArtworkUrl] = useState<string>("/home/images/logo_orange.png");
	const [permalinkUrl, setPermalinkUrl] = useState<string>("https://soundcloud.com/savageblockpartys");
	const [isApiLoaded, setIsApiLoaded] = useState(false);
	const [isLoadingRandomTrack, setIsLoadingRandomTrack] = useState(false);
	const [progress, setProgress] = useState(0);
	const [durationMs, setDurationMs] = useState(0);
	const lastSuccessfulOperation = useRef<number>(0);

	// Charger l'API SoundCloud
	const loadSoundCloudAPI = useCallback((): Promise<void> => {
		return new Promise((resolve, reject) => {
			if (window.SC && typeof window.SC.Widget === 'function') {
				setIsApiLoaded(true);
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://w.soundcloud.com/player/api.js';
			script.async = true;
			
			script.onload = () => {
				if (window.SC && typeof window.SC.Widget === 'function') {
					setIsApiLoaded(true);
					resolve();
				} else {
					reject(new Error('API SoundCloud chargée mais non disponible'));
				}
			};
			
			script.onerror = () => {
				reject(new Error('Erreur de chargement de l\'API SoundCloud'));
			};
			
			document.head.appendChild(script);
		});
	}, []);

	// Attendre que l'API soit prête
	const waitForSoundCloudAPI = useCallback((): Promise<void> => {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Timeout: API SoundCloud non prête'));
			}, 10000);

			const checkAPI = () => {
				if (window.SC && typeof window.SC.Widget === 'function') {
					clearTimeout(timeout);
					resolve();
				} else {
					setTimeout(checkAPI, 100);
				}
			};
			
			checkAPI();
		});
	}, []);

	// Initialiser le widget
	const initializeWidget = useCallback((): Promise<void> => {
		return new Promise((resolve, reject) => {
			try {
				const iframe = document.getElementById('soundcloud-widget') as HTMLIFrameElement;
				if (!iframe) {
					reject(new Error('Iframe SoundCloud non trouvée'));
					return;
				}

				iframeRef.current = iframe;
				widgetRef.current = window.SC.Widget(iframe);
				
				// Attendre que le widget soit prêt
				widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
					console.log('✅ Widget SoundCloud prêt');
					lastSuccessfulOperation.current = Date.now();
					resolve();
				});

				// Timeout de sécurité
				setTimeout(() => {
					if (!widgetRef.current) {
						reject(new Error('Timeout: Widget non initialisé'));
					}
				}, 10000);
			} catch (error) {
				reject(error);
			}
		});
	}, []);

	// Configurer les événements du widget
	const setupWidgetEvents = useCallback(() => {
		if (!widgetRef.current) return;

		// Événement PLAY
		widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
			setIsPlaying(true);
			onPlayStateChanged?.(true);
		});

		// Événement PAUSE
		widgetRef.current.bind(window.SC.Widget.Events.PAUSE, () => {
			setIsPlaying(false);
			onPlayStateChanged?.(false);
		});

		// Événement PLAY_PROGRESS
		widgetRef.current.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data: any) => {
			const currentPosition = data.currentPosition || 0;
			const duration = data.duration || 0;
			
			setProgress(currentPosition);
			setDurationMs(duration);
			onProgressChanged?.(currentPosition, duration);
		});

		// Événement FINISH
		widgetRef.current.bind(window.SC.Widget.Events.FINISH, () => {
			setIsPlaying(false);
			onPlayStateChanged?.(false);
			// Optionnel: charger un nouveau track aléatoire
			// loadRandomTrack();
		});

		// Événement ERROR
		widgetRef.current.bind(window.SC.Widget.Events.ERROR, (error: any) => {
			console.error('❌ Erreur SoundCloud:', error);
			window.dispatchEvent(new CustomEvent('soundcloud-widget-failed', { detail: error }));
		});
	}, [onPlayStateChanged, onProgressChanged]);

	// Charger un track aléatoire
	const loadRandomTrack = useCallback(async (): Promise<void> => {
		if (!widgetRef.current || isLoadingRandomTrack) return;

		setIsLoadingRandomTrack(true);

		try {
			// Récupérer la liste des tracks
			const sounds: any[] = await new Promise((resolve, reject) => {
				const timeout = setTimeout(() => {
					reject(new Error('Timeout récupération tracks'));
				}, 5000);

				widgetRef.current.getSounds((sounds: any[]) => {
					clearTimeout(timeout);
					resolve(sounds || []);
				});
			});

			if (sounds && sounds.length > 0) {
				// Sélectionner un track aléatoire
				const randomIndex = Math.floor(Math.random() * sounds.length);
				const randomSound = sounds[randomIndex];

				console.log(`🎲 Track sélectionné: ${randomSound.title}`);

				// Aller au track sélectionné
				widgetRef.current.skip(randomIndex);

				// Mettre à jour les informations
				const trackInfo: SoundCloudTrack = {
					title: randomSound.title || "Savage Block Party",
					user: {
						username: randomSound.user?.username || "Latest tracks"
					},
					artwork_url: randomSound.artwork_url,
					permalink_url: randomSound.permalink_url,
					waveform_url: randomSound.waveform_url
				};

				setTrackTitle(trackInfo.title);
				setArtistName(trackInfo.user.username);
				setArtworkUrl((trackInfo.artwork_url || "/home/images/logo_orange.png").replace("-large", "-t200x200"));
				setPermalinkUrl(trackInfo.permalink_url || "https://soundcloud.com/savageblockpartys");

				// Notifier le changement de track
				onTrackChanged?.(trackInfo);
			}
		} catch (error) {
			console.error('❌ Erreur chargement track aléatoire:', error);
		} finally {
			setIsLoadingRandomTrack(false);
		}
	}, [isLoadingRandomTrack, onTrackChanged]);

	// Toggle play/pause
	const togglePlayPause = useCallback(() => {
		if (widgetRef.current) {
			widgetRef.current.toggle();
		}
	}, []);

	// Toggle mute
	const toggleMute = useCallback(() => {
		if (widgetRef.current) {
			// Note: L'API SoundCloud ne supporte pas directement le mute
			// Cette fonctionnalité doit être gérée différemment
			setIsMuted(prev => !prev);
		}
	}, []);

	// Seek
	const seek = useCallback((position: number) => {
		if (widgetRef.current) {
			widgetRef.current.seekTo(position);
		}
	}, []);

	// Initialisation séquentielle
	useEffect(() => {
		const initialize = async () => {
			try {
				await loadSoundCloudAPI();
				await waitForSoundCloudAPI();
				await initializeWidget();
				setupWidgetEvents();
			} catch (error) {
				console.error('❌ Erreur initialisation SoundCloud:', error);
			}
		};

		initialize();
	}, [loadSoundCloudAPI, waitForSoundCloudAPI, initializeWidget, setupWidgetEvents]);

	// Gestion des erreurs réseau
	useEffect(() => {
		const handleWidgetFailure = async () => {
			// Logique de réinitialisation si nécessaire
			console.warn('⚠️ Échec widget SoundCloud');
		};

		window.addEventListener('soundcloud-widget-failed', handleWidgetFailure);
		return () => {
			window.removeEventListener('soundcloud-widget-failed', handleWidgetFailure);
		};
	}, []);

	return {
		// États
		isPlaying,
		isMuted,
		trackTitle,
		artistName,
		artworkUrl,
		permalinkUrl,
		isApiLoaded,
		isLoadingRandomTrack,
		progress,
		durationMs,
		
		// Widget ref
		widgetRef,
		
		// Actions
		loadRandomTrack,
		togglePlayPause,
		toggleMute,
		seek
	};
}
