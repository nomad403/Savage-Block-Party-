"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface Track {
	id: string;
	title: string;
	artist: string;
	artwork: string;
	url: string;
}

export default function SoundCloudPlayer() {
	const pathname = usePathname();
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
	const [tracks, setTracks] = useState<Track[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const widgetRef = useRef<any>(null);

	// Charger les tracks depuis SoundCloud API
	useEffect(() => {
		const loadTracks = async () => {
			try {
				// Utiliser l'API SoundCloud publique (sans client_id requis)
				const response = await fetch(`https://api.soundcloud.com/resolve?url=https://soundcloud.com/savageblockpartys&client_id=YOUR_CLIENT_ID`);
				const userData = await response.json();
				
				// Récupérer les tracks de l'utilisateur
				const tracksResponse = await fetch(`https://api.soundcloud.com/users/${userData.id}/tracks?client_id=YOUR_CLIENT_ID`);
				const tracksData = await tracksResponse.json();
				
				// Vérifier que data est un tableau
				const tracks = Array.isArray(tracksData) ? tracksData : (tracksData.collection || []);
				
				// Mapper les données SoundCloud
				const mappedTracks: Track[] = tracks.map((track: any) => ({
					id: track.id.toString(),
					title: track.title,
					artist: track.user.username,
					artwork: track.artwork_url || track.user.avatar_url,
					url: track.permalink_url
				}));
				
				setTracks(mappedTracks);
				
				// Sélectionner un track aléatoire
				if (mappedTracks.length > 0) {
					const randomTrack = mappedTracks[Math.floor(Math.random() * mappedTracks.length)];
					setCurrentTrack(randomTrack);
				}
			} catch (error) {
				console.error('Erreur lors du chargement des tracks:', error);
				// Fallback avec des tracks d'exemple basés sur le profil réel
				const fallbackTracks: Track[] = [
					{
						id: "1",
						title: "Savage Block Party Mix",
						artist: "Savage Block Party",
						artwork: "/home/images/logo_orange.png",
						url: "https://soundcloud.com/savageblockpartys"
					},
					{
						id: "2", 
						title: "Underground Vibes",
						artist: "Savage Block Party",
						artwork: "/home/images/logo_orange.png",
						url: "https://soundcloud.com/savageblockpartys"
					},
					{
						id: "3",
						title: "Block Party Anthem",
						artist: "Savage Block Party", 
						artwork: "/home/images/logo_orange.png",
						url: "https://soundcloud.com/savageblockpartys"
					}
				];
				setTracks(fallbackTracks);
				const randomTrack = fallbackTracks[Math.floor(Math.random() * fallbackTracks.length)];
				setCurrentTrack(randomTrack);
			} finally {
				setIsLoading(false);
			}
		};

		loadTracks();
	}, []);

	// Initialiser le widget SoundCloud
	useEffect(() => {
		if (!currentTrack) return;

		// Charger l'API SoundCloud
		const script = document.createElement('script');
		script.src = 'https://w.soundcloud.com/player/api.js';
		document.head.appendChild(script);

		script.onload = () => {
			// @ts-ignore
			const widget = window.SC.Widget(document.getElementById('soundcloud-widget'));
			widgetRef.current = widget;

			widget.bind(window.SC.Widget.Events.READY, () => {
				widget.bind(window.SC.Widget.Events.PLAY, () => setIsPlaying(true));
				widget.bind(window.SC.Widget.Events.PAUSE, () => setIsPlaying(false));
				widget.bind(window.SC.Widget.Events.FINISH, () => handleNextTrack());
			});
		};

		return () => {
			if (widgetRef.current) {
				widgetRef.current.unbind(window.SC.Widget.Events.READY);
				widgetRef.current.unbind(window.SC.Widget.Events.PLAY);
				widgetRef.current.unbind(window.SC.Widget.Events.PAUSE);
				widgetRef.current.unbind(window.SC.Widget.Events.FINISH);
			}
		};
	}, [currentTrack]);

	// Ne pas afficher sur les autres pages
	if (pathname !== "/") return null;

	const handlePlayPause = () => {
		if (widgetRef.current) {
			widgetRef.current.toggle();
		}
	};

	const handleNextTrack = () => {
		if (tracks.length === 0) return;
		const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
		setCurrentTrack(randomTrack);
		setIsPlaying(false);
	};

	const handleMuteToggle = () => {
		if (widgetRef.current) {
			widgetRef.current.toggleMute();
			setIsMuted(!isMuted);
		}
	};

	if (isLoading || !currentTrack) {
		return (
			<div className="fixed bottom-20 left-0 right-0 z-25 container-px">
				<div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/20">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 bg-yellow-400/20 rounded-lg animate-pulse"></div>
						<div>
							<div className="w-32 h-4 bg-yellow-400/20 rounded animate-pulse mb-2"></div>
							<div className="w-24 h-3 bg-muted/20 rounded animate-pulse"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed bottom-20 left-0 right-0 z-25 container-px">
			<div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/20">
				<div className="flex items-center justify-between">
					{/* Info track */}
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-lg overflow-hidden">
							<img 
								src={currentTrack.artwork} 
								alt={currentTrack.title}
								className="w-full h-full object-cover"
							/>
						</div>
						<div>
							<p className="text-yellow-400 font-text font-semibold text-sm truncate max-w-[200px]">
								{currentTrack.title}
							</p>
							<p className="text-muted/60 font-text text-xs truncate max-w-[200px]">
								{currentTrack.artist}
							</p>
						</div>
					</div>

					{/* Contrôles */}
					<div className="flex items-center gap-3">
						<button 
							onClick={handlePlayPause}
							className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-300 transition-colors"
						>
							{isPlaying ? (
								<div className="flex gap-1">
									<div className="w-1 h-4 bg-black"></div>
									<div className="w-1 h-4 bg-black"></div>
								</div>
							) : (
								<div className="w-0 h-0 border-l-[6px] border-l-black border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1"></div>
							)}
						</button>
						
						<button 
							onClick={handleMuteToggle}
							className="text-yellow-400 hover:text-yellow-300 transition-colors"
							title={isMuted ? "Activer le son" : "Couper le son"}
						>
							{isMuted ? (
								<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
									<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
								</svg>
							) : (
								<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
									<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
								</svg>
							)}
						</button>
						
						<button 
							onClick={handleNextTrack}
							className="text-yellow-400 hover:text-yellow-300 transition-colors"
							title="Track aléatoire"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
							</svg>
						</button>
					</div>
				</div>

				{/* Widget SoundCloud caché */}
				<iframe
					id="soundcloud-widget"
					width="100%"
					height="166"
					scrolling="no"
					frameBorder="no"
					src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(currentTrack.url)}&color=ff6a00&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&buying=false&sharing=false&download=false`}
					className="hidden"
				/>
			</div>
		</div>
	);
}
