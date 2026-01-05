"use client";

import { useScrollZIndex } from "@/hooks/useScrollZIndex";

export default function Footer() {
	const { waveformZIndex } = useScrollZIndex();
	
	return (
		<div 
			className="fixed bottom-0 left-0 right-0 w-screen"
			style={{ zIndex: waveformZIndex }}
		>
			{/* Waveform SoundCloud uniquement */}
			<div 
				id="sbp-footer-waveform" 
				className="w-screen h-24 bg-transparent"
			></div>
		</div>
	);
}

