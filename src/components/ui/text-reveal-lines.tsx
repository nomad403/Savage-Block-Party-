"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMenu } from "@/hooks/useMenu";

type Density = "tight" | "normal" | "loose";
type Typography = "cy" | "hanson";

interface Props {
	text?: string;
	color?: string;
	className?: string;
	delayStep?: number;
	horizontalPadding?: number;
	itemIndex?: number;
	itemDelay?: number;
	density?: Density;
	typography?: Typography;
	startInset?: number;
	endInset?: number;
	lines?: string[];
	instant?: boolean;
}

// Configuration spécifique pour chaque typographie
type TypographyConfig = {
	lineHeight: Record<Density, string>;
	verticalOffset: number; // Ajustement vertical pour le centrage (en pixels, positif = descend, négatif = monte)
	heightAdjustment: number; // Ajustement de hauteur du background (en pixels, positif = réduit, négatif = augmente)
};

const TYPOGRAPHY_CONFIG: Record<Typography, TypographyConfig> = {
	cy: {
		lineHeight: {
			tight: "1.0", // Interlignage serré pour que les fonds se touchent sans se superposer (baseline uniforme en majuscules)
			normal: "1.2",
			loose: "1.5"
		},
		verticalOffset: 0, // Ajusté dynamiquement basé sur les descenders profonds
		heightAdjustment: 0 // Pas d'ajustement supplémentaire, utilise la mesure réelle
	},
	hanson: {
		lineHeight: {
			tight: "1.1",
			normal: "1.15",
			loose: "1.3"
		},
		verticalOffset: 0, // Ajusté dynamiquement, Hanson est plus compacte
		heightAdjustment: 0 // Pas d'ajustement supplémentaire, utilise la mesure réelle
	}
};

export default function TextRevealLines({ 
	text, 
	color = "#22D3EE", 
	className = "", 
	delayStep = 0.12, 
	horizontalPadding = 0, 
	itemIndex = 0, 
	itemDelay = 0,
	density = "normal",
	typography = "cy",
	startInset = 0,
	endInset = 0,
	lines: explicitLines,
	instant = false
}: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLSpanElement>(null);
	const [lineRects, setLineRects] = useState<DOMRect[]>([]);
	const [activeLines, setActiveLines] = useState<Set<number>>(new Set());
	const animatedContentRef = useRef<string>("");
	const { isMenuOpen } = useMenu();

	// Préparer le texte
	const displayText = useMemo(() => {
		return explicitLines ? explicitLines.join('\n') : (text || '');
	}, [explicitLines, text]);

	// Créer une clé unique pour identifier le contenu
	const contentKey = useMemo(() => {
		return explicitLines ? explicitLines.join('|') : text || '';
	}, [explicitLines, text]);

	// Configuration typographique
	const config = useMemo(() => {
		const { lineHeight, verticalOffset, heightAdjustment } = TYPOGRAPHY_CONFIG[typography];
		return {
			lineHeight: lineHeight[density],
			verticalOffset,
			heightAdjustment,
			paddingLeft: horizontalPadding + startInset,
			paddingRight: horizontalPadding + endInset,
		};
	}, [typography, density, horizontalPadding, startInset, endInset]);

	// Mesurer les lignes réelles avec calcul de la distance entre lignes
	useLayoutEffect(() => {
		if (!textRef.current || !displayText) {
			setLineRects([]);
			return;
		}

		const measureLines = () => {
			if (!textRef.current || !containerRef.current) return;

			try {
				const range = document.createRange();
				range.selectNodeContents(textRef.current);
				const rawRects = Array.from(range.getClientRects());

				if (rawRects.length === 0) {
					setLineRects([]);
					return;
				}

				const containerRect = containerRef.current.getBoundingClientRect();
				
				// Lire la vraie line-height CSS calculée (grille typographique fixe)
				const computed = window.getComputedStyle(textRef.current);
				const lineHeight = parseFloat(computed.lineHeight);

				// Grouper les rects par ligne réelle (tolérance de 2px)
				const threshold = 2;
				const grouped: Array<{ top: number; left: number; right: number; width: number; rects: DOMRect[] }> = [];

				rawRects.forEach(rect => {
					const existing = grouped.find(r =>
						Math.abs(r.top - rect.top) < threshold
					);

					if (existing) {
						// Fusion horizontale : étendre la largeur
						const left = Math.min(existing.left, rect.left);
						const right = Math.max(existing.right, rect.right);
						existing.left = left;
						existing.right = right;
						existing.width = right - left;
						existing.rects.push(rect);
					} else {
						// Nouvelle ligne
						grouped.push({
							top: rect.top,
							left: rect.left,
							right: rect.right,
							width: rect.width,
							rects: [rect]
						});
					}
				});

				// Trier par top pour ordonner les lignes
				const sorted = grouped.sort((a, b) => a.top - b.top);

				// Utiliser la line-height comme grille typographique fixe
				// Positionner chaque background en multiple exact de line-height
				const finalRects = sorted.map((group, index) => {
					// Top basé sur la grille typographique (multiple exact de line-height)
					const top = index * lineHeight;
					
					// Hauteur fixe = line-height (pas de calcul à partir des rects)
					const height = lineHeight;

					return new DOMRect(
						group.left - containerRect.left,
						top,
						group.width,
						height
					);
				});

				setLineRects(finalRects);
			} catch (error) {
				console.warn('Error measuring text lines:', error);
				setLineRects([]);
			}
		};

		// Mesurer après le rendu
		const timeoutId = setTimeout(() => {
			requestAnimationFrame(() => {
				requestAnimationFrame(measureLines);
			});
		}, 0);

		// Observer les changements de taille
		const resizeObserver = new ResizeObserver(() => {
			measureLines();
		});

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		// Attendre le chargement des polices
		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(() => {
				requestAnimationFrame(measureLines);
			}).catch(() => {});
		}

		return () => {
			clearTimeout(timeoutId);
			resizeObserver.disconnect();
		};
	}, [displayText, className, config.lineHeight, config.verticalOffset, config.heightAdjustment]);

	// Réinitialiser l'état quand le contenu change
	useEffect(() => {
		if (animatedContentRef.current !== contentKey) {
			setActiveLines(new Set());
			animatedContentRef.current = contentKey;
		}
	}, [contentKey]);

	// Gérer l'animation des lignes
	useEffect(() => {
		if (!displayText || lineRects.length === 0 || animatedContentRef.current !== contentKey) return;

		const baseDelay = instant ? 0 : (itemDelay + itemIndex * 0.1) * 1000;

		lineRects.forEach((_, index) => {
			const lineDelay = baseDelay + (instant ? 0 : index * delayStep * 1000);
			
			if (lineDelay === 0) {
				setActiveLines(prev => new Set([...prev, index]));
			} else {
				setTimeout(() => {
					setActiveLines(prev => new Set([...prev, index]));
				}, lineDelay);
			}
		});
	}, [contentKey, displayText, lineRects.length, itemIndex, itemDelay, delayStep, instant]);

	return (
		<div 
			ref={containerRef}
			className={`relative transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
			suppressHydrationWarning
			style={{ lineHeight: config.lineHeight }}
		>
			{/* Backgrounds positionnés absolument avec hauteur basée sur la distance réelle entre lignes */}
			{lineRects.map((rect, index) => (
				<div
					key={`line-bg-${index}`}
					className="reveal-line-bg"
					style={{
						position: 'absolute',
						top: `${rect.top}px`,
						left: `${rect.left - config.paddingLeft}px`,
						width: `${rect.width + config.paddingLeft + config.paddingRight}px`,
						height: `${rect.height}px`, // Hauteur = distance réelle entre lignes (lineGap)
						backgroundColor: color,
						transform: activeLines.has(index) ? 'scaleX(1)' : 'scaleX(0)',
						transformOrigin: 'left center',
						transition: 'transform 700ms ease-out',
						zIndex: 1, // Au-dessus des logos (z-index 0) mais en dessous du texte (z-index 2)
					}}
				/>
			))}

			{/* Texte rendu normalement */}
			<span
				ref={textRef}
				className={`text-on-thermal ${className}`}
				style={{
					display: 'inline',
					position: 'relative',
					zIndex: 2, // Au-dessus des fonds TRL (z-index 1) et des logos (z-index 0)
				}}
			>
				{displayText}
			</span>
		</div>
	);
}
