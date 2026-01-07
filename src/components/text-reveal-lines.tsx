"use client";

import { useEffect, useRef, useState } from "react";
import { useMenu } from "../hooks/useMenu";

interface Props {
	text: string;
	color?: string;
	className?: string;
	delayStep?: number; // secondes entre lignes
	noPadding?: boolean; // Supprimer le paddingBottom pour coller les items
	horizontalPadding?: number; // Padding horizontal en pixels (par défaut 0)
	itemIndex?: number; // Index de l'item pour déclencher l'animation de manière séquentielle
	itemDelay?: number; // Délai en secondes avant de déclencher l'animation pour cet item (par défaut 0)
}

export default function TextRevealLines({ text, color = "#22D3EE", className = "", delayStep = 0.12, noPadding = false, horizontalPadding = 0, itemIndex = 0, itemDelay = 0 }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const textRef = useRef<HTMLSpanElement | null>(null);
	const [rects, setRects] = useState<Array<{ left: number; top: number; width: number; height: number }>>([]);
	const [active, setActive] = useState(false);
	const [totalHeight, setTotalHeight] = useState<number | null>(null);
	const hasAnimatedRef = useRef(false); // Pour s'assurer que l'animation ne se déclenche qu'une fois
	const { isMenuOpen } = useMenu();

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
			// +1px sur height pour éliminer les hairline gaps (technique pro)
			// On soustrait horizontalPadding pour que les fonds commencent au même endroit que le texte du champ de saisie
			const adjusted = mapped.map((r) => ({
				left: Math.floor(r.left) - horizontalPadding,
				top: Math.floor(r.top),
				width: Math.ceil(r.width),
				height: Math.ceil(r.height) + 1, // Pont anti-trou
			}));
			// Ajuster les positions pour éviter les chevauchements entre lignes
			for (let i = 0; i < adjusted.length; i++) {
				const prev = adjusted[i - 1];
				const curr = adjusted[i];
				const next = adjusted[i + 1];
				let topExp = curr.top;
				let bottomExp = curr.top + curr.height;
				
				// S'assurer qu'il n'y a pas de chevauchement avec la ligne précédente
				if (prev) {
					const prevBottom = prev.top + prev.height;
					if (topExp < prevBottom) {
						// Il y a chevauchement, ajuster pour que les fonds soient collés sans se chevaucher
						topExp = prevBottom;
					}
				}
				
				// S'assurer qu'il n'y a pas de chevauchement avec la ligne suivante
				if (next) {
					const nextTop = next.top;
					if (bottomExp > nextTop) {
						// Il y a chevauchement, ajuster pour que les fonds soient collés sans se chevaucher
						bottomExp = nextTop;
					}
				}
				
				curr.top = topExp;
				curr.height = Math.max(1, bottomExp - topExp);
			}
			
			// Calculer la hauteur totale nécessaire pour le texte (incluant les descendantes)
			let containerHeight: number;
			if (noPadding && textRef.current) {
				// Pour noPadding, utiliser la hauteur réelle du span (incluant les descendantes)
				const spanHeight = textRef.current.scrollHeight || textRef.current.offsetHeight;
				containerHeight = spanHeight > 0 ? spanHeight : textRef.current.getBoundingClientRect().height;
			} else if (adjusted.length > 0) {
				// Calculer la hauteur totale des rects
				const first = adjusted[0];
				const last = adjusted[adjusted.length - 1];
				containerHeight = (last.top + last.height) - first.top;
			} else {
				containerHeight = 0;
			}
			
			// Pour noPadding, garder les rects tels quels - ils sont déjà positionnés correctement
			// par rapport au texte (ils commencent au début du premier caractère)
			// On ne les modifie pas pour qu'ils commencent à 0, on garde leur position d'origine
			let finalRects = adjusted;
			// Les rects calculés avec getClientRects() sont déjà positionnés par rapport au texte
			// donc ils commencent naturellement au début du premier caractère
			
			setTotalHeight(containerHeight > 0 ? Math.ceil(containerHeight) : null);
			
			setRects(finalRects);
			
			// Déclencher l'animation avec un délai basé sur l'index de l'item pour que chaque item s'anime indépendamment
			// Ne déclencher qu'une seule fois par instance
			if (!hasAnimatedRef.current && finalRects.length > 0) {
				hasAnimatedRef.current = true;
				const totalDelay = itemDelay + (itemIndex * 0.1); // Délai de base + délai par index
				if (totalDelay > 0) {
					setTimeout(() => {
						requestAnimationFrame(() => setActive(true));
					}, totalDelay * 1000);
				} else {
			requestAnimationFrame(() => setActive(true));
				}
			}
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
	}, [text, itemIndex, itemDelay]);
	
	// Réinitialiser l'état active et le flag d'animation quand le texte change
	useEffect(() => {
		setActive(false);
		hasAnimatedRef.current = false;
	}, [text]);

	return (
		<div 
			ref={containerRef} 
			className={`relative transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} 
			style={{ 
				position: 'relative', 
				overflow: 'hidden',
				lineHeight: noPadding ? 1 : '1.1', // Minimum sûr pour les glyphes à descendantes, 1 pour coller parfaitement
				margin: 0,
				paddingLeft: horizontalPadding,
				paddingRight: horizontalPadding,
				paddingTop: 0,
				paddingBottom: 0,
				height: totalHeight ?? 'auto', // Forcer la hauteur = somme exacte des rects
				display: 'block', // Important : block au lieu de inline-block
				textAlign: 'left' // Aligner le texte à gauche
			}}
		>
			<span 
				ref={textRef} 
				className={`${className} text-on-thermal`} 
				style={{ 
					position: 'relative', 
					zIndex: 1,
					display: 'inline-block',
					paddingBottom: noPadding ? 0 : '0.15em', // Permet aux glyphes de respirer sans créer d'espace entre items
					margin: 0,
					paddingTop: 0,
					paddingLeft: 0,
					paddingRight: 0,
					lineHeight: noPadding ? 1 : 'inherit',
					verticalAlign: 'top' // Évite tout espacement vertical résiduel
				}}
			>
				{text}
			</span>
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
						transformOrigin: 'left center', // Animation de gauche à droite
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


