"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

declare global {
	interface Window {
		onYouTubeIframeAPIReady: () => void;
		YT: {
			Player: new (element: HTMLElement, config: unknown) => {
				destroy: () => void;
				playVideo: () => void;
			};
		};
	}
}

export default function BgVideoHome() {
	const pathname = usePathname();
	const containerRef = useRef<HTMLDivElement>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const playerRef = useRef<{ destroy: () => void; playVideo: () => void } | null>(null);
	const [shouldLoad, setShouldLoad] = useState(false);
	const [isPlayerReady, setIsPlayerReady] = useState(false);
	const [isApiLoaded, setIsApiLoaded] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const maxRetries = 3;

	const VIDEO_ID = "e-1_tkJCuUs";

	useEffect(() => {
		// Désactiver le scroll uniquement sur la home
		if (pathname === "/") {
			document.body.style.overflow = "hidden";
			document.documentElement.style.overflow = "hidden";
			document.body.classList.add("no-scroll");
			document.documentElement.classList.add("no-scroll");
		} else {
			// Pour toutes les autres pages, activer le scroll
			document.body.style.overflow = "";
			document.body.style.overflowY = "auto";
			document.documentElement.style.overflow = "";
			document.documentElement.style.overflowY = "auto";
			document.body.classList.remove("no-scroll");
			document.documentElement.classList.remove("no-scroll");
		}

		// Cleanup au démontage
		return () => {
			document.body.style.overflow = "";
			document.body.style.overflowY = "auto";
			document.documentElement.style.overflow = "";
			document.documentElement.style.overflowY = "auto";
			document.body.classList.remove("no-scroll");
			document.documentElement.classList.remove("no-scroll");
		};
	}, [pathname]);

	useEffect(() => {
		if (pathname !== "/") return;
		
		const el = containerRef.current;
		if (!el) return;
		
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setShouldLoad(true);
						io.disconnect();
					}
				});
			},
			{ root: null, rootMargin: "0px", threshold: 0.2 }
		);
		io.observe(el);
		return () => io.disconnect();
	}, [pathname]);

	// Charger l'API YouTube avec gestion d'erreur robuste
	useEffect(() => {
		if (!shouldLoad || isApiLoaded) return;

		const loadYouTubeAPI = async () => {
			try {
				console.log('🔄 Chargement de l\'API YouTube...');
				
				// Charger l'API YouTube si pas déjà chargée
				if (!window.YT) {
					const script = document.createElement('script');
					script.src = 'https://www.youtube.com/iframe_api';
					script.onload = () => {
						console.log('✅ API YouTube chargée');
						setIsApiLoaded(true);
					};
					script.onerror = () => {
						console.error('❌ Erreur chargement API YouTube');
						if (retryCount < maxRetries) {
							setTimeout(() => {
								setRetryCount(prev => prev + 1);
								loadYouTubeAPI();
							}, 2000 * (retryCount + 1));
						}
					};
					document.head.appendChild(script);
				} else {
					setIsApiLoaded(true);
				}
			} catch (error) {
				console.error('❌ Erreur lors du chargement de l\'API YouTube:', error);
			}
		};

		loadYouTubeAPI();
	}, [shouldLoad, isApiLoaded, retryCount, maxRetries]);

	// Initialiser le player YouTube
	useEffect(() => {
		if (!isApiLoaded || !iframeRef.current) return;

		console.log('🎬 Initialisation du player YouTube...');

		// Fonction globale pour l'API YouTube (version robuste)
		window.onYouTubeIframeAPIReady = () => {
			try {
				if (iframeRef.current && window.YT && window.YT.Player) {
					// Nettoyer l'ancien player s'il existe
					if (playerRef.current) {
						playerRef.current.destroy();
						playerRef.current = null;
					}

					const player = new window.YT.Player(iframeRef.current, {
						events: {
							onReady: (event: { target: { destroy: () => void; playVideo: () => void } }) => {
								console.log('✅ Player YouTube prêt');
								playerRef.current = event.target;
								
								// Fade-in après initialisation complète
								setTimeout(() => {
									setIsPlayerReady(true);
									try {
										event.target.playVideo();
									} catch (error) {
										console.warn('⚠️ Erreur playVideo:', error);
									}
								}, 500);
							},
							onError: (event: { data: unknown }) => {
								console.error('❌ Erreur player YouTube:', event.data);
								// Tentative de récupération
								if (retryCount < maxRetries) {
									setTimeout(() => {
										setRetryCount(prev => prev + 1);
										setIsPlayerReady(false);
									}, 3000);
								}
							},
						},
					});
				}
			} catch (error) {
				console.error('❌ Erreur initialisation player YouTube:', error);
			}
		};

		// Si l'API est déjà chargée
		if (window.YT && window.YT.Player) {
			window.onYouTubeIframeAPIReady();
		}
	}, [isApiLoaded, retryCount, maxRetries]);

	// Cleanup au démontage
	useEffect(() => {
		return () => {
			if (playerRef.current) {
				try {
					playerRef.current.destroy();
					playerRef.current = null;
				} catch (error) {
					console.warn('⚠️ Erreur lors du nettoyage du player YouTube:', error);
				}
			}
		};
	}, []);

	if (pathname !== "/") return null;

	const thumb = `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`;
	
	// Générer l'URL YouTube de manière SSR-safe
	const getYouTubeSrc = () => {
		const baseParams = `autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&fs=0&cc_load_policy=0&disablekb=1&enablejsapi=1&start=0.1&vq=hd2160`;
		
		if (typeof window !== 'undefined') {
			return `https://www.youtube.com/embed/${VIDEO_ID}?${baseParams}&origin=${window.location.origin}&widget_referrer=${window.location.href}`;
		}
		
		return `https://www.youtube.com/embed/${VIDEO_ID}?${baseParams}`;
	};
	
	const src = getYouTubeSrc();

	return (
		<div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none">
			{!shouldLoad ? (
				<div 
					className="absolute top-1/2 left-1/2" 
					style={{ 
						width: "100vw", 
						height: "56.25vw", 
						minWidth: "177.78vh", 
						minHeight: "100vh", 
						transform: "translate(-50%, -50%)" 
					}}
				>
					<img
						src={thumb}
						alt="Savage Block Party background video"
						style={{ 
							width: "100%", 
							height: "100%", 
							objectFit: "cover" 
						}}
					/>
				</div>
			) : (
				<div className="relative w-full h-full">
					<iframe
						ref={iframeRef}
						src={src}
						className="absolute top-1/2 left-1/2 transition-opacity duration-1000"
						style={{
							width: "120vw",
							height: "67.5vw",
							minWidth: "213.33vh",
							minHeight: "120vh",
							transform: "translate(-50%, -50%) scale(1.1)",
							border: "none",
							pointerEvents: "none",
							opacity: isPlayerReady ? 1 : 0,
						}}
						allow="autoplay; encrypted-media"
						allowFullScreen={false}
						title="Savage Block Party background video"
					/>
					{/* Overlay transparent pour bloquer les interactions */}
					<div 
						className="absolute inset-0 z-10 pointer-events-none"
						style={{
							width: "100vw",
							height: "100vh",
							top: "0",
							left: "0",
						}}
					/>
				</div>
			)}
		</div>
	);
}

