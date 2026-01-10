"use client";

import { useEffect, useState } from "react";
import { useScrollZIndex } from "@/hooks/useScrollZIndex";
import { HeaderPlayer } from "@/components/layout";
import { useIsMobile } from "@/hooks/useMediaQuery";

export default function Footer() {
	const { waveformZIndex } = useScrollZIndex();
	const isMobile = useIsMobile();
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

	// Masquer le player et la waveform sur mobile uniquement quand un dropdown est ouvert
	const shouldHidePlayer = isMobile && isDropdownOpen;
	
	return (
		<>
			{/* Player audio mobile - centré au-dessus de la waveform */}
			{/* Utilise var(--waveform-height) pour le bottom */}
			<div 
				className="fixed left-0 right-0 w-screen flex justify-center items-center px-4 pb-3 md:hidden transition-opacity duration-300"
				style={{ 
					bottom: 'var(--waveform-height)', // 72px
					zIndex: waveformZIndex + 1,
					opacity: shouldHidePlayer ? 0 : 1,
					pointerEvents: shouldHidePlayer ? 'none' : 'auto'
				}}
			>
				<div className="w-full max-w-sm flex justify-center">
					<HeaderPlayer />
				</div>
			</div>
			
			{/* Waveform SoundCloud - Utilise var(--waveform-height) pour la hauteur */}
			<div 
				className="fixed bottom-0 left-0 right-0 w-screen transition-opacity duration-300"
				style={{ 
					zIndex: waveformZIndex,
					opacity: shouldHidePlayer ? 0 : 1,
					pointerEvents: shouldHidePlayer ? 'none' : 'auto'
				}}
			>
				<div 
					id="sbp-footer-waveform" 
					className="w-screen bg-transparent"
					style={{ height: 'var(--waveform-height)' }} // 72px
				></div>
			</div>
		</>
	);
}

