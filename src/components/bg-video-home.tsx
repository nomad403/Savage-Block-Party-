"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

declare global {
	interface Window {
		onYouTubeIframeAPIReady: () => void;
		YT: any;
	}
}

export default function BgVideoHome() {
	const pathname = usePathname();
	const containerRef = useRef<HTMLDivElement>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [shouldLoad, setShouldLoad] = useState(false);
	const [isPlayerReady, setIsPlayerReady] = useState(false);

	const VIDEO_ID = "e-1_tkJCuUs";

	useEffect(() => {
		// Désactiver le scroll sur la home
		if (pathname === "/") {
			document.body.style.overflow = "hidden";
			document.documentElement.style.overflow = "hidden";
			document.body.classList.add("no-scroll");
			document.documentElement.classList.add("no-scroll");
		} else {
			document.body.style.overflow = "auto";
			document.documentElement.style.overflow = "auto";
			document.body.classList.remove("no-scroll");
			document.documentElement.classList.remove("no-scroll");
		}

		// Cleanup au démontage
		return () => {
			document.body.style.overflow = "auto";
			document.documentElement.style.overflow = "auto";
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

	// Charger l'API YouTube
	useEffect(() => {
		if (!shouldLoad) return;

		// Charger l'API YouTube si pas déjà chargée
		if (!window.YT) {
			const script = document.createElement('script');
			script.src = 'https://www.youtube.com/iframe_api';
			document.head.appendChild(script);
		}

		// Fonction globale pour l'API YouTube
		window.onYouTubeIframeAPIReady = () => {
			if (iframeRef.current) {
				const player = new window.YT.Player(iframeRef.current, {
					events: {
						onReady: (event: any) => {
							// Fade-in après initialisation complète
							setTimeout(() => {
								setIsPlayerReady(true);
								event.target.playVideo();
							}, 500);
						},
					},
				});
			}
		};

		// Si l'API est déjà chargée
		if (window.YT && window.YT.Player) {
			window.onYouTubeIframeAPIReady();
		}
	}, [shouldLoad]);

	if (pathname !== "/") return null;

	const thumb = `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`;
	const src = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&fs=0&cc_load_policy=0&disablekb=1&enablejsapi=1&start=0.1&vq=hd2160`;

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

