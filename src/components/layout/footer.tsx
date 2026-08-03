"use client";

import { useEffect, useState } from "react";
import { useScrollZIndex } from "@/hooks/useScrollZIndex";
import { HeaderPlayer } from "@/components/layout";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { usePageContext } from "@/hooks/usePageContext";

export default function Footer() {
	const { waveformZIndex } = useScrollZIndex();
	const isMobile = useIsMobile();
	const { isFamily } = usePageContext();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	// Écouter l'événement d'ouverture des dropdowns de la page family
	useEffect(() => {
		const handleDropdownOpen = (event: CustomEvent<{ isOpen: boolean }>) => {
			setIsDropdownOpen(event.detail.isOpen);
		};

		window.addEventListener('family-dropdown-open', handleDropdownOpen as EventListener);
		return () => {
			window.removeEventListener('family-dropdown-open', handleDropdownOpen as EventListener);
		};
	}, []);

	// Réinitialiser l'état du dropdown quand on quitte la page family
	// Pour éviter que le player reste masqué sur les autres pages
	useEffect(() => {
		if (!isFamily) {
			setIsDropdownOpen(false);
		}
	}, [isFamily]);

	// Masquer la waveform dès que les boutons Family apparaissent (mobile + desktop)
	const shouldHideWaveform = isDropdownOpen;
	// Player mobile : masqué avec la waveform sur Family
	const shouldHideMobilePlayer = isMobile && isDropdownOpen;
	
	return (
		<>
			{/* Player audio mobile - centré au-dessus de la waveform */}
			{/* Utilise var(--waveform-height) pour le bottom */}
			<div 
				className="footer-mobile-player fixed left-0 right-0 w-screen flex justify-center items-center px-4 pb-3 md:hidden"
				style={{ 
					bottom: 'var(--waveform-height)',
					zIndex: waveformZIndex + 1,
					opacity: shouldHideMobilePlayer ? 0 : 1,
					transform: shouldHideMobilePlayer ? 'translateY(24px)' : 'translateY(0)',
					pointerEvents: shouldHideMobilePlayer ? 'none' : 'auto',
					transition: 'opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1), transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), bottom 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
				}}
			>
				<div className="w-full max-w-sm flex justify-center">
					<HeaderPlayer />
				</div>
			</div>
			
			{/* Waveform SoundCloud - Utilise var(--waveform-height) pour la hauteur */}
			<div 
				className="fixed bottom-0 left-0 right-0 w-screen"
				style={{ 
					zIndex: waveformZIndex,
					opacity: shouldHideWaveform ? 0 : 1,
					transform: shouldHideWaveform ? 'translateY(100%)' : 'translateY(0)',
					pointerEvents: shouldHideWaveform ? 'none' : 'auto',
					transition: 'opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1), transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
				}}
			>
				<div 
					id="sbp-footer-waveform" 
					className="w-screen bg-transparent"
					style={{ height: 'var(--waveform-height)' }}
				></div>
			</div>
		</>
	);
}

