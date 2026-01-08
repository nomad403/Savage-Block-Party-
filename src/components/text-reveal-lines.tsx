"use client";

import { useEffect, useRef, useState } from "react";
import { useMenu } from "../hooks/useMenu";

type Density = "tight" | "normal" | "loose";

interface Props {
	text?: string; // Texte à découper par \n (optionnel si lines est fourni)
	color?: string;
	className?: string;
	delayStep?: number; // secondes entre lignes
	horizontalPadding?: number; // Padding horizontal en pixels (par défaut 0)
	itemIndex?: number; // Index de l'item pour déclencher l'animation de manière séquentielle
	itemDelay?: number; // Délai en secondes avant de déclencher l'animation pour cet item (par défaut 0)
	density?: Density; // Densité typographique (tight, normal, loose)
	startInset?: number; // Décalage horizontal pour alignement avec le container parent (par défaut 0)
	endInset?: number; // Décalage horizontal à la fin pour alignement avec le container parent (par défaut 0)
	lines?: string[]; // Lignes explicites (optionnel, sinon split par \n)
	instant?: boolean; // Si true, active l'animation immédiatement sans délais (par défaut false)
}

// Line-height selon la densité
const DENSITY_LINE_HEIGHT: Record<Density, string> = {
	tight: "1.05",
	normal: "1.15",
	loose: "1.5"
};

// Gap vertical entre les lignes selon la densité (en pixels)
const DENSITY_GAP: Record<Density, number> = {
	tight: 2,
	normal: 4,
	loose: 8
};

// Ajustement de hauteur du fond selon la densité (en pixels, positif = réduit la hauteur)
const DENSITY_HEIGHT_ADJUSTMENT: Record<Density, number> = {
	tight: 6, // Réduit la hauteur de 6px (3px en haut, 3px en bas) - pour family avec text-4xl
	normal: 0, // Pas d'ajustement - pour presse avec text-sm/base
	loose: -2 // Augmente la hauteur de 2px (1px en haut, 1px en bas) - pour textes larges
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
	startInset = 0,
	endInset = 0,
	lines: explicitLines,
	instant = false
}: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [activeLines, setActiveLines] = useState<Set<number>>(new Set());
	const hasAnimatedRef = useRef(false);
	const { isMenuOpen } = useMenu();

	// Découper le texte en lignes
	const textLines = explicitLines || (text ? text.split('\n').filter(line => line.trim() !== '') : []);

	useEffect(() => {
		// Déclencher l'animation avec un délai basé sur l'index de l'item
		if (!hasAnimatedRef.current && textLines.length > 0) {
			hasAnimatedRef.current = true;
			
			const activateLine = (lineIndex: number) => {
				setActiveLines(prev => new Set([...prev, lineIndex]));
			};

			if (instant) {
				// Mode instantané : activer toutes les lignes immédiatement
				// L'animation CSS se fera en arrière-plan sans bloquer les interactions
				requestAnimationFrame(() => {
					textLines.forEach((_, index) => {
						activateLine(index);
					});
				});
			} else {
				// Mode avec délais progressifs
				const totalDelay = itemDelay + (itemIndex * 0.1);
				
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						if (totalDelay > 0) {
							setTimeout(() => {
								// Activer les lignes progressivement
								textLines.forEach((_, index) => {
									setTimeout(() => {
										activateLine(index);
									}, (totalDelay * 1000) + (index * delayStep * 1000));
								});
							}, totalDelay * 1000);
						} else {
							// Activer les lignes progressivement sans délai initial
							textLines.forEach((_, index) => {
								setTimeout(() => {
									activateLine(index);
								}, index * delayStep * 1000);
							});
						}
					});
				});
			}
		}
	}, [textLines.length, itemIndex, itemDelay, delayStep, instant]);
	
	// Réinitialiser l'état active quand le texte change
	useEffect(() => {
		setActiveLines(new Set());
		hasAnimatedRef.current = false;
	}, [text]);

	const lineHeight = DENSITY_LINE_HEIGHT[density];
	const verticalGap = DENSITY_GAP[density];
	const heightAdjustment = DENSITY_HEIGHT_ADJUSTMENT[density];
	const paddingLeft = horizontalPadding + startInset;
	const paddingRight = horizontalPadding + endInset;

	return (
		<div 
			ref={containerRef} 
			className={`relative transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
			suppressHydrationWarning
			style={{ 
				position: 'relative', 
				overflow: 'visible',
				margin: 0,
				padding: 0,
				display: 'block',
				textAlign: 'left',
				lineHeight: lineHeight
			}}
		>
			{textLines.map((line, index) => (
				<div
					key={index} 
					className="reveal-line-row"
					style={{
						marginBottom: index < textLines.length - 1 ? `${verticalGap}px` : 0
					}}
				>
					<span
						className={`reveal-line text-on-thermal ${className} ${activeLines.has(index) ? 'is-active' : ''}`}
						style={{
							position: 'relative',
							display: 'inline-block',
							margin: 0,
							padding: 0,
							verticalAlign: 'baseline',
							'--reveal-color': color,
							'--reveal-padding-left': `${paddingLeft}px`,
							'--reveal-padding-right': `${paddingRight}px`,
							'--reveal-height-adjustment': `${heightAdjustment}px`,
						} as React.CSSProperties & {
							'--reveal-color': string;
							'--reveal-padding-left': string;
							'--reveal-padding-right': string;
							'--reveal-height-adjustment': string;
						}}
					>
						{line}
					</span>
				</div>
			))}
		</div>
	);
}
