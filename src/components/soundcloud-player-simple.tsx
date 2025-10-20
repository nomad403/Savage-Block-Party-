"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

declare global {
	interface Window {
		SC: any;
	}
}

export default function SoundCloudPlayer() {
	const pathname = usePathname();
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
const [barCount, setBarCount] = useState<number>(160);
	const [progress, setProgress] = useState<number>(0);
	const widgetRef = useRef<any>(null);

	// Ne pas couper les hooks: on garde l'affichage conditionnel plus bas

	// Charger l'API SoundCloud et initialiser le widget
useEffect(() => {
		if (pathname !== "/") return;
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
				const updateFromCurrentSound = () => {
					try {
						widgetRef.current.getCurrentSound((sound: any) => {
							if (!sound) return;
							setTrackTitle(sound.title || "");
							setArtistName(sound.user?.username || "");
							const art = (sound.artwork_url || sound.user?.avatar_url || "/home/images/logo_orange.png") as string;
							// Améliorer la qualité si possible
							setArtworkUrl(art.replace("-large", "-t200x200"));
							setPermalinkUrl(sound.permalink_url || "https://soundcloud.com/savageblockpartys");
							const wf: string | undefined = sound.waveform_url;
							if (wf) {
								if (wf.endsWith('.json')) {
									fetch(wf)
										.then((r) => r.json())
										.then((json) => {
											const samples: number[] = json?.samples || json?.data || [];
											if (samples.length > 0) {
												setWaveformSamples(samples);
												setWaveformImageUrl("");
											}
										})
										.catch(() => {
											setWaveformSamples(null);
											setWaveformImageUrl("");
										});
								} else {
									setWaveformSamples(null);
									setWaveformImageUrl(wf);
								}
							}
							// Mettre à jour la durée exacte pour un seek précis
							try { widgetRef.current.getDuration((ms: number) => setDurationMs(ms || 0)); } catch {}
						});
					} catch {}
				};

				widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
					// Tentative immédiate via la liste des sons
					try {
						widgetRef.current.getSounds((sounds: any[]) => {
							if (sounds && sounds.length > 0) {
								const first = sounds[0];
								setTrackTitle(first.title || "");
								setArtistName(first.user?.username || "");
								const art = (first.artwork_url || first.user?.avatar_url || "/home/images/logo_orange.png") as string;
								setArtworkUrl(art.replace("-large", "-t200x200"));
								setPermalinkUrl(first.permalink_url || "https://soundcloud.com/savageblockpartys");
								const wf0: string | undefined = first.waveform_url || first.visual_waveform_url;
								if (wf0) setWaveformImageUrl(wf0);
								if (typeof first.duration === 'number') setDurationMs(first.duration);
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
			// 2px barre + 1px gap ≈ 3px
			const count = Math.max(60, Math.floor(width / 3));
			setBarCount(count);
		});
		resizeObserver.observe(element);
		return () => resizeObserver.disconnect();
}, [pathname]);

	const handlePlayPause = () => {
		if (!widgetRef.current) return;
		widgetRef.current.isPaused((paused: boolean) => {
			if (paused) {
				widgetRef.current.play();
			} else {
				widgetRef.current.pause();
			}
		});
	};

	const handleMuteToggle = () => {
		if (!widgetRef.current) return;
		if (isMuted) {
			widgetRef.current.setVolume(100);
			setIsMuted(false);
		} else {
			widgetRef.current.setVolume(0);
			setIsMuted(true);
		}
	};

	const handleNextTrack = () => {
		window.open(permalinkUrl || 'https://soundcloud.com/savageblockpartys', '_blank');
	};

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

// Affichage conditionnel déplacé après les hooks pour respecter les règles
if (pathname !== "/") return null;

return (
		<div className="fixed bottom-20 left-0 right-0 z-25 container-px">
			{/* Player minimaliste */}
			<div className="flex items-center gap-4 text-yellow-400 px-4 py-3">
				{/* Image/Artwork */}
				<div className="w-12 h-12 overflow-hidden">
					<img
						src={artworkUrl}
						alt={trackTitle}
						className="w-full h-full object-cover"
					/>
				</div>

				{/* Groupe infos + waveform (sans espace entre eux) */}
				<div className="flex-1 flex items-center gap-0 min-w-0">
					{/* Infos track */}
					<div className="shrink-0 min-w-0 pr-4 max-w-[42vw]">
						<AutoScrollText text={trackTitle || ""} className="font-text font-semibold text-sm" />
						<AutoScrollText text={artistName || ""} className="font-text text-xs text-yellow-400/70 mt-0.5" />
					</div>

					{/* Waveform collée au bloc infos */}
					<div
						ref={waveformRef}
						className="flex-1 select-none cursor-pointer ml-0"
						onClick={(e) => {
							if (!waveformRef.current || !widgetRef.current) return;
							const rect = waveformRef.current.getBoundingClientRect();
							const x = e.clientX - rect.left;
							const rel = Math.max(0, Math.min(1, x / rect.width));
							// Utiliser getDuration via callback pour éviter les valeurs 0/approximatives
							try {
								widgetRef.current.getDuration((ms: number) => {
									const targetMs = (ms || durationMs || 0) * rel;
									if (targetMs > 0) widgetRef.current.seekTo(targetMs);
								});
							} catch {
								if (durationMs > 0) widgetRef.current.seekTo(durationMs * rel);
							}
						}}
					>
						{waveformSamples && waveformSamples.length > 0 ? (
							<div
								className="h-10 w-full items-end"
								style={{ display: "grid", gridTemplateColumns: `repeat(${barCount}, 1fr)`, columnGap: 1 }}
							>
								{Array.from({ length: barCount }).map((_, i) => {
									// Inverser pour remettre dans le bon sens selon les assets SoundCloud
									const sampleIndex = Math.floor(((barCount - 1 - i) / Math.max(1, barCount - 1)) * (waveformSamples.length - 1));
									const v = waveformSamples[sampleIndex] ?? 0;
									const h = Math.max(2, Math.round((v / 255) * 40));
									const played = i / Math.max(1, barCount) <= progress;
									return (
										<div key={i} style={{ height: h }} className={played ? "bg-yellow-400" : "bg-yellow-400/40"} />
									);
								})}
							</div>
						) : waveformImageUrl ? (
							<div className="relative h-10 w-full overflow-hidden" style={{ transform: 'scaleY(-1)' }}>
								<img src={waveformImageUrl} alt="waveform" className="w-full h-full object-cover opacity-40" />
								<div className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}>
									<img src={waveformImageUrl} alt="waveform-progress" className="w-full h-full object-cover" />
								</div>
							</div>
						) : (
							<div className="flex items-end gap-[1px] h-10 w-full">
								{Array.from({ length: barCount }).map((_, i) => {
									const sin = Math.sin((i / Math.max(1, barCount)) * Math.PI);
									const h = Math.max(2, Math.round(sin * 40));
									return <div key={i} style={{ height: h }} className="w-[2px] bg-yellow-400/40" />;
								})}
							</div>
						)}
					</div>
				</div>

				{/* Contrôles */}
				<div className="flex items-center gap-3">
					{/* Bouton Play */}
					<button 
						onClick={handlePlayPause}
						className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-300 transition-colors"
					>
						{isPlaying ? (
							<div className="flex gap-0.5">
								<div className="w-0.5 h-3 bg-black"></div>
								<div className="w-0.5 h-3 bg-black"></div>
							</div>
						) : (
							<div className="w-0 h-0 border-l-[4px] border-l-black border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5"></div>
						)}
					</button>

					{/* Skip (suivant) */}
					<button
						onClick={() => { try { widgetRef.current?.next(); } catch {} }}
						className="text-yellow-400 hover:text-yellow-300 transition-colors"
						title="Suivant"
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path d="M7 6l7 6-7 6V6zm9 0h2v12h-2V6z" />
						</svg>
					</button>

					{/* Bouton Mute */}
					<button 
						onClick={handleMuteToggle}
						className="text-yellow-400 hover:text-yellow-300 transition-colors"
						title={isMuted ? "Activer le son" : "Couper le son"}
					>
						{isMuted ? (
							<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
								<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
							</svg>
						) : (
							<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
								<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
							</svg>
						)}
					</button>

					{/* Icône SoundCloud */}
					<a
						href={permalinkUrl || 'https://soundcloud.com/savageblockpartys'}
						target="_blank"
						rel="noopener noreferrer"
						className="text-yellow-400 hover:text-yellow-300 transition-colors"
						title="Voir sur SoundCloud"
						aria-label="Voir sur SoundCloud"
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path d="M17.8 10.3c-.4 0-.8.1-1.1.2-.3-2.6-2.5-4.6-5.2-4.6-1.5 0-2.8.6-3.8 1.6-.2.2-.2.5 0 .7.2.2.5.2.7 0 .8-.8 1.9-1.3 3.1-1.3 2.4 0 4.3 1.9 4.3 4.3v.5c0 .3.2.5.5.5h1.5c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3H8.2c-1.6 0-3-1.3-3-3 0-1.4 1-2.6 2.4-2.9.3-.1.4-.3.4-.6 0-1.6 1.3-2.9 2.9-2.9.3 0 .5-.2.5-.5s-.2-.5-.5-.5c-2.1 0-3.9 1.5-4.3 3.5-1.8.5-3.1 2.1-3.1 4 0 2.3 1.9 4.1 4.1 4.1h9.6c1.9 0 3.4-1.5 3.4-3.4 0-1.8-1.5-3.3-3.3-3.3z"/>
						</svg>
					</a>
				</div>
			</div>
			{/* Widget SoundCloud caché mais présent dans le DOM */}
			<iframe
				id="soundcloud-widget"
				width="1"
				height="1"
				scrolling="no"
				frameBorder="no"
				allow="autoplay; encrypted-media"
				src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/savageblockpartys&color=ff6a00&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&buying=false&sharing=false&download=false"
				title="Savage Block Party SoundCloud Player"
				style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', left: -9999, top: -9999 }}
			/>
		</div>
	);
}
