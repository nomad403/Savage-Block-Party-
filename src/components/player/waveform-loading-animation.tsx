"use client";

import { useEffect, useRef } from "react";

const LOOP_MS = 1600;
const OUTRO_MS = 520;
const BAR_WIDTH_PX = 3;
const COLUMN_GAP_PX = 1.5;

type WaveformLoadingAnimationProps = {
	color: string;
	maxHeight?: number;
	/** Même nombre de barres que la timeline finale */
	barCount?: number;
	/** true dès que les samples / image waveform sont disponibles */
	isDataReady: boolean;
	/** appelé uniquement après la fin de la boucle + outro */
	onOutroComplete: () => void;
};

/**
 * Animation vivante de la waveform pendant le chargement.
 * Quand les données arrivent, on termine la boucle en cours puis un outro
 * avant de céder la place à la vraie waveform.
 */
export default function WaveformLoadingAnimation({
	color,
	maxHeight = 88,
	barCount = 300,
	isDataReady,
	onOutroComplete,
}: WaveformLoadingAnimationProps) {
	const barsRef = useRef<(HTMLDivElement | null)[]>([]);
	const isDataReadyRef = useRef(isDataReady);
	const onOutroCompleteRef = useRef(onOutroComplete);
	const phaseRef = useRef<"loop" | "outro">("loop");
	const loopStartRef = useRef(0);
	const outroStartRef = useRef(0);
	const prevTRef = useRef(0);
	const completedRef = useRef(false);
	const barCountRef = useRef(barCount);

	useEffect(() => {
		isDataReadyRef.current = isDataReady;
	}, [isDataReady]);

	useEffect(() => {
		onOutroCompleteRef.current = onOutroComplete;
	}, [onOutroComplete]);

	useEffect(() => {
		barCountRef.current = barCount;
	}, [barCount]);

	useEffect(() => {
		let rafId = 0;
		loopStartRef.current = performance.now();
		phaseRef.current = "loop";
		prevTRef.current = 0;
		completedRef.current = false;

		const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
		const easeInOut = (t: number) =>
			t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

		const heightAt = (x: number, t: number, breath = true) => {
			const traveling = Math.sin((x - t) * Math.PI * 2) * 0.5 + 0.5;
			const secondary = Math.sin((x * 3 + t * Math.PI * 2) * Math.PI) * 0.5 + 0.5;
			const breathAmt = breath ? 0.55 + 0.45 * Math.sin(t * Math.PI * 2) : 0.9;
			const energy = (traveling * 0.72 + secondary * 0.28) * breathAmt;
			return 0.12 + energy * 0.88;
		};

		const paint = (now: number) => {
			if (completedRef.current) return;
			const bars = barsRef.current;
			const count = barCountRef.current;

			if (phaseRef.current === "loop") {
				const elapsed = now - loopStartRef.current;
				const t = (elapsed % LOOP_MS) / LOOP_MS;
				const prevT = prevTRef.current;
				prevTRef.current = t;

				for (let i = 0; i < count; i++) {
					const x = i / Math.max(1, count - 1);
					const h = Math.max(2, Math.round(heightAt(x, t) * maxHeight));
					const bar = bars[i];
					if (bar) bar.style.height = `${h}px`;
				}

				// Fin de boucle (t proche de 1, ou wrap) + données prêtes → outro
				const reachedLoopEnd =
					t >= 0.985 || (prevT > 0.9 && t < prevT);
				if (
					isDataReadyRef.current &&
					reachedLoopEnd &&
					elapsed >= LOOP_MS * 0.98
				) {
					phaseRef.current = "outro";
					outroStartRef.current = now;
				}
			}

			if (phaseRef.current === "outro") {
				const outroT = Math.min(1, (now - outroStartRef.current) / OUTRO_MS);
				const wipe = easeInOut(outroT);

				for (let i = 0; i < count; i++) {
					const x = i / Math.max(1, count - 1);
					const base = heightAt(x, 0.999, false);
					const edge = Math.min(1, Math.max(0, (x - wipe) / 0.18 + 1));
					const damp = edge * (1 - easeOutCubic(outroT) * 0.9);
					const h = Math.max(0, Math.round(base * damp * maxHeight));
					const bar = bars[i];
					if (bar) bar.style.height = `${h}px`;
				}

				if (outroT >= 1) {
					completedRef.current = true;
					onOutroCompleteRef.current();
					return;
				}
			}

			rafId = requestAnimationFrame(paint);
		};

		rafId = requestAnimationFrame(paint);
		return () => cancelAnimationFrame(rafId);
	}, [maxHeight, barCount]);

	return (
		<div
			className="h-full w-full items-end"
			style={{
				display: "grid",
				gridTemplateColumns: `repeat(${barCount}, minmax(0, 1fr))`,
				columnGap: COLUMN_GAP_PX,
			}}
			aria-hidden
		>
			{Array.from({ length: barCount }).map((_, i) => (
				<div
					key={i}
					ref={(el) => {
						barsRef.current[i] = el;
					}}
					style={{
						height: 2,
						width: BAR_WIDTH_PX,
						backgroundColor: color,
						willChange: "height",
					}}
				/>
			))}
		</div>
	);
}
