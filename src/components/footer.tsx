"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
	const pathname = usePathname();
	const isHome = pathname === "/";
	const isAgenda = pathname?.startsWith("/agenda");
	const isStory = pathname?.startsWith("/story");
	const footerBg = isHome ? "bg-yellow-400" : (isAgenda ? "bg-black" : (isStory ? "bg-cyan-400" : "bg-yellow-400"));
	const footerText = isHome ? "text-black" : (isAgenda ? "text-yellow-400" : (isStory ? "text-black" : "text-black"));
	
	return (
		<div className="fixed bottom-0 left-0 right-0 z-[10000] w-screen">
			{/* Ligne 1: Waveform sans fond sur toute la largeur */}
			<div 
				id="sbp-footer-waveform" 
				className="w-screen h-24 bg-transparent"
			></div>
			
			{/* Ligne 2: Infos avec fond et typo adaptés selon la page */}
			<div className={`${footerBg} ${footerText}`}>
				<div className="container mx-auto px-4 py-3">
					<div className="flex items-center justify-between text-sm font-title">
						{/* Réseaux sociaux */}
						<div className="flex items-center gap-6">
							<a href="#" className="hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
									<path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm0 2h10c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3zm10 1.8a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z"/>
								</svg>
							</a>
							<a href="#" className="hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
									<path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0022 12z"/>
								</svg>
							</a>
							<a href="https://soundcloud.com/savageblockpartys" className="hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">
								<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
									<path d="M17.8 10.3c-.4 0-.8.1-1.1.2-.3-2.6-2.5-4.6-5.2-4.6-1.5 0-2.8.6-3.8 1.6-.2.2-.2.5 0 .7.2.2.5.2.7 0 .8-.8 1.9-1.3 3.1-1.3 2.4 0 4.3 1.9 4.3 4.3v.5c0 .3.2.5.5.5h1.5c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3H8.2c-1.6 0-3-1.3-3-3 0-1.4 1-2.6 2.4-2.9.3-.1.4-.3.4-.6 0-1.6 1.3-2.9 2.9-2.9.3 0 .5-.2 .5-.5s-.2-.5-.5-.5c-2.1 0-3.9 1.5-4.3 3.5-1.8.5-3.1 2.1-3.1 4 0 2.3 1.9 4.1 4.1 4.1h9.6c1.9 0 3.4-1.5 3.4-3.4 0-1.8-1.5-3.3-3.3-3.3z"/>
								</svg>
							</a>
						</div>

						{/* Ville */}
						<div className="text-center">
							Paris, France
						</div>

						{/* Crédit dev */}
						<div>
							<a href="https://nomad403.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
								crafted by nomad403
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}