"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_CHROME_QUERY, DEMO_QUERY, DEMO_SCENES, type DemoScene } from "./demo-script";
import { runDemoActions } from "./demo-actions";
import { menuEvents, soundCloudEvents, shopEvents } from "@/lib/events/app-events";

type RunState = "idle" | "playing" | "paused" | "done";

function cleanupDemoSideEffects() {
	menuEvents.itemHover(false, null);
	soundCloudEvents.playerHover(false);
	shopEvents.itemHovered(false, null);
	shopEvents.itemSelected(false);
}

function PortfolioDemoDirectorInner() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const isDemo = searchParams.get(DEMO_QUERY) === "1";
	// Capture propre par défaut : overlay masqué. Afficher le témoin avec &chrome=1
	const showChrome = searchParams.get(DEMO_CHROME_QUERY) === "1";
	const chromeHidden = !showChrome;

	const [runState, setRunState] = useState<RunState>("idle");
	const [sceneIndex, setSceneIndex] = useState(0);
	const [sceneProgress, setSceneProgress] = useState(0);

	const abortRef = useRef<AbortController | null>(null);
	const pausedRef = useRef(false);
	const runIdRef = useRef(0);
	const progressRafRef = useRef<number | null>(null);

	const scenes = DEMO_SCENES;
	const scene: DemoScene | undefined = scenes[sceneIndex];
	const totalScenes = scenes.length;

	const navigate = useCallback(
		(path: string) => {
			router.push(path);
		},
		[router]
	);

	const stopProgressLoop = useCallback(() => {
		if (progressRafRef.current != null) {
			cancelAnimationFrame(progressRafRef.current);
			progressRafRef.current = null;
		}
	}, []);

	const startProgressLoop = useCallback(
		(durationMs: number, startedAt: number) => {
			stopProgressLoop();
			let pausedTotal = 0;
			let pauseStartedAt: number | null = null;
			let wasPaused = false;

			const tick = () => {
				const now = performance.now();
				if (pausedRef.current) {
					if (!wasPaused) {
						pauseStartedAt = now;
						wasPaused = true;
					}
				} else if (wasPaused && pauseStartedAt != null) {
					pausedTotal += now - pauseStartedAt;
					pauseStartedAt = null;
					wasPaused = false;
				}

				if (!pausedRef.current) {
					const elapsed = now - startedAt - pausedTotal;
					setSceneProgress(Math.min(1, elapsed / durationMs));
					if (elapsed >= durationMs) {
						progressRafRef.current = null;
						return;
					}
				}

				progressRafRef.current = requestAnimationFrame(tick);
			};
			progressRafRef.current = requestAnimationFrame(tick);
		},
		[stopProgressLoop]
	);

	const resetToIdle = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = null;
		pausedRef.current = false;
		stopProgressLoop();
		cleanupDemoSideEffects();
		setRunState("idle");
		setSceneIndex(0);
		setSceneProgress(0);
	}, [stopProgressLoop]);

	const playFrom = useCallback(
		async (startIndex: number) => {
			const runId = ++runIdRef.current;
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;
			pausedRef.current = false;
			setRunState("playing");

			try {
				for (let i = startIndex; i < scenes.length; i++) {
					if (controller.signal.aborted || runId !== runIdRef.current) return;

					const current = scenes[i];
					setSceneIndex(i);
					setSceneProgress(0);

					const sceneStartedAt = performance.now();
					startProgressLoop(current.durationMs, sceneStartedAt);

					const actionsPromise = runDemoActions(current.actions, {
						navigate,
						signal: controller.signal,
						chromeHidden,
						isPaused: () => pausedRef.current,
					});

					const minDurationPromise = (async () => {
						let pausedTotal = 0;
						let pauseStartedAt: number | null = null;
						let wasPaused = false;
						for (;;) {
							if (controller.signal.aborted) {
								throw new DOMException("Aborted", "AbortError");
							}
							const now = performance.now();
							if (pausedRef.current) {
								if (!wasPaused) {
									pauseStartedAt = now;
									wasPaused = true;
								}
							} else if (wasPaused && pauseStartedAt != null) {
								pausedTotal += now - pauseStartedAt;
								pauseStartedAt = null;
								wasPaused = false;
							}

							const elapsed = now - sceneStartedAt - pausedTotal;
							if (!pausedRef.current && elapsed >= current.durationMs) break;
							await new Promise((r) => setTimeout(r, 50));
						}
					})();

					await Promise.all([actionsPromise, minDurationPromise]);
					setSceneProgress(1);
					cleanupDemoSideEffects();
				}

				if (runId === runIdRef.current && !controller.signal.aborted) {
					setRunState("done");
					stopProgressLoop();
				}
			} catch (error) {
				if (!(error instanceof DOMException && error.name === "AbortError")) {
					console.warn("[demo] run interrupted", error);
				}
			}
		},
		[chromeHidden, navigate, scenes, startProgressLoop, stopProgressLoop]
	);

	const handlePlay = useCallback(() => {
		if (runState === "paused") {
			pausedRef.current = false;
			setRunState("playing");
			return;
		}
		const start = runState === "done" ? 0 : sceneIndex;
		void playFrom(start);
	}, [playFrom, runState, sceneIndex]);

	const handlePause = useCallback(() => {
		pausedRef.current = true;
		setRunState("paused");
	}, []);

	const handleSkip = useCallback(() => {
		abortRef.current?.abort();
		cleanupDemoSideEffects();
		if (sceneIndex >= totalScenes - 1) {
			setRunState("done");
			setSceneProgress(1);
			return;
		}
		void playFrom(sceneIndex + 1);
	}, [playFrom, sceneIndex, totalScenes]);

	const handleRestart = useCallback(() => {
		abortRef.current?.abort();
		cleanupDemoSideEffects();
		setSceneIndex(0);
		setSceneProgress(0);
		void playFrom(0);
	}, [playFrom]);

	useEffect(() => {
		if (!isDemo) {
			resetToIdle();
			return;
		}
		const t = window.setTimeout(() => {
			void playFrom(0);
		}, 600);
		return () => window.clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isDemo]);

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
			stopProgressLoop();
			cleanupDemoSideEffects();
		};
	}, [stopProgressLoop]);

	const progressLabel = useMemo(() => {
		if (!scene) return "";
		return `${sceneIndex + 1} / ${totalScenes}`;
	}, [scene, sceneIndex, totalScenes]);

	if (!isDemo) return null;

	// Mode capture : orchestration invisible — uniquement le site à l'écran
	if (!showChrome) {
		return null;
	}

	return (
		<div
			className="fixed z-[30000] pointer-events-none"
			style={{
				left: "clamp(12px, 2vw, 24px)",
				bottom: "calc(var(--waveform-height, 100px) + 16px)",
				right: "clamp(12px, 2vw, 24px)",
				maxWidth: 520,
			}}
			aria-live="polite"
		>
			<div
				className="pointer-events-auto"
				style={{
					background: "rgba(0,0,0,0.72)",
					color: "#fff",
					padding: "14px 16px",
					borderLeft: "3px solid #FF6A00",
					backdropFilter: "blur(8px)",
				}}
			>
				<div className="flex items-baseline justify-between gap-3 mb-2">
					<span className="font-title uppercase tracking-[0.14em] text-[10px] text-white/70">
						portfolio demo · {progressLabel}
					</span>
					{scene?.note ? (
						<span className="font-text text-[10px] text-white/50 truncate max-w-[55%]">
							{scene.note}
						</span>
					) : null}
				</div>

				<p className="font-text text-[13px] md:text-[14px] leading-snug m-0">
					{scene?.caption ?? "—"}
				</p>

				<div
					className="mt-3 h-[2px] w-full overflow-hidden"
					style={{ background: "rgba(255,255,255,0.15)" }}
				>
					<div
						style={{
							height: "100%",
							width: `${sceneProgress * 100}%`,
							background: "#FF6A00",
						}}
					/>
				</div>

				<div className="mt-3 flex flex-wrap gap-2">
					{runState === "playing" ? (
						<button
							type="button"
							onClick={handlePause}
							className="font-title uppercase text-[10px] tracking-wider px-2.5 py-1 bg-white text-black hover:opacity-80"
						>
							Pause
						</button>
					) : (
						<button
							type="button"
							onClick={handlePlay}
							className="font-title uppercase text-[10px] tracking-wider px-2.5 py-1 bg-[#FF6A00] text-black hover:opacity-80"
						>
							{runState === "done" ? "Replay" : "Play"}
						</button>
					)}
					<button
						type="button"
						onClick={handleSkip}
						className="font-title uppercase text-[10px] tracking-wider px-2.5 py-1 border border-white/30 text-white hover:bg-white/10"
					>
						Skip
					</button>
					<button
						type="button"
						onClick={handleRestart}
						className="font-title uppercase text-[10px] tracking-wider px-2.5 py-1 border border-white/30 text-white hover:bg-white/10"
					>
						Restart
					</button>
				</div>
			</div>
		</div>
	);
}

export default function PortfolioDemoDirector() {
	return (
		<Suspense fallback={null}>
			<PortfolioDemoDirectorInner />
		</Suspense>
	);
}
