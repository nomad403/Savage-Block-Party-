"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";

/// <reference path="../types/soundcloud.d.ts" />
export default function SoundCloudPlayer() {
	const pathname = usePathname();
	const isHome = pathname === "/";
	const isAgenda = pathname?.startsWith("/agenda");
	const isStory = pathname?.startsWith("/story");
	const isShop = pathname?.startsWith("/shop");
	const isFamily = pathname?.startsWith("/family");
	const isPresse = pathname?.startsWith("/presse");
	// Désactiver temporairement les couleurs dynamiques (/son)
	const enableDynamicColors = false;
	
	// États pour couleurs dynamiques au rythme de la musique (déclarés en premier)
	const [dynamicColorTheme, setDynamicColorTheme] = useState<'yellow' | 'cyan' | 'red'>('yellow');
	const [colorTransitionActive, setColorTransitionActive] = useState(false);
	const [lastBeatTime, setLastBeatTime] = useState(0);
	const [beatCount, setBeatCount] = useState(0);
	
	// Couleurs basées sur le thème musical (statique si dynamic désactivé)
	const getDynamicColors = () => {
		if (!isHome) {
			// Couleurs statiques pour les autres pages
			return {
				waveformColor: isAgenda ? "bg-black" : (isStory ? "bg-cyan-400" : (isFamily ? "bg-green-500" : (isShop ? "bg-black" : (isPresse ? "bg-purple-500" : "bg-yellow-400")))),
				waveformColorFaded: isAgenda ? "bg-black/30" : (isStory ? "bg-cyan-400/50" : (isFamily ? "bg-green-500/50" : (isShop ? "bg-black/30" : (isPresse ? "bg-purple-500/50" : "bg-yellow-400/30")))),
				playerColor: isAgenda ? "text-cyan-400" : (isStory ? "text-cyan-400" : (isFamily ? "text-green-500" : (isShop ? "text-red-500" : (isPresse ? "text-purple-500" : "text-yellow-400")))),
				playerBgColor: isAgenda ? "bg-black" : (isStory ? "bg-cyan-400" : (isFamily ? "bg-green-500" : (isShop ? "bg-red-500" : (isPresse ? "bg-purple-500" : "bg-yellow-400"))))
			};
		}

		// Home: si les couleurs dynamiques sont désactivées, rester en jaune
		if (!enableDynamicColors) {
			return {
				waveformColor: "bg-yellow-400",
				waveformColorFaded: "bg-yellow-400/30",
				playerColor: "text-yellow-400",
				playerBgColor: "bg-yellow-400"
			};
		}

		// Couleurs dynamiques pour la page home
		switch (dynamicColorTheme) {
			case 'cyan':
				return {
					waveformColor: "bg-cyan-400",
					waveformColorFaded: "bg-cyan-400/50",
					playerColor: "text-cyan-400",
					playerBgColor: "bg-cyan-400"
				};
			case 'red':
				return {
					waveformColor: "bg-red-500",
					waveformColorFaded: "bg-red-500/30",
					playerColor: "text-red-500",
					playerBgColor: "bg-red-500"
				};
			case 'yellow':
			default:
				return {
					waveformColor: "bg-yellow-400",
					waveformColorFaded: "bg-yellow-400/30",
					playerColor: "text-yellow-400",
					playerBgColor: "bg-yellow-400"
				};
		}
	};

	const colors = useMemo(() => {
		const result = getDynamicColors();
		console.log('🎨 Couleurs calculées:', { 
			theme: dynamicColorTheme, 
			waveformColor: result.waveformColor,
			playerColor: result.playerColor,
			pathname
		});
		return result;
	}, [isHome, isAgenda, isStory, isShop, isFamily, isPresse, dynamicColorTheme, pathname]);
	const waveformColor = colors.waveformColor;
	const waveformColorFaded = colors.waveformColorFaded;
		const playerColor = colors.playerColor;
	const playerBgColor = colors.playerBgColor;
	
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
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
	const [progress, setProgress] = useState<number>(0);
	const [isMounted, setIsMounted] = useState(false);
	const [isPlayerExpanded, setIsPlayerExpanded] = useState(isHome);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	// Mémoriser l'état désiré de lecture pour éviter un auto-play lors des réinits
	const desiredIsPlayingRef = useRef(false);
	const widgetRef = useRef<any>(null);
	// Mémoriser la dernière waveform chargée pour éviter les rechargements inutiles
	const lastWaveformUrlRef = useRef<string>("");
	// Flag pour ignorer le premier READY (chargement initial) et faire la sélection aléatoire directement
	const isInitialLoadRef = useRef<boolean>(true);
	// Ref pour la fonction de sélection aléatoire initiale (évite les problèmes de dépendances)
	const performInitialRandomSelectionRef = useRef<(() => Promise<void>) | null>(null);
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

			console.error(`❌ Échec définitif pour ${operationName} après ${maxAttempts} tentatives`);
			setRetryCount(prev => prev + 1);
			setWidgetHealth(retryCount >= maxRetries ? 'failed' : 'degraded');
			resolve(null);
		});
	}, [executeWithTimeout, maxRetries, retryCount]);

	const isWidgetHealthy = useCallback(() => {
		const timeSinceLastSuccess = Date.now() - lastSuccessfulOperation;
		const isHealthy = widgetRef.current && 
			window.SC && 
			widgetHealth !== 'failed' && 
			timeSinceLastSuccess < healthCheckInterval * 2 &&
			consecutiveFailures < maxConsecutiveFailures &&
			!isRecovering;
		
		if (!isHealthy) {
			// Détecter les erreurs réseau spécifiques
			const isNetworkError = !window.SC || (window.SC && typeof window.SC.Widget !== 'function');
			const errorType = isNetworkError ? 'NETWORK_ERROR' : 'WIDGET_ERROR';
			
			console.warn(`⚠️ Widget SoundCloud non disponible (${errorType}):`, {
				hasRef: !!widgetRef.current,
				hasSC: !!window.SC,
				hasWidgetAPI: !!(window.SC && typeof window.SC.Widget === 'function'),
				health: widgetHealth,
				timeSinceLastSuccess,
				consecutiveFailures,
				isRecovering,
				recoveryAttempts,
				errorType
			});
			
			// Si c'est une erreur réseau, déclencher une réinitialisation
			if (isNetworkError && timeSinceLastSuccess > 5000) {
				console.log('🔄 Erreur réseau détectée - déclenchement de la réinitialisation...');
				window.dispatchEvent(new CustomEvent('soundcloud-network-error'));
			}
		}
		
		return isHealthy;
	}, [widgetHealth, lastSuccessfulOperation, healthCheckInterval, consecutiveFailures, maxConsecutiveFailures, isRecovering, recoveryAttempts]);

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
					
					// Vérifier que le widget est bien initialisé
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
	
	// Étape 4: Configurer les événements (une seule fois, pas de double bind)
	const setupWidgetEvents = useCallback(() => {
		if (!widgetRef.current && !ensureWidgetRef()) {
			console.warn('⚠️ Impossible de configurer les événements: widget non disponible');
			return;
		}
		
		console.log('🎛️ Configuration des événements du widget...');
		
		try {
			// Nettoyer d'abord les anciens listeners pour éviter les doublons
			try {
				widgetRef.current.unbind(window.SC.Widget.Events.READY);
				widgetRef.current.unbind(window.SC.Widget.Events.PLAY);
				widgetRef.current.unbind(window.SC.Widget.Events.PAUSE);
				widgetRef.current.unbind(window.SC.Widget.Events.PLAY_PROGRESS);
				widgetRef.current.unbind(window.SC.Widget.Events.SEEK);
				widgetRef.current.unbind(window.SC.Widget.Events.FINISH);
				widgetRef.current.unbind(window.SC.Widget.Events.ERROR);
			} catch (unbindError) {
				console.log('ℹ️ Aucun listener à nettoyer (normal à la première initialisation)');
			}
			
		widgetRef.current.bind(window.SC.Widget.Events.READY, async () => {
			console.log('🎵 Widget SoundCloud prêt !');
			
			// Si c'est le premier chargement, faire immédiatement la sélection aléatoire
			// pour éviter d'afficher le son par défaut (ROB'ZOO)
			if (isInitialLoadRef.current && performInitialRandomSelectionRef.current) {
				isInitialLoadRef.current = false;
				console.log('🎲 Premier chargement - sélection aléatoire immédiate...');
				setIsLoadingRandomTrack(true);
				try {
					await performInitialRandomSelectionRef.current();
				} catch (error) {
					console.error('❌ Erreur lors de la sélection aléatoire initiale:', error);
					setIsLoadingRandomTrack(false);
				}
			}
		});
		
		widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
			setIsPlaying(true);
		});
		
		widgetRef.current.bind(window.SC.Widget.Events.PAUSE, () => {
			setIsPlaying(false);
		});
		
		// Événement PLAY_PROGRESS pour mettre à jour le progress
		widgetRef.current.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data: any) => {
			if (typeof data?.relativePosition === 'number') {
				setProgress(data.relativePosition);
			}
		});
		
		widgetRef.current.bind(window.SC.Widget.Events.SEEK, (data: any) => {
			if (typeof data?.relativePosition === 'number') {
				setProgress(data.relativePosition);
			}
		});
		
		widgetRef.current.bind(window.SC.Widget.Events.FINISH, () => {
			console.log('🎵 Track terminé');
			setIsPlaying(false);
			setProgress(0);
		});
		
		widgetRef.current.bind(window.SC.Widget.Events.ERROR, (error: any) => {
			console.error('❌ Erreur widget SoundCloud:', error);
		});
		} catch (error) {
			console.error('❌ Erreur lors de la configuration des événements:', error);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
					
					// Dernière tentative échouée, utiliser des samples simulés
					console.log(`🔄 ${context}Utilisation de samples simulés comme fallback`);
					const fallbackSamples = Array.from({ length: 100 }, () => Math.random() * 0.5 + 0.25);
					setWaveformSamples(fallbackSamples);
					setWaveformImageUrl("");
					// Ne pas mettre à jour lastWaveformUrlRef pour les samples simulés
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
						setTrackTitle(randomSound.title || "Savage Block Party");
						setArtistName(randomSound.user?.username || "Latest tracks");
						setArtworkUrl((randomSound.artwork_url || "/home/images/logo_orange.png").replace("-large", "-t200x200"));
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
			setTrackTitle("Savage Block Party");
			setArtistName("Latest tracks");
			setArtworkUrl("/home/images/logo_orange.png");
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
				ensureWidgetRef();
			}
		}, 2000); // Vérifier toutes les 2 secondes
		
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

	// Vérifier périodiquement que le widget est toujours valide (sans dépendance sur isPlayerExpanded)
	useEffect(() => {
		const checkWidget = () => {
			if (window.SC && widgetRef.current) {
				try {
					widgetRef.current.isPaused((paused: boolean) => {
						setIsPlaying(!paused);
					});
				} catch (error) {
					console.log('Widget SoundCloud perdu, réinitialisation...');
					// Réinitialiser le widget seulement si nécessaire
					const iframe = document.getElementById('soundcloud-widget') as HTMLIFrameElement;
					if (iframe) {
						widgetRef.current = window.SC.Widget(iframe);
						// Les événements seront réinitialisés automatiquement
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
								setTrackTitle(currentSound.title || "Savage Block Party");
								setArtistName(currentSound.user?.username || "Latest tracks");
								const art = (currentSound.artwork_url || "/home/images/logo_orange.png");
								setArtworkUrl(art.replace("-large", "-t200x200"));
								setPermalinkUrl(currentSound.permalink_url || "https://soundcloud.com/savageblockpartys");
								
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
				setIsPlaying(playState);
				desiredIsPlayingRef.current = playState; // mémoriser l'état voulu
			}
			
			// Vérifier périodiquement les infos du track avec retry
			const trackInfo = await executeWithRetry(() => {
				return new Promise<{
					title: string;
					artist: string;
					artwork: string;
					waveform?: string;
				} | null>((resolve) => {
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
				});
			}, 'polling-track-info', 1);

			if (trackInfo && trackInfo.title !== trackTitle) {
				console.log('🔄 Mise à jour périodique des infos:', trackInfo.title);
				setTrackTitle(trackInfo.title);
				setArtistName(trackInfo.artist);
				setArtworkUrl(trackInfo.artwork);
				
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
	}, [isWidgetHealthy, executeWithRetry, trackTitle, waveformImageUrl, loadWaveform, forceRandomSelection]);

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
		if (!widgetRef.current) return;

		try {
			// Nettoyer d'abord les anciens listeners pour éviter les doublons
			try {
				widgetRef.current.unbind(window.SC.Widget.Events.READY);
				widgetRef.current.unbind(window.SC.Widget.Events.PLAY);
				widgetRef.current.unbind(window.SC.Widget.Events.PAUSE);
				widgetRef.current.unbind(window.SC.Widget.Events.PLAY_PROGRESS);
				widgetRef.current.unbind(window.SC.Widget.Events.SEEK);
				widgetRef.current.unbind(window.SC.Widget.Events.FINISH);
				widgetRef.current.unbind(window.SC.Widget.Events.ERROR);
			} catch (unbindError) {
				console.log('ℹ️ Aucun listener à nettoyer (normal à la première initialisation)');
			}

			widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
				console.log('🎵 Widget SoundCloud prêt !');
				
				// Initialiser les états de base seulement
				widgetRef.current.isPaused((paused: boolean) => {
					setIsPlaying(!paused);
					desiredIsPlayingRef.current = !paused;
				});
					try { widgetRef.current.getDuration((ms: number) => setDurationMs(ms || 0)); } catch {}
				
				// Empêcher tout auto-play après réinit si l'utilisateur était en pause
				try {
					if (!desiredIsPlayingRef.current) {
						widgetRef.current.pause();
					}
				} catch {}
				
				// NOTE: Ne pas appeler forceRandomSelection ni updateFromCurrentSound ici
				// car cela relance le player. Le player conserve son état et sa track actuelle.
			});
			
					widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
						setIsPlaying(true);
						updateFromCurrentSound();
					});
			
					widgetRef.current.bind(window.SC.Widget.Events.PAUSE, () => {
						setIsPlaying(false);
					});
			
			widgetRef.current.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data: any) => {
				if (typeof data?.relativePosition === 'number') {
					setProgress(data.relativePosition);
				}
					});
			
			widgetRef.current.bind(window.SC.Widget.Events.SEEK, (data: any) => {
				if (typeof data?.relativePosition === 'number') {
					setProgress(data.relativePosition);
				}
					});
			
					widgetRef.current.bind(window.SC.Widget.Events.FINISH, () => {
						setIsPlaying(false);
						setProgress(0);
					});
			
			widgetRef.current.bind(window.SC.Widget.Events.ERROR, (error: any) => {
				console.error('❌ Erreur widget SoundCloud:', error);
			});
		} catch (error) {
			console.error('❌ Erreur lors de la configuration des événements:', error);
		}
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

		// Attendre que le composant soit monté avant d'initialiser
		// ET ne réinitialiser que si le widget n'est pas déjà actif
		if (isMounted && !widgetRef.current) {
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
		if (!isWidgetHealthy()) {
			console.warn('⚠️ Widget SoundCloud non disponible pour play/pause');
			return;
		}

		const result = await executeWithRetry(async () => {
			return new Promise((resolve) => {
		widgetRef.current.isPaused((paused: boolean) => {
					try {
			if (paused) {
				widgetRef.current.play();
			} else {
				widgetRef.current.pause();
			}
						resolve(true);
					} catch (error) {
						console.error('Erreur play/pause:', error);
						resolve(false);
					}
				});
			});
		}, 'play-pause');

		if (!result) {
			console.error('❌ Échec du play/pause après retry');
		}
	}, [isWidgetHealthy, executeWithRetry]);

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

	// Version compacte - toujours visible (stabilisée)
	const CompactPlayer = useCallback(({ isMenuOpen }: { isMenuOpen: boolean }) => {
		// console.log('🔍 CompactPlayer rendu:', {
		// 	isPlayerExpanded,
		// 	timestamp: new Date().toISOString(),
		// 	stackTrace: new Error().stack?.split('\n').slice(1, 4)
		// });
return (
		<div className="fixed left-6 bottom-[112px] md:top-[50%] md:bottom-auto z-[10002] flex items-center gap-4" style={{ willChange: "transform" }}>
			{/* Indicateur de santé du widget */}
			{widgetHealth !== 'healthy' && (
				<div className={`absolute -top-2 -right-2 w-3 h-3 rounded-full ${
					widgetHealth === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
				} animate-pulse`} title={`Widget SoundCloud: ${widgetHealth}`} />
			)}
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
					<div className={`font-title text-sm leading-tight truncate ${isShop ? 'md:text-red-500 text-black' : playerColor}`}>
						{trackTitle || "Savage Block Party"}
					</div>
					<AutoScrollText 
						text={artistName || "Latest tracks"} 
						className={`font-text text-xs mt-1 ${isShop ? 'md:text-red-500/80 text-black/80' : (isStory ? 'text-cyan-400/80' : (isFamily ? 'text-green-500/80' : (isPresse ? 'text-purple-500/80' : playerColor + '/80')))}`}
					/>
					</div>

				{/* Conteneur des boutons avec fond cyan sur agenda et story */}
				<div className={`flex items-center gap-4 ${isAgenda || isStory || isFamily || isShop || isPresse ? 'player-compact-agenda animate-in' : ''}`}>
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
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={(isStory || isFamily || isShop || isAgenda || isPresse) ? 'text-black' : playerColor}>
							<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
						</svg>
					) : (
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={(isStory || isFamily || isShop || isAgenda || isPresse) ? 'text-black' : playerColor}>
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
								disabled={isLoadingRandomTrack}
								className="w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer disabled:cursor-not-allowed"
								title={isLoadingRandomTrack ? "Chargement..." : (isPlaying ? "Pause" : "Play")}
					>
						{isLoadingRandomTrack ? (
							<div className={`w-6 h-6 border-2 border-t-transparent border-r-transparent ${(isStory || isFamily || isShop || isAgenda || isPresse) ? 'border-black' : 'border-yellow-400'} rounded-full animate-spin`}></div>
						) : isPlaying ? (
									<div className="flex gap-0.5">
									<div className={`w-1 h-4 ${(isStory || isFamily || isShop || isAgenda || isPresse) ? 'bg-black' : playerBgColor}`}></div>
									<div className={`w-1 h-4 ${(isStory || isFamily || isShop || isAgenda || isPresse) ? 'bg-black' : playerBgColor}`}></div>
							</div>
						) : (
									<div 
										className={`w-0 h-0 border-l-[8px] border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-0.5`} 
										style={{
											borderLeftColor: (isAgenda || isStory || isFamily || isShop || isPresse) ? '#000000' : 
												playerBgColor.includes('cyan') ? '#22d3ee' : 
												playerBgColor.includes('red') ? '#ef4444' : '#facc15'
										}}
									></div>
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
							<svg width="18" height="18" viewBox="0 0 24 24" fill={(isStory || isFamily || isShop || isAgenda || isPresse) ? "#000000" : "currentColor"} className={(isStory || isFamily || isShop || isAgenda || isPresse) ? 'text-black' : playerColor}>
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
							className="w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity relative z-[10001] cursor-pointer"
								title={isPlayerExpanded ? "Masquer le player" : "Révéler le player"}
								style={{ pointerEvents: 'auto' }}
							>
								<svg 
									width="16" 
									height="16" 
									viewBox="0 0 24 24" 
									fill="currentColor" 
									className={playerColor}
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
	}, [isPlayerExpanded, artworkUrl, trackTitle, artistName, isMuted, handleMuteToggle, setIsPlayerExpanded, isMenuOpen, isHome, playerBgColor, playerColor, isAgenda, isPlaying, handlePlayPause, widgetHealth, isLoadingRandomTrack]);


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
									const sampleIndex = Math.floor(((barCount - 1 - i) / Math.max(1, barCount - 1)) * (waveformSamples!.length - 1));
									const v = waveformSamples![sampleIndex] ?? 0;
									// Normaliser les valeurs: SoundCloud retourne des valeurs 0-1, mais certaines APIs retournent 0-255
									const normalizedV = v > 1 ? v / 255 : v;
									const h = Math.max(1, Math.round(normalizedV * 80));
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
			
			{/* Élément audio HTML5 caché pour l'analyse Meyda en continu */}
			<audio 
				id="live-analyzer-audio"
								crossOrigin="anonymous"
				preload="auto"
				style={{ display: "none" }}
			/>
			
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
								// Inverser l'index pour afficher de gauche à droite
								const reversedI = barCount - 1 - i;
								// Calculer l'index du sample avec interpolation
								const sampleRatio = reversedI / Math.max(1, barCount - 1);
								const sampleIndex = Math.floor(sampleRatio * (waveformSamples!.length - 1));
								const v = waveformSamples![sampleIndex] ?? 0;
								// Normaliser les valeurs: SoundCloud retourne des valeurs 0-1, mais certaines APIs retournent 0-255
								const normalizedV = v > 1 ? v / 255 : v;
								// Clamper la valeur normalisée entre 0 et 1 pour éviter les hauteurs inattendues
								const clampedV = Math.max(0, Math.min(1, normalizedV));
								const h = Math.max(1, Math.round(clampedV * 80));
								// Valider et clamper progress entre 0 et 1
								const validProgress = Math.max(0, Math.min(1, progress ?? 0));
								const played = i / Math.max(1, barCount) <= validProgress;
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
					{/* Controls centered (mobile) / Play centered (desktop) */}
					<div className="fixed inset-0 z-[30] pointer-events-none">
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex items-center gap-8 md:gap-4">
							{/* Mute button (mobile only, to the left of play) */}
							<button 
								onClick={handleMuteToggle}
								className="w-14 h-14 md:hidden flex items-center justify-center hover:opacity-80 transition-opacity"
								title={isMuted ? "Activer le son" : "Couper le son"}
							>
								{isMuted ? (
									<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className={(isStory || isFamily || isShop || isAgenda || isPresse) ? 'text-black' : playerColor}>
										<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
									</svg>
								) : (
									<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className={(isStory || isFamily || isShop || isAgenda || isPresse) ? 'text-black' : playerColor}>
										<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
									</svg>
								)}
							</button>
							{/* Play button */}
					<button 
						onClick={handlePlayPause}
								disabled={isLoadingRandomTrack}
								className="w-24 h-24 md:w-40 md:h-40 flex items-center justify-center hover:opacity-80 transition-opacity disabled:cursor-not-allowed"
							>
								{isLoadingRandomTrack ? (
									<div className={`w-12 h-12 md:w-16 md:h-16 border-4 border-t-transparent border-r-transparent ${(isStory || isFamily || isShop || isAgenda || isPresse) ? 'border-black' : 'border-yellow-400'} rounded-full animate-spin`}></div>
								) : isPlaying ? (
									<div className="flex gap-1">
										<div className={`w-1.5 h-10 md:w-2 md:h-12 ${(isStory || isFamily || isShop || isAgenda || isPresse) ? 'bg-black' : playerBgColor}`}></div>
										<div className={`w-1.5 h-10 md:w-2 md:h-12 ${(isStory || isFamily || isShop || isAgenda || isPresse) ? 'bg-black' : playerBgColor}`}></div>
							</div>
						) : (
									<svg width="48" height="36" viewBox="0 0 64 48" fill="none" className="ml-2">
										<path d="M16 0L52 24L16 48V0Z" fill={(isStory || isFamily || isShop || isAgenda || isPresse) ? "#000000" : "#FACC15"}/>
									</svg>
						)}
					</button>
							{/* Skip button (mobile only, to the right of play) */}
					<button
						onClick={() => { try { widgetRef.current?.next(); } catch {} }}
								className="w-14 h-14 md:hidden flex items-center justify-center hover:opacity-80 transition-opacity"
						title="Suivant"
					>
								<svg width="32" height="32" viewBox="0 0 24 24" fill={(isStory || isFamily || isShop || isAgenda || isPresse) ? "#000000" : "currentColor"} className={(isStory || isFamily || isShop || isAgenda || isPresse) ? 'text-black' : playerColor}>
							<path d="M7 6l7 6-7 6V6zm9 0h2v12h-2V6z" />
						</svg>
					</button>
						</div>
					</div>

					{/* Desktop: Mute and title left */}
					<div className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-[25] px-4 items-center gap-6">
						{/* Mute button */}
					<button 
						onClick={handleMuteToggle}
							className="w-14 h-14 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
						title={isMuted ? "Activer le son" : "Couper le son"}
					>
						{isMuted ? (
								<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={(isStory || isFamily || isShop || isAgenda || isPresse) ? 'text-black' : playerColor}>
								<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
							</svg>
						) : (
								<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={(isStory || isFamily || isShop || isAgenda || isPresse) ? 'text-black' : playerColor}>
								<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
							</svg>
						)}
					</button>
						{/* Title */}
						<div className={`${playerColor}`}>
							<div className="font-title text-base leading-tight">{trackTitle || ""}</div>
							<AutoScrollText text={artistName || ""} className={`font-text text-sm ${isStory ? 'text-cyan-400/80' : (isFamily ? 'text-green-500/80' : (isShop ? 'text-red-500/80' : (isPresse ? 'text-purple-500/80' : playerColor)))} mt-0.5`} />
						</div>
						{/* Reduce button */}
						<button 
							onClick={() => setIsPlayerExpanded(false)}
							className="w-14 h-14 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
							title="Réduire le player"
						>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={playerColor}>
								<path d="M15 6l-6 6 6 6"/>
							</svg>
						</button>
					</div>

					{/* Desktop: Skip button right */}
					<div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-[30] items-center">
						<button
							onClick={() => { try { widgetRef.current?.next(); } catch {} }}
							className="w-28 h-28 flex items-center justify-center hover:opacity-80 transition-opacity"
							title="Suivant"
						>
							<svg width="48" height="48" viewBox="0 0 24 24" fill={(isStory || isFamily || isShop || isAgenda || isPresse) ? "#000000" : "currentColor"} className={(isStory || isFamily || isShop || isAgenda || isPresse) ? 'text-black' : playerColor}>
								<path d="M7 6l7 6-7 6V6zm9 0h2v12h-2V6z" />
						</svg>
						</button>
				</div>

					{/* Title left bottom above waveform (mobile only) */}
					<div className={`fixed bottom-28 left-4 z-[25] md:hidden ${isShop ? 'text-black' : playerColor}`}>
						<div className="max-w-[200px]">
							<div className="font-title text-sm leading-tight truncate">{trackTitle || ""}</div>
							<AutoScrollText text={artistName || ""} className={`font-text text-xs ${isShop ? 'text-black/80' : (isStory ? 'text-cyan-400/80' : (isFamily ? 'text-green-500/80' : (isPresse ? 'text-purple-500/80' : playerColor)))} mt-0.5`} />
			</div>
		</div>
				</>
			)}
		</>
	);
}
