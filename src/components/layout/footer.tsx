"use client";

import { useScrollZIndex } from "@/hooks/useScrollZIndex";
import { HeaderPlayer } from "@/components/layout";

export default function Footer() {
	const { waveformZIndex } = useScrollZIndex();
	
	return (
		<>
			{/* Player audio mobile - centré au-dessus de la waveform */}
			{/* Utilise var(--waveform-height) pour le bottom */}
			<div 
				className="fixed left-0 right-0 w-screen flex justify-center items-center px-4 pb-3 md:hidden"
				style={{ 
					bottom: 'var(--waveform-height)', // 72px
					zIndex: waveformZIndex + 1 
				}}
			>
				<div className="w-full max-w-sm flex justify-center">
					<HeaderPlayer />
				</div>
			</div>
			
			{/* Waveform SoundCloud - Utilise var(--waveform-height) pour la hauteur */}
			<div 
				className="fixed bottom-0 left-0 right-0 w-screen"
				style={{ zIndex: waveformZIndex }}
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

