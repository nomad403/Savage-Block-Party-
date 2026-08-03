"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePageContext } from "@/hooks/usePageContext";
import { useGlobalDynamicColors } from "@/hooks/useGlobalDynamicColors";
import { useMenuHover } from "@/hooks/useMenuHover";
import { useScrollZIndex } from "@/hooks/useScrollZIndex";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { soundCloudEvents } from "@/lib/events/app-events";
import WaveformLoadingAnimation from "./waveform-loading-animation";

/// <reference path="@/types/soundcloud" />
export default function SoundCloudPlayer() {
	// Utiliser le hook centralisé pour la détection de page
	const { isHome, isAgenda, isShop, isFamily, isPresse } = usePageContext();
	const isMobile = useIsMobile();
	
	// Utiliser useGlobalDynamicColors pour synchroniser avec le logo et les autres éléments
	const { colors: globalColors } = useGlobalDynamicColors();
	
	// Désactiver temporairement les couleurs dynamiques (/son)
	const enableDynamicColors = false;
	
	// États pour couleurs dynamiques au rythme de la musique (déclarés en premier)
	// Par défaut 'red' pour correspondre à la couleur primaire de la page home
	const [dynamicColorTheme, setDynamicColorTheme] = useState<'yellow' | 'cyan' | 'red'>('red');
	const [colorTransitionActive, setColorTransitionActive] = useState(false);
	const [lastBeatTime, setLastBeatTime] = useState(0);
	const [beatCount, setBeatCount] = useState(0);
	
	// Utiliser le hook centralisé pour le hover du menu
	const { isMenuHovered } = useMenuHover();
	// Utiliser le hook pour le z-index dynamique selon le scroll
	const { waveformZIndex } = useScrollZIndex();
	
	// Couleurs basées sur useGlobalDynamicColors (synchronisé avec logo et autres éléments)
	// LOGIQUE GLOBALE : La waveform utilise les couleurs de globalColors qui gèrent déjà le hover
	const getDynamicColors = () => {
		return {
			waveformColor: globalColors.waveformColor,
			waveformColorFaded: globalColors.waveformColorFaded,
			playerColor: globalColors.playerColor,
			playerBgColor: globalColors.playerBgColor
		};
	};

	const colors = useMemo(() => {
		const result = getDynamicColors();
		console.log('🎨 Couleurs calculées:', { 
			theme: dynamicColorTheme, 
			waveformColor: result.waveformColor,
			playerColor: result.playerColor,
			isHome,
			isMenuHovered,
			globalColors: globalColors
		});
		return result;
	}, [isHome, isAgenda, isShop, isFamily, isPresse, dynamicColorTheme, isMenuHovered, globalColors]);
	const waveformColor = colors.waveformColor;
	const waveformColorFaded = colors.waveformColorFaded;
		const playerColor = colors.playerColor;
	const playerBgColor = colors.playerBgColor;
	
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const isMutedRef = useRef(isMuted);
	const mutedDueToDocumentRef = useRef(false);
	const [trackTitle, setTrackTitle] = useState<string>("Savage Block Party");
	const [artistName, setArtistName] = useState<string>("Latest tracks");
	const [isApiLoaded, setIsApiLoaded] = useState(false);
	        const [isLoadingRandomTrack, setIsLoadingRandomTrack] = useState(false);
        const [artworkUrl, setArtworkUrl] = useState<string>("/home/images/logo_orange.png");
	const [permalinkUrl, setPermalinkUrl] = useState<string>("https://soundcloud.com/savageblockpartys");
	const [waveformImageUrl, setWaveformImageUrl] = useState<string>("");
	const [waveformSamples, setWaveformSamples] = useState<number[] | null>(null);
	const [durationMs, setDurationMs] = useState<number>(0);
const waveformRef = useRef<HTMLDivElement | null>(null);
	const [barCount, setBarCount] = useState<number>(300);
	const playPauseLockRef = useRef(false);
	const [progress, setProgress] = useState<number>(0);
	const [isMounted, setIsMounted] = useState(false);
	const [isPlayerExpanded, setIsPlayerExpanded] = useState(isHome);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isPlayerHovered, setIsPlayerHovered] = useState(false);
	const [isWaveformHovered, setIsWaveformHovered] = useState(false);
	// Expand timeline au hover : desktop uniquement
	const isTimelineExpanded = !isMobile && (isPlayerHovered || isWaveformHovered);
	const [revealRealWaveform, setRevealRealWaveform] = useState(false);
	const hasWaveformData = Boolean(
		(waveformSamples && waveformSamples.length > 0) || Boolean(waveformImageUrl)
	);
	// Mémoriser l'état désiré de lecture pour éviter un auto-play lors des réinits
	const desiredIsPlayingRef = useRef(false);
	const widgetRef = useRef<any>(null);

	useEffect(() => {
		isMutedRef.current = isMuted;
	}, [isMuted]);

	// Écouter le hover du header player pour agrandir la waveform (timeline) — desktop only
	useEffect(() => {
		if (isMobile) {
			setIsPlayerHovered(false);
			setIsWaveformHovered(false);
			return;
		}
		const handlePlayerHover = (event: Event) => {
			const customEvent = event as CustomEvent<{ isHovered: boolean }>;
			setIsPlayerHovered(Boolean(customEvent.detail?.isHovered));
		};
		window.addEventListener('soundcloud-player-hover', handlePlayerHover);
		return () => window.removeEventListener('soundcloud-player-hover', handlePlayerHover);
	}, [isMobile]);

	// Appliquer la classe body pour animer la hauteur CSS de la waveform
	useEffect(() => {
		document.body.classList.toggle('player-timeline-expanded', isTimelineExpanded);
		return () => {
			document.body.classList.remove('player-timeline-expanded');
		};
	}, [isTimelineExpanded]);

	// Revenir à l'animation de chargement si la waveform est vidée (changement de track)
	useEffect(() => {
		if (!hasWaveformData) {
			setRevealRealWaveform(false);
		}
	}, [hasWaveformData]);

	const handleWaveformOutroComplete = useCallback(() => {
		setRevealRealWaveform(true);
	}, []);
	// Mémoriser la dernière waveform chargée pour éviter les rechargements inutiles
	const lastWaveformUrlRef = useRef<string>("");
	// Flag pour ignorer le premier READY (chargement initial) et faire la sélection aléatoire directement
	const isInitialLoadRef = useRef<boolean>(true);
	// Ref pour la fonction de sélection aléatoire initiale (évite les problèmes de dépendances)
	const performInitialRandomSelectionRef = useRef<(() => Promise<void>) | null>(null);
	const initStartedRef = useRef(false);
	const setupWidgetEventsRef = useRef<() => void>(() => {});
	const lastEmittedPlayingRef = useRef<boolean | null>(null);
	const [soundcloudUrl, setSoundcloudUrl] = useState<string>("");
	// États de robustesse renforcés
	const [widgetHealth, setWidgetHealth] = useState<'healthy' | 'degraded' | 'failed'>('healthy');
	const [retryCount, setRetryCount] = useState(0);
	const [lastSuccessfulOperation, setLastSuccessfulOperation] = useState<number>(Date.now());
	const [consecutiveFailures, setConsecutiveFailures] = useState(0);
	const [isRecovering, setIsRecovering] = useState(false);
	const [recoveryAttempts, setRecoveryAttempts] = useState(0);
	const [lastReinitialization, setLastReinitialization] = useState(0);
	const maxRetries = 5; // Augmenté pour plus de robustesse
	const healthCheckInterval = 8000; // Réduit pour détecter plus rapidement
	const operationTimeout = 3000; // Réduit pour des réponses plus rapides
	const maxConsecutiveFailures = 3; // Nouveau: seuil pour déclencher la récupération
	const maxRecoveryAttempts = 3; // Nouveau: limite des tentatives de récupération
	const reinitializationCooldown = 10000; // 10 secondes entre les réinitialisations
	// Supprimé hasInitializedRandomTrack - on fait toujours la sélection aléatoire

	// Supprimé resetRandomTrackSelection - on utilise directement forceRandomSelection

	// Exposer les fonctions globalement pour les tests (optionnel) - sera déplacé après la déclaration de forceRandomSelection

	// Fonctions utilitaires robustes
	const executeWithTimeout = useCallback(<T,>(
		operation: () => Promise<T> | T,
		timeoutMs: number = operationTimeout,
		operationName: string = 'operation'
	): Promise<T | null> => {
		return new Promise((resolve) => {
			const timeoutId = setTimeout(() => {
				console.warn(`⏰ Timeout pour ${operationName}`);
				resolve(null);
			}, timeoutMs);

			try {
				const result = operation();
				if (result instanceof Promise) {
					result
						.then((res) => {
							clearTimeout(timeoutId);
							setLastSuccessfulOperation(Date.now());
							resolve(res);
						})
						.catch((error) => {
							clearTimeout(timeoutId);
							console.error(`❌ Erreur dans ${operationName}:`, error);
							resolve(null);
						});
				} else {
					clearTimeout(timeoutId);
					setLastSuccessfulOperation(Date.now());
					resolve(result);
				}
			} catch (error) {
				clearTimeout(timeoutId);
				console.error(`❌ Erreur dans ${operationName}:`, error);
				resolve(null);
			}
		});
	}, [operationTimeout]);

	const executeWithRetry = useCallback(<T,>(
		operation: () => Promise<T> | T,
		operationName: string = 'operation',
		maxAttempts: number = maxRetries
	): Promise<T | null> => {
		return new Promise(async (resolve) => {
			for (let attempt = 1; attempt <= maxAttempts; attempt++) {
				console.log(`🔄 Tentative ${attempt}/${maxAttempts} pour ${operationName}`);
				
				const result = await executeWithTimeout(operation, operationTimeout, operationName);
				if (result !== null) {
					setRetryCount(0);
					setWidgetHealth('healthy');
					resolve(result);
				return;
			}

				if (attempt < maxAttempts) {
					const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
					console.log(`⏳ Attente ${delay}ms avant retry...`);
					await new Promise(resolve => setTimeout(resolve, delay));
				}
			}

			// Pour les opérations de polling, utiliser un niveau de log moins sévère
			if (operationName.includes('polling')) {
				// Le polling peut échouer de manière non critique si le widget n'est pas prêt
				console.warn(`⚠️ Polling ${operationName} échoué après ${maxAttempts} tentative(s) - ce n'est pas critique`);
			} else {
			console.error(`❌ Échec définitif pour ${operationName} après ${maxAttempts} tentatives`);
			}
			setRetryCount(prev => prev + 1);
			setWidgetHealth(retryCount >= maxRetries ? 'failed' : 'degraded');
			resolve(null);
		});
	}, [executeWithTimeout, maxRetries, retryCount]);

	const syncPlayingToHeader = useCallback((playing: boolean) => {
		setIsPlaying(playing);
		desiredIsPlayingRef.current = playing;
		if (lastEmittedPlayingRef.current === playing) return;
		lastEmittedPlayingRef.current = playing;
		if (playing) soundCloudEvents.play();
		else soundCloudEvents.pause();
	}, []);

	const isWidgetHealthy = useCallback(() => {
		// Gate minimal : widget + API présents (ne plus bloquer sur lastSuccessfulOperation)
		const isHealthy = Boolean(
			widgetRef.current &&
			window.SC &&
			typeof window.SC.Widget === 'function' &&
			widgetHealth !== 'failed' &&
			!isRecovering
		);

		if (!isHealthy) {
			const isNetworkError = !window.SC || typeof window.SC?.Widget !== 'function';
			console.warn('⚠️ Widget SoundCloud non disponible:', {
				hasRef: !!widgetRef.current,
				hasSC: !!window.SC,
				health: widgetHealth,
				isRecovering,
			});
			if (isNetworkError) {
				window.dispatchEvent(new CustomEvent('soundcloud-network-error'));
			}
		}

		return isHealthy;
	}, [widgetHealth, isRecovering]);

	// Système de monitoring de santé du widget
useEffect(() => {
		const healthCheck = async () => {
			if (!isWidgetHealthy()) {
				console.warn('🏥 Widget SoundCloud en mauvaise santé, tentative de récupération...');
				
				// Tentative de récupération
				const recovered = await executeWithRetry(() => {
					if (widgetRef.current && window.SC) {
						return new Promise((resolve) => {
							widgetRef.current.isPaused((paused: boolean) => {
								resolve(!paused);
							});
						});
					}
					return false;
				}, 'health-check', 2);

				if (!recovered) {
					const timeSinceLastReinit = Date.now() - lastReinitialization;
					
					if (timeSinceLastReinit < reinitializationCooldown) {
						console.log(`⏳ Réinitialisation en cooldown (${Math.ceil((reinitializationCooldown - timeSinceLastReinit) / 1000)}s restantes)`);
				return;
			}

					console.warn('🔄 Widget SoundCloud en échec - tentative de réinitialisation automatique...');
					
					// Tentative de réinitialisation automatique
					try {
						// Nettoyer l'ancien widget
						if (widgetRef.current) {
							widgetRef.current.unbind(window.SC.Widget.Events.READY);
							widgetRef.current.unbind(window.SC.Widget.Events.PLAY);
							widgetRef.current.unbind(window.SC.Widget.Events.PAUSE);
							widgetRef.current.unbind(window.SC.Widget.Events.PLAY_PROGRESS);
							widgetRef.current.unbind(window.SC.Widget.Events.SEEK);
							widgetRef.current.unbind(window.SC.Widget.Events.FINISH);
						}
						
						// Réinitialiser les états
						setWidgetHealth('healthy');
						setConsecutiveFailures(0);
						setRetryCount(0);
						setIsRecovering(false);
						setRecoveryAttempts(0);
						setLastReinitialization(Date.now());
						
						// Relancer l'initialisation après un délai
						setTimeout(() => {
							console.log('🔄 Relance de l\'initialisation du widget...');
							// La réinitialisation sera gérée par le useEffect de chargement
							window.dispatchEvent(new CustomEvent('soundcloud-reinitialize'));
						}, 2000);
						
						console.log('✅ Réinitialisation automatique programmée');
						
					} catch (error) {
						console.error('❌ Échec de la réinitialisation automatique:', error);
						setWidgetHealth('failed');
						window.dispatchEvent(new CustomEvent('soundcloud-widget-failed'));
						window.dispatchEvent(new CustomEvent('soundcloud-health-changed', {
							detail: 'failed'
						}));
					}
				}
			}
		};

		const interval = setInterval(healthCheck, healthCheckInterval);
		return () => clearInterval(interval);
	}, [isWidgetHealthy, executeWithRetry, healthCheckInterval]);

	// Écouter les événements de récupération avec gestion d'erreur réseau améliorée
	useEffect(() => {
		const handleWidgetFailure = async () => {
			console.log('🔄 Réinitialisation du widget SoundCloud suite à un échec...');
			setWidgetHealth('healthy');
			setRetryCount(0);
			setLastSuccessfulOperation(Date.now());
			
			// Attendre que l'API SoundCloud soit disponible
			const waitForSC = () => {
				return new Promise<void>((resolve) => {
					const checkSC = () => {
						if (window.SC && typeof window.SC.Widget === 'function') {
							resolve();
						} else {
							setTimeout(checkSC, 100);
						}
					};
					checkSC();
				});
			};
			
			try {
				await waitForSC();
				
				// Réinitialiser le widget avec retry
				const iframe = document.getElementById('soundcloud-widget') as HTMLIFrameElement;
				if (iframe && window.SC) {
					console.log('🎵 Réinitialisation du widget SoundCloud...');
					widgetRef.current = window.SC.Widget(iframe);
					setupWidgetEventsRef.current();
					
					setTimeout(() => {
						if (widgetRef.current) {
							console.log('✅ Widget SoundCloud réinitialisé avec succès');
							setLastSuccessfulOperation(Date.now());
						} else {
							console.warn('⚠️ Échec de la réinitialisation du widget');
						}
					}, 1000);
				}
			} catch (error) {
				console.error('❌ Erreur lors de la réinitialisation:', error);
			}
		};

		window.addEventListener('soundcloud-widget-failed', handleWidgetFailure);
		window.addEventListener('soundcloud-network-error', handleWidgetFailure);
		return () => {
			window.removeEventListener('soundcloud-widget-failed', handleWidgetFailure);
			window.removeEventListener('soundcloud-network-error', handleWidgetFailure);
		};
	}, []);

	// Machine d'état simple pour l'initialisation
	type InitState = 'idle' | 'loading-api' | 'api-ready' | 'loading-widget' | 'widget-ready' | 'failed';
	const [initState, setInitState] = useState<InitState>('idle');
	const [initError, setInitError] = useState<string | null>(null);
	
	// Initialisation séquentielle et robuste
	const initializeSoundCloudSequentially = useCallback(async () => {
		if (initStartedRef.current) {
			console.log('ℹ️ Init SoundCloud déjà en cours / faite — skip');
			return;
		}
		initStartedRef.current = true;
		console.log('🎵 Début de l\'initialisation séquentielle SoundCloud...');
		setInitState('loading-api');
		setInitError(null);
		
		try {
			// Étape 1: Charger l'API SoundCloud
			await loadSoundCloudAPI();
			
			// Étape 2: Attendre que l'API soit prête
			await waitForSoundCloudAPI();
			
			// Étape 3: Initialiser le widget
			await initializeWidget();
			
			// Étape 4: Configurer les événements
			// La sélection aléatoire initiale sera faite dans READY pour éviter le flash de ROB'ZOO
			setupWidgetEvents();
			
			console.log('✅ Initialisation SoundCloud terminée avec succès');
			setInitState('widget-ready');
			
		} catch (error) {
			console.error('❌ Erreur lors de l\'initialisation:', error);
			setInitError(error instanceof Error ? error.message : 'Erreur inconnue');
			setInitState('failed');
			initStartedRef.current = false; // permettre un retry
		}
	}, []);
	
	// Étape 1: Charger l'API SoundCloud
	const loadSoundCloudAPI = useCallback((): Promise<void> => {
		return new Promise((resolve, reject) => {
			// Vérifier si l'API est déjà chargée
			if (window.SC && typeof window.SC.Widget === 'function') {
				console.log('✅ API SoundCloud déjà disponible');
				resolve();
				return;
			}
			
			// Vérifier si le script est déjà en cours de chargement
			const existingScript = document.querySelector('script[src="https://w.soundcloud.com/player/api.js"]');
			if (existingScript) {
				console.log('⏳ Script SoundCloud déjà en cours de chargement...');
				// Attendre que le script soit chargé
				const waitForSC = () => {
					return new Promise<void>((resolve) => {
						const checkSC = () => {
							if (window.SC && typeof window.SC.Widget === 'function') {
								resolve();
							} else {
								setTimeout(checkSC, 100);
							}
						};
						checkSC();
					});
				};
				waitForSC().then(resolve).catch(reject);
				return;
			}
			
			console.log('📥 Chargement du script SoundCloud...');
			const script = document.createElement('script');
			script.src = 'https://w.soundcloud.com/player/api.js';
			script.async = true;
			
			script.onload = () => {
				console.log('✅ Script SoundCloud chargé');
				resolve();
			};
			
			script.onerror = () => {
				console.error('❌ Erreur lors du chargement du script SoundCloud');
				reject(new Error('Impossible de charger l\'API SoundCloud'));
			};
			
			document.head.appendChild(script);
		});
	}, []);
	
	// Étape 2: Attendre que l'API soit prête
	const waitForSoundCloudAPI = useCallback((): Promise<void> => {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Timeout: API SoundCloud non disponible après 10s'));
			}, 10000);
			
			const checkAPI = () => {
				if (window.SC && typeof window.SC.Widget === 'function') {
					console.log('✅ API SoundCloud prête');
					clearTimeout(timeout);
					setInitState('api-ready');
					setIsApiLoaded(true);
					resolve();
				} else {
					setTimeout(checkAPI, 100);
				}
			};
			
			checkAPI();
		});
	}, []);
	
	// Fonction helper pour recréer la référence du widget si nécessaire
	const ensureWidgetRef = useCallback(() => {
		if (widgetRef.current) {
			return true;
		}
		
		const iframe = document.getElementById('soundcloud-widget') as HTMLIFrameElement;
		if (iframe && window.SC && typeof window.SC.Widget === 'function') {
			try {
				widgetRef.current = window.SC.Widget(iframe);
				console.log('✅ Widget ref recréée automatiquement');
				return true;
			} catch (error) {
				console.error('❌ Erreur lors de la recréation du widget ref:', error);
			}
		}
		
		return false;
	}, []);
	
	// Étape 4: Configurer les événements (source unique — toujours sync header + progress)
	const setupWidgetEvents = useCallback(() => {
		if (!widgetRef.current && !ensureWidgetRef()) {
			console.warn('⚠️ Impossible de configurer les événements: widget non disponible');
			return;
		}
		
		console.log('🎛️ Configuration des événements du widget...');
		
		try {
			try {
				widgetRef.current.unbind(window.SC.Widget.Events.READY);
				widgetRef.current.unbind(window.SC.Widget.Events.PLAY);
				widgetRef.current.unbind(window.SC.Widget.Events.PAUSE);
				widgetRef.current.unbind(window.SC.Widget.Events.PLAY_PROGRESS);
				widgetRef.current.unbind(window.SC.Widget.Events.SEEK);
				widgetRef.current.unbind(window.SC.Widget.Events.FINISH);
				widgetRef.current.unbind(window.SC.Widget.Events.ERROR);
			} catch {
				// normal à la première init
			}

			const runInitialSelectionIfNeeded = async () => {
				if (!isInitialLoadRef.current || !performInitialRandomSelectionRef.current) return;
				isInitialLoadRef.current = false;
				console.log('🎲 Premier chargement - sélection aléatoire immédiate...');
				setIsLoadingRandomTrack(true);
				try {
					await performInitialRandomSelectionRef.current();
				} catch (error) {
					console.error('❌ Erreur lors de la sélection aléatoire initiale:', error);
					setIsLoadingRandomTrack(false);
				}
			};
			
			widgetRef.current.bind(window.SC.Widget.Events.READY, async () => {
				console.log('🎵 Widget SoundCloud prêt !');
				setLastSuccessfulOperation(Date.now());
				setWidgetHealth('healthy');
				try {
					widgetRef.current.isPaused((paused: boolean) => {
						syncPlayingToHeader(!paused);
					});
					widgetRef.current.getDuration((ms: number) => {
						if (typeof ms === 'number' && ms > 0) setDurationMs(ms);
					});
				} catch {}
				await runInitialSelectionIfNeeded();
			});
			
			widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
				syncPlayingToHeader(true);
				setLastSuccessfulOperation(Date.now());
			});
			
			widgetRef.current.bind(window.SC.Widget.Events.PAUSE, () => {
				syncPlayingToHeader(false);
				setLastSuccessfulOperation(Date.now());
			});
			
			widgetRef.current.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data: any) => {
				if (typeof data?.relativePosition === 'number') {
					setProgress(data.relativePosition);
					setLastSuccessfulOperation(Date.now());
				}
			});
			
			widgetRef.current.bind(window.SC.Widget.Events.SEEK, (data: any) => {
				if (typeof data?.relativePosition === 'number') {
					setProgress(data.relativePosition);
				}
			});
			
			widgetRef.current.bind(window.SC.Widget.Events.FINISH, () => {
				console.log('🎵 Track terminé');
				syncPlayingToHeader(false);
				setProgress(0);
			});
			
			widgetRef.current.bind(window.SC.Widget.Events.ERROR, (error: any) => {
				console.error('❌ Erreur widget SoundCloud:', error);
			});

			// Si READY a déjà eu lieu avant le bind, rattraper via getDuration / sélection
			try {
				widgetRef.current.getDuration((ms: number) => {
					if (typeof ms === 'number' && ms > 0) {
						setDurationMs(ms);
						setLastSuccessfulOperation(Date.now());
						setWidgetHealth('healthy');
						void runInitialSelectionIfNeeded();
					}
				});
				widgetRef.current.isPaused((paused: boolean) => {
					syncPlayingToHeader(!paused);
				});
			} catch {}
		} catch (error) {
			console.error('❌ Erreur lors de la configuration des événements:', error);
		}
	}, [ensureWidgetRef, syncPlayingToHeader]);

	useEffect(() => {
		setupWidgetEventsRef.current = setupWidgetEvents;
	}, [setupWidgetEvents]);

	// Étape 3: Initialiser le widget
	const initializeWidget = useCallback((): Promise<void> => {
		return new Promise((resolve, reject) => {
			setInitState('loading-widget');
			
			const iframe = document.getElementById('soundcloud-widget') as HTMLIFrameElement;
			if (!iframe) {
				reject(new Error('Iframe SoundCloud non trouvée'));
				return;
			}
			
			// Attendre que l'iframe soit complètement chargée
			const waitForIframe = () => {
				return new Promise<void>((iframeResolve) => {
					const checkIframe = () => {
						try {
							if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
								iframeResolve();
							} else {
								setTimeout(checkIframe, 100);
							}
						} catch (error) {
							// Cross-origin, mais l'iframe existe
							iframeResolve();
						}
					};
					checkIframe();
				});
			};
			
			waitForIframe().then(() => {
				// Délai supplémentaire pour s'assurer que l'iframe est prête
				setTimeout(() => {
					try {
						widgetRef.current = window.SC.Widget(iframe);
						console.log('✅ Widget SoundCloud créé');
						resolve();
					} catch (error) {
						console.error('❌ Erreur lors de la création du widget:', error);
						reject(error);
					}
				}, 1000);
			});
		});
	}, []);
	
	// Fonction pour charger la waveform avec retry
	const loadWaveform = useCallback(async (waveformUrl: string, context: string = '', retries: number = 3) => {
		// Vérifier si la waveform a déjà été chargée
		if (lastWaveformUrlRef.current === waveformUrl) {
			console.log(`ℹ️ ${context}Waveform déjà chargée:`, waveformUrl);
			return;
		}
		
		console.log(`🌊 ${context}Récupération waveform:`, waveformUrl);
		
		if (waveformUrl.endsWith('.json')) {
			for (let attempt = 1; attempt <= retries; attempt++) {
				try {
					const response = await fetch(waveformUrl, {
						method: 'GET',
						mode: 'cors',
						cache: 'no-cache',
					});
					
					if (!response.ok && attempt < retries) {
						console.warn(`⚠️ ${context}Tentative ${attempt}/${retries} échouée, retry...`);
						await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
						continue;
					}
					
					const json = await response.json();
											const samples: number[] = json?.samples || json?.data || [];
					
											if (samples.length > 0) {
						console.log(`✅ ${context}Waveform samples chargés:`, samples.length);
												setWaveformSamples(samples);
												setWaveformImageUrl("");
						lastWaveformUrlRef.current = waveformUrl;
						return;
					} else {
						console.log(`⚠️ ${context}Aucun sample trouvé dans le JSON`);
						break;
					}
				} catch (error) {
					console.error(`❌ ${context}Erreur réseau waveform JSON (tentative ${attempt}/${retries}):`, error);
					
					if (attempt < retries) {
						await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
						continue;
					}
					
					// Échec définitif : garder l'animation de chargement (pas de samples aléatoires)
					console.log(`⚠️ ${context}Waveform JSON inaccessible, animation maintenue`);
					return;
				}
			}
			
			// Aucune tentative n'a réussi
											setWaveformSamples(null);
											setWaveformImageUrl("");
			lastWaveformUrlRef.current = "";
								} else {
			// Waveform image
			console.log(`✅ ${context}Waveform image URL:`, waveformUrl);
									setWaveformSamples(null);
			setWaveformImageUrl(waveformUrl);
			lastWaveformUrlRef.current = waveformUrl;
		}
	}, []);

	// Étape 5: Sélection aléatoire initiale avec retry robuste
	const performInitialRandomSelection = useCallback(async (): Promise<void> => {
		// Assurer que la référence du widget existe
		if (!widgetRef.current && !ensureWidgetRef()) {
			console.warn('⚠️ Widget non disponible pour la sélection aléatoire');
			return;
		}
		
		console.log('🎲 Sélection aléatoire initiale...');
		setIsLoadingRandomTrack(true);
		
		try {
			// Retry avec backoff exponentiel
			const maxRetries = 5;
			let attempt = 0;
			
			while (attempt < maxRetries) {
				try {
					// Attendre un court délai pour s'assurer que le widget est prêt
					await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
					
					// Récupérer la liste des sons avec timeout
					const sounds = await Promise.race([
						new Promise<any[]>((resolve, reject) => {
							const timeout = setTimeout(() => {
								reject(new Error('Timeout récupération sounds'));
							}, 5000);
							
							try {
								widgetRef.current.getSounds((sounds: any[]) => {
									clearTimeout(timeout);
									resolve(sounds || []);
								});
							} catch (error) {
								clearTimeout(timeout);
								reject(error);
							}
						})
					]);
					
					if (sounds && sounds.length > 0) {
						// Sélectionner un son aléatoire
						const randomIndex = Math.floor(Math.random() * sounds.length);
						const randomSound = sounds[randomIndex];
						
						console.log(`🎲 Son sélectionné (tentative ${attempt + 1}/${maxRetries}): ${randomSound.title}`);
						
						// Aller au son sélectionné
						await new Promise<void>((resolve) => {
							try {
								widgetRef.current.skip(randomIndex);
								// Attendre que le track change
								setTimeout(resolve, 500);
							} catch (error) {
								console.error('❌ Erreur lors du skip:', error);
								resolve();
							}
						});
						
						// Mettre à jour les informations
						const newTitle = randomSound.title || "Savage Block Party";
						const newArtist = randomSound.user?.username || "Latest tracks";
						setTrackTitle(newTitle);
						setArtistName(newArtist);
						setArtworkUrl((randomSound.artwork_url || "/home/images/logo_orange.png").replace("-large", "-t200x200"));
						// Émettre l'événement pour le header player
						window.dispatchEvent(new CustomEvent('soundcloud-track-change', {
							detail: { title: newTitle, artist: newArtist }
						}));
						setPermalinkUrl(randomSound.permalink_url || "https://soundcloud.com/savageblockpartys");
						
						// Charger la waveform si disponible
						if (randomSound.waveform_url) {
							loadWaveform(randomSound.waveform_url, 'Initial ');
						}
						
						console.log('✅ Sélection aléatoire réussie');
						setIsLoadingRandomTrack(false);
						return;
					} else {
						console.warn(`⚠️ Aucun son trouvé (tentative ${attempt + 1}/${maxRetries})`);
					}
				} catch (error) {
					console.error(`❌ Erreur sélection aléatoire (tentative ${attempt + 1}/${maxRetries}):`, error);
				}
				
				attempt++;
			}
			
			// Si tous les retries ont échoué, afficher des valeurs par défaut
			console.warn('⚠️ Échec de la sélection aléatoire après tous les retries - utilisation des valeurs par défaut');
			const defaultTitle = "Savage Block Party";
			const defaultArtist = "Latest tracks";
			setTrackTitle(defaultTitle);
			setArtistName(defaultArtist);
			setArtworkUrl("/home/images/logo_orange.png");
			// Émettre l'événement pour le header player
			window.dispatchEvent(new CustomEvent('soundcloud-track-change', {
				detail: { title: defaultTitle, artist: defaultArtist }
			}));
			setPermalinkUrl("https://soundcloud.com/savageblockpartys");
		} finally {
			setIsLoadingRandomTrack(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loadWaveform]);
	
	// Mettre à jour la ref de performInitialRandomSelection
	useEffect(() => {
		performInitialRandomSelectionRef.current = performInitialRandomSelection;
	}, [performInitialRandomSelection]);
	
	// Initialisation principale
	useEffect(() => {
		console.log('🎵 Initialisation du widget SoundCloud...');
		
		// URL de base pour la playlist Savage Block Party
		const baseUrl = `https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/savageblockpartys&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`;
		setSoundcloudUrl(baseUrl);
		
		// Démarrer l'initialisation séquentielle après un court délai
		const timer = setTimeout(() => {
			initializeSoundCloudSequentially();
		}, 500);
		
		return () => clearTimeout(timer);
	}, [initializeSoundCloudSequentially]);

	// Éviter l'erreur d'hydratation et préparer la sélection aléatoire
	useEffect(() => {
		setIsMounted(true);
		console.log('🎲 Composant monté - sélection aléatoire activée');
	}, []);
	
	// Auto-récupération de la référence du widget en cas de perte
	useEffect(() => {
		const interval = setInterval(() => {
			if (!widgetRef.current && window.SC && typeof window.SC.Widget === 'function') {
				if (ensureWidgetRef()) {
					setupWidgetEventsRef.current();
				}
			}
		}, 2000);
		
		return () => clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);



	        // Système optimisé de détection de beats avec listeners
        const detectBeatAndChangeColors = useCallback(() => {
                if (!enableDynamicColors) return; // blocage global
                if (!isPlaying) return;

                const currentTime = Date.now();
                const estimatedBPM = 120;
                const beatInterval = 60000 / estimatedBPM;

                // Vérifier si assez de temps s'est écoulé depuis le dernier beat                                                                            
                if ((currentTime - lastBeatTime) < beatInterval * 0.8) return;  

                let shouldChangeColor = false;
                let intensity = 0;
                let source = '';

                // Méthode: Données waveform SoundCloud
		if (!shouldChangeColor && waveformSamples && waveformSamples.length > 0 && durationMs > 0) {
			const currentSampleIndex = Math.floor((progress / 100) * waveformSamples.length);
			const currentAmplitudeRaw = Math.abs(waveformSamples[currentSampleIndex] || 0);
			// Normaliser les valeurs: SoundCloud retourne des valeurs 0-1, mais certaines APIs retournent 0-255
			const currentAmplitude = currentAmplitudeRaw > 1 ? currentAmplitudeRaw / 255 : currentAmplitudeRaw;
			
			const windowSize = Math.min(15, waveformSamples.length - currentSampleIndex);
			const currentWindow = waveformSamples.slice(currentSampleIndex, currentSampleIndex + windowSize);
			const avgEnergyRaw = currentWindow.reduce((sum, sample) => sum + Math.abs(sample), 0) / currentWindow.length;
			// Normaliser l'énergie moyenne
			const avgEnergy = avgEnergyRaw > 1 ? avgEnergyRaw / 255 : avgEnergyRaw;
			const energyThreshold = Math.max(0.2, avgEnergy * 1.1);
			
			if (currentAmplitude > energyThreshold) {
				shouldChangeColor = true;
				intensity = Math.min(1, currentAmplitude / energyThreshold);
				source = 'waveform';
			}
		}
		
		// Méthode 3: Simulation temporelle (fallback)
		if (!shouldChangeColor) {
			shouldChangeColor = true;
			const progressFactor = progress / 100;
			const timeFactor = (currentTime % 8000) / 8000; // Cycle de 8 secondes
			intensity = (progressFactor + timeFactor) / 2;
			source = '-simulation';
		}
		
		// Changer la couleur si nécessaire
		if (shouldChangeColor) {
			setLastBeatTime(currentTime);
			setBeatCount(prev => prev + 1);
			
			let newTheme: 'yellow' | 'cyan' | 'red';
			if (intensity > 0.7) {
				newTheme = 'red';
			} else if (intensity > 0.4) {
				newTheme = 'cyan';
			} else {
				newTheme = 'yellow';
			}
			
			if (enableDynamicColors) setDynamicColorTheme(newTheme);
			setColorTransitionActive(true);
			setTimeout(() => setColorTransitionActive(false), 300);
			
			// Dispatcher l'événement silencieusement (sans logs)
			window.dispatchEvent(new CustomEvent('soundcloud-color-change', {
				detail: { theme: newTheme, beatCount: beatCount + 1, intensity, source }
			}));
		}
	        }, [enableDynamicColors, isPlaying, waveformSamples, progress, durationMs, lastBeatTime, beatCount]);

        // Système de listeners pour détecter les changements en temps réel  
        useEffect(() => {
                if (!enableDynamicColors) return;
                if (!isPlaying) return;

                // Listener pour les changements de progression SoundCloud      
                const handleProgressChange = () => {
                        detectBeatAndChangeColors();
                };

		                // Écouter les changements de progression (toutes les 200ms max)                                                                               
                const progressInterval = setInterval(handleProgressChange, 200);

                return () => {
                        clearInterval(progressInterval);
                };
	}, [enableDynamicColors, isPlaying, detectBeatAndChangeColors]);

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

	// Mettre à jour document.title pour le player natif mobile
	useEffect(() => {
		if (trackTitle && artistName) {
			document.title = `${trackTitle} — ${artistName} • Savage Block Party`;
		}
	}, [trackTitle, artistName]);

	// Réduire le player sur les autres pages que la home
	useEffect(() => {
		const newExpanded = isHome;
		console.log('📍 Changement de page:', {
			isHome,
			newExpanded,
			currentExpanded: isPlayerExpanded,
			willUpdate: newExpanded !== isPlayerExpanded,
			timestamp: new Date().toISOString()
		});
		// Toujours réduire le player sur les pages non-home
		if (!isHome) {
			setIsPlayerExpanded(false);
		} else {
			setIsPlayerExpanded(true);
		}
	}, [isHome, isPlayerExpanded]);

	// Vérifier périodiquement que le widget est toujours valide (sans dépendance sur isPlayerExpanded)
	useEffect(() => {
		const checkWidget = () => {
			if (window.SC && widgetRef.current) {
				try {
					widgetRef.current.isPaused((paused: boolean) => {
						syncPlayingToHeader(!paused);
					});
				} catch (error) {
					console.log('Widget SoundCloud perdu, réinitialisation...');
					const iframe = document.getElementById('soundcloud-widget') as HTMLIFrameElement;
					if (iframe) {
						widgetRef.current = window.SC.Widget(iframe);
						setupWidgetEventsRef.current();
					}
				}
			}
		};
		
		// Vérifier toutes les 5 secondes au lieu de se déclencher sur chaque changement d'état
		const interval = setInterval(checkWidget, 5000);
		return () => clearInterval(interval);
	}, []); // Pas de dépendances pour éviter les redéclenchements
	// Fonction pour forcer la sélection aléatoire
	const forceRandomSelection = useCallback(async () => {
		if (!isWidgetHealthy()) {
			console.warn('⚠️ Widget SoundCloud non disponible pour la sélection aléatoire');
			return;
		}

		console.log('🎲 Forçage de la sélection aléatoire...');
		setIsLoadingRandomTrack(true);
		
		try {
			const sounds = await executeWithRetry(() => {
				return new Promise<any[]>((resolve) => {
						widgetRef.current.getSounds((sounds: any[]) => {
						resolve(sounds || []);
					});
				});
			}, 'get-sounds-for-random', 2);

							if (sounds && sounds.length > 0) {
				// Afficher tous les sons disponibles pour debug
				console.log('🎵 Sons disponibles:', sounds.map((s, i) => `${i + 1}. ${s.title}`));
				
				const randomIndex = Math.floor(Math.random() * sounds.length);
				const randomSound = sounds[randomIndex];
				
				console.log(`🎲 Son sélectionné aléatoirement: ${randomIndex + 1}/${sounds.length} - ${randomSound.title}`);
				
				// Les infos seront mises à jour après le skip pour éviter l'affichage des infos par défaut
				
				// Aller au son sélectionné
				try {
					widgetRef.current.skip(randomIndex);
					console.log(`✅ Skip vers son aléatoire réussi (index: ${randomIndex})`);
					
					// Attendre un peu pour que le widget change de track, puis mettre à jour les infos
					setTimeout(() => {
						widgetRef.current?.getCurrentSound((currentSound: any) => {
							if (currentSound) {
								console.log(`🎵 Son actuel après skip: ${currentSound.title}`);
								const newTitle = currentSound.title || "Savage Block Party";
								const newArtist = currentSound.user?.username || "Latest tracks";
								setTrackTitle(newTitle);
								setArtistName(newArtist);
								const art = (currentSound.artwork_url || "/home/images/logo_orange.png");
								setArtworkUrl(art.replace("-large", "-t200x200"));
								setPermalinkUrl(currentSound.permalink_url || "https://soundcloud.com/savageblockpartys");
								// Émettre l'événement pour le header player
								window.dispatchEvent(new CustomEvent('soundcloud-track-change', {
									detail: { title: newTitle, artist: newArtist }
								}));
								
								// Charger la waveform si disponible
								const waveform = currentSound.waveform_url || currentSound.visual_waveform_url;
								console.log('🌊 Waveform disponible pour ce track:', waveform);
								if (waveform) {
									console.log('🌊 Chargement waveform depuis forceRandomSelection:', waveform);
									loadWaveform(waveform, 'Skip ');
								} else {
									console.warn('⚠️ Aucune waveform disponible pour ce track');
									setWaveformSamples(null);
									setWaveformImageUrl("");
								}
							}
							setIsLoadingRandomTrack(false);
						});
					}, 300);
				} catch (error) {
					console.error('❌ Erreur skip vers son aléatoire:', error);
					setIsLoadingRandomTrack(false);
				}
				
				// Sélection aléatoire terminée avec succès
				console.log('✅ Sélection aléatoire terminée');
				
				// Dispatcher un événement pour notifier le changement de track
				window.dispatchEvent(new CustomEvent('soundcloud-track-changed', {
					detail: {
						title: randomSound.title,
						artist: randomSound.user?.username,
						artwork: randomSound.artwork_url,
						permalink: randomSound.permalink_url,
						duration: randomSound.duration,
						isRandom: true
					}
				}));
			} else {
				setIsLoadingRandomTrack(false);
			}
		} catch (error) {
			console.error('❌ Erreur lors du forçage de la sélection aléatoire:', error);
			setIsLoadingRandomTrack(false);
		}
	}, [isWidgetHealthy, executeWithRetry, loadWaveform]);

	// Fonction pour tester la sélection aléatoire avec logging détaillé
	const testRandomSelection = useCallback(async () => {
		console.log('🧪 Test de sélection aléatoire...');
		await forceRandomSelection();
	}, [forceRandomSelection]);

	// API sera définie après les fonctions de contrôle

	// Vérifier périodiquement l'état du widget pour maintenir la synchronisation
	useEffect(() => {
		const interval = setInterval(async () => {
			if (!isWidgetHealthy()) {
				console.warn('⚠️ Widget SoundCloud non disponible pour le polling');
				return;
			}
			
			// Ne pas faire de polling si une sélection aléatoire est en cours
			if (isLoadingRandomTrack) {
				return;
			}

			// Vérifier l'état de lecture avec retry
			const playState = await executeWithRetry(() => {
				return new Promise<boolean>((resolve) => {
					widgetRef.current.isPaused((paused: boolean) => {
						resolve(!paused);
					});
				});
			}, 'polling-play-state', 1);

			if (playState !== null) {
				syncPlayingToHeader(playState);
				// Fallback progress si PLAY_PROGRESS est muet
				try {
					widgetRef.current?.getPosition((pos: number) => {
						widgetRef.current?.getDuration((dur: number) => {
							if (dur > 0 && typeof pos === 'number') {
								setProgress(Math.max(0, Math.min(1, pos / dur)));
							}
						});
					});
				} catch {}
			}
			
			// Vérifier périodiquement les infos du track avec retry
			// Vérifier d'abord que le widget est vraiment disponible
			if (!widgetRef.current || typeof widgetRef.current.getCurrentSound !== 'function') {
				return; // Sortir silencieusement si le widget n'est pas prêt
			}

			const trackInfo = await executeWithRetry(() => {
				return new Promise<{
					title: string;
					artist: string;
					artwork: string;
					waveform?: string;
				} | null>((resolve, reject) => {
					try {
						if (!widgetRef.current || typeof widgetRef.current.getCurrentSound !== 'function') {
							reject(new Error('Widget non disponible'));
							return;
						}
					widgetRef.current.getCurrentSound((sound: any) => {
						if (sound && sound.title) {
							resolve({
								title: sound.title,
								artist: sound.user?.username || "Latest tracks",
								artwork: (sound.artwork_url || sound.user?.avatar_url || "/home/images/logo_orange.png").replace("-large", "-t200x200"),
								waveform: sound.waveform_url || sound.visual_waveform_url
							});
						} else {
							resolve(null);
						}
					});
					} catch (error) {
						reject(error);
					}
				});
			}, 'polling-track-info', 1);

			if (trackInfo && trackInfo.title !== trackTitle) {
				console.log('🔄 Mise à jour périodique des infos:', trackInfo.title);
				setTrackTitle(trackInfo.title);
				setArtistName(trackInfo.artist);
				setArtworkUrl(trackInfo.artwork);
				// Émettre l'événement pour le header player
				window.dispatchEvent(new CustomEvent('soundcloud-track-change', {
					detail: { title: trackInfo.title, artist: trackInfo.artist }
				}));
				
				// Charger la waveform si elle a changé (utiliser la ref pour éviter les états)
				if (trackInfo.waveform && trackInfo.waveform !== lastWaveformUrlRef.current) {
					loadWaveform(trackInfo.waveform, 'Périodique ');
				}
			}

			// Toujours faire la sélection aléatoire si on a des infos par défaut ou si c'est le premier chargement
			if (trackTitle === "Savage Block Party" || trackTitle === "Latest tracks" || !trackTitle) {
				console.log('🎲 Sélection aléatoire nécessaire - infos:', trackTitle);
				await forceRandomSelection();
			}

			// ROB'ZOO fait partie de la sélection aléatoire normale - pas de traitement spécial
		}, 3000); // Vérifier toutes les 3 secondes

		return () => clearInterval(interval);
	}, [isWidgetHealthy, executeWithRetry, trackTitle, waveformImageUrl, loadWaveform, forceRandomSelection, syncPlayingToHeader]);

	// Charger l'API SoundCloud et initialiser le widget
	useEffect(() => {
		const updateFromCurrentSound = async () => {
			// Ne pas mettre à jour si une sélection aléatoire est en cours
			if (isLoadingRandomTrack) {
				console.log('ℹ️ Mise à jour ignorée - sélection aléatoire en cours');
				return;
			}
			
			if (!isWidgetHealthy()) {
				console.warn('⚠️ Widget SoundCloud non disponible pour updateFromCurrentSound');
				return;
			}

			const soundInfo = await executeWithRetry(() => {
				return new Promise<{
					title: string;
					artist: string;
					artwork: string;
					permalink: string;
					waveform?: string;
					duration?: number;
				} | null>((resolve) => {
					const widget = widgetRef.current;
					// Sécurité: si le widget n'est pas prêt, retourner null sans lancer postMessage
					if (!widget || !window.SC || typeof widget.getCurrentSound !== 'function') {
						resolve(null);
						return;
					}
					try {
						widget.getCurrentSound((sound: any) => {
						if (!sound) {
							// Si pas de son actuel, récupérer la liste des sons
							try {
								widget.getSounds((sounds: any[]) => {
							if (sounds && sounds.length > 0) {
								const first = sounds[0];
									resolve({
										title: first.title || "Savage Block Party",
										artist: first.user?.username || "Latest tracks",
										artwork: (first.artwork_url || first.user?.avatar_url || "/home/images/logo_orange.png").replace("-large", "-t200x200"),
										permalink: first.permalink_url || "https://soundcloud.com/savageblockpartys",
										waveform: first.waveform_url || first.visual_waveform_url,
										duration: first.duration
									});
								} else {
									resolve(null);
								}
							});
							} catch {
								resolve(null);
							}
						} else {
							resolve({
								title: sound.title || "Savage Block Party",
								artist: sound.user?.username || "Latest tracks",
								artwork: (sound.artwork_url || sound.user?.avatar_url || "/home/images/logo_orange.png").replace("-large", "-t200x200"),
								permalink: sound.permalink_url || "https://soundcloud.com/savageblockpartys",
								waveform: sound.waveform_url || sound.visual_waveform_url,
								duration: sound.duration
							});
							}
						});
					} catch {
						resolve(null);
					}
				});
			}, 'update-from-current-sound');

			if (soundInfo) {
				console.log('🎵 Mise à jour des infos:', soundInfo.title);
				setTrackTitle(soundInfo.title);
				setArtistName(soundInfo.artist);
				setArtworkUrl(soundInfo.artwork);
				setPermalinkUrl(soundInfo.permalink);
				// Émettre l'événement pour le header player
				window.dispatchEvent(new CustomEvent('soundcloud-track-change', {
					detail: { title: soundInfo.title, artist: soundInfo.artist }
				}));
				
				if (soundInfo.waveform) {
					loadWaveform(soundInfo.waveform, 'Current ');
				} else {
					console.log('⚠️ Aucune waveform disponible');
					setWaveformSamples(null);
					setWaveformImageUrl("");
				}
				
				if (soundInfo.duration) {
					setDurationMs(soundInfo.duration);
				}
			}
		};

	const setupFallbackWidgetEvents = () => {
		// Unifier avec le bind principal (évite un 2e jeu d'handlers divergents)
		setupWidgetEventsRef.current();
	};

		const loadSoundCloudAPI = async () => {
			console.log('🔄 Chargement de l\'API SoundCloud...');
			
		if (window.SC) {
			console.log('✅ API SoundCloud déjà chargée');
			await initializeFallbackWidget();
			return;
		}

		// Vérifier si le script est déjà en cours de chargement
		const existingScript = document.querySelector('script[src="https://w.soundcloud.com/player/api.js"]');
		if (existingScript) {
			console.log('⏳ Script SoundCloud déjà en cours de chargement...');
			// Attendre que le script soit chargé
			const waitForSC = () => {
				return new Promise<void>((resolve) => {
					const checkSC = () => {
						if (window.SC) {
							resolve();
						} else {
							setTimeout(checkSC, 100);
						}
					};
					checkSC();
				});
			};
			await waitForSC();
			await initializeFallbackWidget();
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://w.soundcloud.com/player/api.js';
		script.onload = async () => {
			console.log('✅ API SoundCloud chargée avec succès');
			await initializeFallbackWidget();
		};
			script.onerror = () => {
				console.error('❌ Échec du chargement de l\'API SoundCloud');
				setWidgetHealth('failed');
			};
			document.head.appendChild(script);
		};

		const initializeFallbackWidget = async () => {
			// Attendre que l'iframe soit montée
			const waitForIframe = () => {
				return new Promise<boolean>((resolve) => {
					const checkIframe = () => {
						const iframe = document.getElementById('soundcloud-widget') as HTMLIFrameElement;
						if (iframe && iframe.contentWindow) {
							// Vérifier que l'iframe a bien chargé son contenu
							try {
								if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
									resolve(true);
								} else {
									setTimeout(checkIframe, 100);
								}
							} catch (error) {
								// Cross-origin, mais l'iframe existe
								resolve(true);
							}
						} else {
							setTimeout(checkIframe, 100);
						}
					};
					checkIframe();
				});
			};

			// Attendre que l'iframe soit prête
			const iframeReady = await waitForIframe();
			if (!iframeReady) {
				console.error('❌ Iframe SoundCloud non trouvée');
				setWidgetHealth('failed');
				return;
			}

			// Attendre un délai supplémentaire pour que l'iframe soit complètement chargée
			await new Promise(resolve => setTimeout(resolve, 1000));

			const result = await executeWithRetry(() => {
				const iframe = document.getElementById('soundcloud-widget') as HTMLIFrameElement;
				if (iframe && window.SC && window.SC.Widget) {
					try {
						widgetRef.current = window.SC.Widget(iframe);
						setupFallbackWidgetEvents();
						console.log('✅ Widget SoundCloud initialisé avec succès');
						return true;
					} catch (error) {
						console.error('❌ Erreur lors de la création du widget:', error);
						return false;
					}
				} else {
					console.warn('⚠️ Conditions non remplies:', {
						hasIframe: !!iframe,
						hasSC: !!window.SC,
						hasWidget: !!(window.SC && window.SC.Widget)
					});
					return false;
				}
			}, 'initialize-widget');

			if (!result) {
				console.error('❌ Échec de l\'initialisation du widget SoundCloud');
				setWidgetHealth('failed');
			}
		};

		// Path A (séquentiel) est la source unique — ne pas relancer un 2e init concurrent
		if (isMounted && !widgetRef.current && !initStartedRef.current) {
		loadSoundCloudAPI();
		}
	}, [isMounted]); // Charger l'API SoundCloud après le montage du composant

	// Ajuster dynamiquement le nombre de barres pour occuper toute la largeur
// Responsive bar count based on window width
useEffect(() => {
	const updateBarCount = () => {
		const width = window.innerWidth;
		// Adjust bar count based on screen size
		let count = 300; // default for large screens
		if (width < 640) { // sm breakpoint
			count = 80;
		} else if (width < 768) { // md breakpoint
			count = 120;
		} else if (width < 1024) { // lg breakpoint
			count = 200;
		}
			setBarCount(count);
	};
	
	updateBarCount();
	window.addEventListener('resize', updateBarCount);
	return () => window.removeEventListener('resize', updateBarCount);
}, []);

	const handlePlayPause = useCallback(async () => {
		if (!widgetRef.current && !ensureWidgetRef()) {
			console.warn('⚠️ Widget SoundCloud non disponible pour play/pause');
			return;
		}
		if (!isWidgetHealthy() && !widgetRef.current) {
			return;
		}

		if (playPauseLockRef.current) {
			console.log('⏳ Play/pause déjà en cours, ignore...');
			return;
		}

		playPauseLockRef.current = true;

		try {
			const result = await executeWithRetry(async () => {
				return new Promise((resolve) => {
					try {
						if (!widgetRef.current) {
							resolve(false);
							return;
						}
						
						widgetRef.current.isPaused((paused: boolean) => {
							try {
								if (paused) {
									console.log('▶️ Lecture du track...');
									// Optimistic UI pour le header
									syncPlayingToHeader(true);
									widgetRef.current.play();
								} else {
									console.log('⏸️ Pause du track...');
									syncPlayingToHeader(false);
									widgetRef.current.pause();
								}
								setTimeout(() => resolve(true), 100);
							} catch (error: any) {
								if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
									console.log('ℹ️ Requête annulée par le widget SoundCloud (normal)');
									resolve(true);
								} else {
									console.error('Erreur play/pause:', error);
									resolve(false);
								}
							}
						});
					} catch (error: any) {
						if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
							console.log('ℹ️ Requête isPaused annulée (normal)');
							resolve(true);
						} else {
							console.error('Erreur lors de la vérification isPaused:', error);
							resolve(false);
						}
					}
				});
			}, 'play-pause');

			if (!result) {
				console.error('❌ Échec du play/pause après retry');
			} else {
				setLastSuccessfulOperation(Date.now());
			}
		} catch (error: any) {
			if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
				console.log('ℹ️ Requête play/pause annulée (normal)');
			} else {
				console.error('❌ Erreur dans handlePlayPause:', error);
			}
		} finally {
			setTimeout(() => {
				playPauseLockRef.current = false;
			}, 300);
		}
	}, [isWidgetHealthy, executeWithRetry, ensureWidgetRef, syncPlayingToHeader]);

	// Écouter les événements du header player
	useEffect(() => {
		const handlePlayPauseEvent = () => handlePlayPause();
		const handlePreviousEvent = () => {
			try { widgetRef.current?.prev(); } catch {}
		};
		const handleNextEvent = () => {
			try { widgetRef.current?.next(); } catch {}
		};

		window.addEventListener('soundcloud-play-pause', handlePlayPauseEvent);
		window.addEventListener('soundcloud-previous', handlePreviousEvent);
		window.addEventListener('soundcloud-next', handleNextEvent);

		return () => {
			window.removeEventListener('soundcloud-play-pause', handlePlayPauseEvent);
			window.removeEventListener('soundcloud-previous', handlePreviousEvent);
			window.removeEventListener('soundcloud-next', handleNextEvent);
		};
	}, [handlePlayPause]);

	// API robuste pour l'intégrationet autres fonctionnalités
	const getPlayerAPI = useCallback(() => {
		return {
			// État du player
			isPlaying: () => isPlaying,
			isMuted: () => isMuted,
			isHealthy: () => isWidgetHealthy(),
			getHealth: () => widgetHealth,
			
			// Informations du track
			getCurrentTrack: () => ({
				title: trackTitle,
				artist: artistName,
				artwork: artworkUrl,
				permalink: permalinkUrl,
				duration: durationMs,
				progress: progress
			}),
			
			// Contrôles robustes
			play: () => handlePlayPause(),
			pause: () => handlePlayPause(),
			toggleMute: () => handleMuteToggle(),
			
			// Sélection aléatoire
			selectRandomTrack: () => forceRandomSelection(),
			
			// Waveform
			getWaveformData: () => ({
				samples: waveformSamples,
				imageUrl: waveformImageUrl,
				progress: progress,
				barCount: barCount
			}),
			
			// Santé et récupération
			getHealthStatus: () => ({
				health: widgetHealth,
				consecutiveFailures,
				retryCount,
				lastSuccessfulOperation,
				isRecovering,
				recoveryAttempts,
				lastReinitialization,
				timeSinceLastReinit: Date.now() - lastReinitialization
			}),
			
			// Réinitialisation manuelle
			reinitialize: () => {
				console.log('🔄 Réinitialisation manuelle du widget...');
				setLastReinitialization(0); // Reset cooldown
				window.dispatchEvent(new CustomEvent('soundcloud-reinitialize'));
			},
			
			// Donnéesen temps réel
			getData: () => ({
				waveformSamples: waveformSamples
			}),
			
			// Contrôle des couleurs dynamiques
			getColorTheme: () => dynamicColorTheme,
			setColorTheme: (theme: 'yellow' | 'cyan' | 'red') => {
				console.log(`🎨 Changement manuel de thème: ${theme}`);
				if (enableDynamicColors) setDynamicColorTheme(theme);
			},
			
			// Test immédiat des couleurs
			testColorsNow: () => {
				console.log('🎨 Test immédiat des couleurs...');
				console.log('🎨 État actuel:', { 
					theme: dynamicColorTheme, 
					playerColor, 
					playerBgColor,
					waveformColor 
				});
				
				// Test rapide : changer toutes les 1 seconde
				const themes: ('yellow' | 'cyan' | 'red')[] = ['yellow', 'cyan', 'red'];
				let index = 0;
				
				const quickTest = setInterval(() => {
					const theme = themes[index];
					console.log(`🎨 Test immédiat couleur: ${theme}`);
					if (enableDynamicColors) setDynamicColorTheme(theme);
					
					window.dispatchEvent(new CustomEvent('soundcloud-color-change', {
						detail: {
							theme: theme,
							beatCount: index + 1,
							timestamp: Date.now(),
							test: true,
							method: 'immediate-test'
						}
					}));
					
					index++;
					if (index >= themes.length) {
						clearInterval(quickTest);
						console.log('🎨 Test immédiat terminé');
					}
				}, 1000);
			},
			
			getColorTransitionStatus: () => ({
				active: colorTransitionActive,
				beatCount: beatCount,
				lastBeatTime: lastBeatTime
			}),
			
			// Événements personnalisés
			onTrackChange: (callback: (track: any) => void) => {
				window.addEventListener('soundcloud-track-changed', (e: any) => callback(e.detail));
			},
			onHealthChange: (callback: (health: string) => void) => {
				window.addEventListener('soundcloud-health-changed', (e: any) => callback(e.detail));
			},
			onColorChange: (callback: (data: any) => void) => {
				window.addEventListener('soundcloud-color-change', (e: any) => callback(e.detail));
			}
		};
	}, [isPlaying, isMuted, isWidgetHealthy, widgetHealth, trackTitle, artistName, artworkUrl, permalinkUrl, durationMs, progress, handlePlayPause, forceRandomSelection, waveformSamples, waveformImageUrl, barCount, consecutiveFailures, retryCount, lastSuccessfulOperation, isRecovering, recoveryAttempts, lastReinitialization, dynamicColorTheme, colorTransitionActive, beatCount, lastBeatTime]);

	// Exposer l'API après sa définition
	useEffect(() => {
		(window as any).soundcloudPlayer = getPlayerAPI();
		console.log('📡 API SoundCloud Player exposée dans la console: soundcloudPlayer');
	}, [getPlayerAPI]);

	const handleMuteToggle = useCallback(async () => {
		mutedDueToDocumentRef.current = false;
		if (!isWidgetHealthy()) {
			console.warn('⚠️ Widget SoundCloud non disponible pour mute');
			return;
		}

		const result = await executeWithRetry(async () => {
			return new Promise((resolve) => {
				try {
		if (isMuted) {
			widgetRef.current.setVolume(100);
			setIsMuted(false);
		} else {
			widgetRef.current.setVolume(0);
			setIsMuted(true);
		}
					resolve(true);
				} catch (error) {
					console.error('Erreur mute:', error);
					resolve(false);
				}
			});
		}, 'mute-toggle');

		if (!result) {
			console.error('❌ Échec du mute après retry');
		}
	}, [isWidgetHealthy, executeWithRetry, isMuted]);

	/* Hors onglet : couper le son ; au retour : rétablir seulement si le mute venait de là (pas un mute manuel). */
	useEffect(() => {
		const silenceIfAudible = () => {
			if (!widgetRef.current) return;
			if (isMutedRef.current) return;
			try {
				widgetRef.current.setVolume(0);
				setIsMuted(true);
				mutedDueToDocumentRef.current = true;
			} catch {
				/* ignore */
			}
		};

		const restoreIfNeeded = () => {
			if (!mutedDueToDocumentRef.current) return;
			mutedDueToDocumentRef.current = false;
			if (!widgetRef.current) {
				setIsMuted(false);
				return;
			}
			try {
				widgetRef.current.setVolume(100);
				setIsMuted(false);
			} catch {
				setIsMuted(false);
			}
		};

		const onVisibility = () => {
			if (document.visibilityState === "hidden") {
				silenceIfAudible();
			} else {
				restoreIfNeeded();
			}
		};

		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, []);

	// Exposer les fonctions globalement pour les tests
	useEffect(() => {
		(window as any).forceRandomSelection = forceRandomSelection;
		(window as any).testRandomSelection = testRandomSelection;
		
		console.log('🎲 Fonctions de sélection aléatoire exposées dans la console:');
		console.log('  - forceRandomSelection() - Force une sélection aléatoire');
		console.log('  - testRandomSelection() - Test avec logging détaillé');
	}, [forceRandomSelection, testRandomSelection]);

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

	// Ancien player supprimé - maintenant on utilise uniquement le header player
	// Afficher uniquement la waveform en bas
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
						className="w-full h-full select-none cursor-pointer bg-transparent relative flex items-end"
						style={{ zIndex: waveformZIndex }}
						onMouseEnter={() => {
							if (!isMobile) setIsWaveformHovered(true);
						}}
						onMouseLeave={() => {
							if (!isMobile) setIsWaveformHovered(false);
						}}
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
						<div
							className="w-full"
							style={{
								height: 100,
								transform: isTimelineExpanded ? 'scaleY(1.48)' : 'scaleY(1)',
								transformOrigin: 'bottom center',
								transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
								willChange: 'transform',
							}}
						>
						{!revealRealWaveform ? (
							<WaveformLoadingAnimation
								color={waveformColorFaded}
								maxHeight={88}
								barCount={barCount}
								isDataReady={hasWaveformData}
								onOutroComplete={handleWaveformOutroComplete}
							/>
						) : waveformSamples && waveformSamples.length > 0 ? (
							<div className="h-full w-full overflow-hidden">
								<div
									className="waveform-reveal h-full w-full items-end"
									style={{ display: "grid", gridTemplateColumns: `repeat(${barCount}, minmax(0, 1fr))`, columnGap: 1.5 }}
								>
								{Array.from({ length: barCount }).map((_, i) => {
									const sampleIndex = Math.floor(((barCount - 1 - i) / Math.max(1, barCount - 1)) * (waveformSamples!.length - 1));
									const v = waveformSamples![sampleIndex] ?? 0;
									// Normaliser les valeurs: SoundCloud retourne des valeurs 0-1, mais certaines APIs retournent 0-255
									const normalizedV = v > 1 ? v / 255 : v;
									const h = Math.max(2, Math.round(normalizedV * 88));
									const played = i / Math.max(1, barCount) <= progress;
									return (
										<div key={i} style={{ height: h, width: '3px', backgroundColor: played ? waveformColor : waveformColorFaded }} />
									);
								})}
								</div>
							</div>
						) : waveformImageUrl ? (
							<div className="relative h-full w-full overflow-hidden">
								<div className="waveform-reveal h-full w-full">
									<div className="relative h-full w-full overflow-hidden" style={{ transform: 'scaleY(-1)' }}>
										<img src={waveformImageUrl} alt="waveform" className="w-full h-full object-cover opacity-35" />
										<div className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}>
											<img src={waveformImageUrl} alt="waveform-progress" className="w-full h-full object-cover opacity-100" />
										</div>
									</div>
								</div>
							</div>
						) : null}
						</div>
					</div>,
					document.getElementById('sbp-footer-waveform') as HTMLElement
				)}
			</>
		);
}
