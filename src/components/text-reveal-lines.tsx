"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
	text: string;
	color?: string;
	className?: string;
	delayStep?: number; // secondes entre lignes
}

export default function TextRevealLines({ text, color = "#22D3EE", className = "", delayStep = 0.12 }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const textRef = useRef<HTMLSpanElement | null>(null);
	const [rects, setRects] = useState<Array<{ left: number; top: number; width: number; height: number }>>([]);
	const [active, setActive] = useState(false);

	useEffect(() => {
		const measure = () => {
			if (!containerRef.current || !textRef.current) return;
			const containerRect = containerRef.current.getBoundingClientRect();
			const range = document.createRange();
			range.selectNodeContents(textRef.current);
			const clientRects = Array.from(range.getClientRects());
			const mapped = clientRects.map((r) => ({
				left: r.left - containerRect.left,
				top: r.top - containerRect.top,
				width: r.width,
				height: r.height,
			}));

			// Ajustement: arrondis pixel + pont entre lignes pour supprimer tout interligne
			const adjusted = mapped.map((r) => ({
				left: Math.floor(r.left),
				top: Math.floor(r.top),
				width: Math.ceil(r.width),
				height: Math.ceil(r.height),
			}));
			for (let i = 0; i < adjusted.length; i++) {
				const prev = adjusted[i - 1];
				const curr = adjusted[i];
				const next = adjusted[i + 1];
				let topExp = curr.top;
				let bottomExp = curr.top + curr.height;
				if (prev) {
					const prevBottom = prev.top + prev.height;
					if (topExp > prevBottom) topExp = prevBottom;
				}
				if (next) {
					const nextTop = next.top;
					if (bottomExp < nextTop) bottomExp = nextTop;
				}
				curr.top = topExp;
				curr.height = Math.max(1, bottomExp - topExp);
			}
			setRects(adjusted);
			requestAnimationFrame(() => setActive(true));
		};

		measure();
		window.addEventListener('resize', measure);
		let roContainer: ResizeObserver | null = null;
		let roText: ResizeObserver | null = null;
		if (window.ResizeObserver) {
			if (containerRef.current) {
				roContainer = new ResizeObserver(() => measure());
				roContainer.observe(containerRef.current);
			}
			if (textRef.current) {
				roText = new ResizeObserver(() => measure());
				roText.observe(textRef.current);
			}
		}
		// @ts-ignore
		if ((document as any).fonts && (document as any).fonts.ready) {
			// @ts-ignore
			(document as any).fonts.ready.then(() => measure()).catch(() => {});
		}
		return () => {
			window.removeEventListener('resize', measure);
			if (roContainer) roContainer.disconnect();
			if (roText) roText.disconnect();
		};
	}, [text]);

	return (
		<div ref={containerRef} className="w-full relative" style={{ position: 'relative' }}>
			<span ref={textRef} className={className} style={{ position: 'relative', zIndex: 1 }}>{text}</span>
			{rects.map((r, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: r.left,
						top: r.top,
						width: r.width,
						height: r.height,
						background: color,
						transformOrigin: 'left center',
						transform: active ? 'scaleX(1)' : 'scaleX(0)',
						transition: 'transform 700ms ease-out',
						transitionDelay: `${i * delayStep}s`,
						zIndex: 0,
						pointerEvents: 'none',
					}}
				/>
			))}
		</div>
	);
}


