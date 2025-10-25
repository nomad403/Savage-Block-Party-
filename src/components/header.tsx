"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useGlobalDynamicColors } from "../hooks/useGlobalDynamicColors";

export default function Header() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const isHome = pathname === "/";
    const isAgenda = pathname?.startsWith("/agenda");
    const isStory = pathname?.startsWith("/story");
    const isFamily = pathname?.startsWith("/family");
    
    // Utiliser les couleurs dynamiques globales
    const { colors, currentTheme, isTransitioning } = useGlobalDynamicColors();
    
    const barColor = (isHome || isFamily) ? "bg-yellow-400" : "bg-black"; // couleur dynamique sur home et family, noir ailleurs
    const logoClass = isHome ? "logo-tint-yellow" : (isStory ? "logo-tint-cyan" : (isFamily ? "logo-tint-yellow" : "logo-tint-black"));
    const headerBg = isHome ? "bg-transparent" : (isAgenda ? "bg-yellow-400" : "bg-transparent");

    // Fermer le menu lors d'un changement de route
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    // Notifier le player de l'état du menu
    useEffect(() => {
        const event = new CustomEvent('menuToggle', { detail: { isOpen: open } });
        window.dispatchEvent(event);
    }, [open]);

    // Nom de la page affiché à gauche (non-home)
    const pageLabel = (() => {
        if (isHome) return "";
        const first = (pathname || "/").split("/").filter(Boolean)[0] || "";
        if (!first) return "";
        const name = first.replace(/-/g, " ");
        return name.charAt(0).toUpperCase() + name.slice(1);
    })();

	return (
		<>
            <header className={`container-px h-20 flex items-center justify-between z-[60] relative ${headerBg} pt-8`}>
                <div className="min-w-10">
                    {!isHome && (
                        <span className={`font-title uppercase tracking-wide text-sm ${isAgenda ? "text-black" : (isStory ? "text-cyan-400" : (isFamily ? "text-yellow-400" : "text-black"))}`}>
                            {pageLabel}
                        </span>
                    )}
                </div>
                <div className="flex-1 flex justify-center">
                    <Image className={logoClass} src="/home/images/logo_orange.png" alt="Savage Block Party" width={240} height={60} priority />
                </div>
                <button 
					aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} 
					className="flex items-center gap-2" 
					onClick={() => setOpen(!open)}
				>
					<span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
                    <div className="relative w-7 h-7">
						{/* Barre du haut */}
						<span 
							className={`absolute left-0 right-0 top-1 block h-[2px] transition-all duration-300 ease-in-out ${
								open ? 'rotate-45 translate-y-[10px]' : 'rotate-0 translate-y-0'
							}`}
							style={{ backgroundColor: isHome ? colors.primary : (isStory ? '#22D3EE' : (isFamily ? '#FBBF24' : '#000000')) }}
						/>
						{/* Barre du milieu */}
						<span 
							className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 block h-[2px] transition-all duration-300 ease-in-out ${
								open ? 'opacity-0' : 'opacity-100'
							}`}
							style={{ backgroundColor: isHome ? colors.primary : (isStory ? '#22D3EE' : (isFamily ? '#FBBF24' : '#000000')) }}
						/>
						{/* Barre du bas */}
						<span 
							className={`absolute left-0 right-0 bottom-1 block h-[2px] transition-all duration-300 ease-in-out ${
								open ? '-rotate-45 -translate-y-[10px]' : 'rotate-0 translate-y-0'
							}`}
							style={{ backgroundColor: isHome ? colors.primary : (isStory ? '#22D3EE' : (isFamily ? '#FBBF24' : '#000000')) }}
						/>
					</div>
				</button>
			</header>

			<AnimatePresence>
				{open && (
					<motion.div
						key="menu"
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
						className="fixed inset-0 z-50 bg-transparent"
						style={{ color: colors.menuColor }}
					>
						<div className="h-full w-full flex">
                            <nav className="ml-auto h-full w-full flex flex-col justify-center items-end gap-0 pr-10 sm:pr-14">
								{[
									{ href: "/", label: "home" },
									{ href: "/agenda", label: "agenda" },
									{ href: "/story", label: "story" },
									{ href: "/family", label: "family" },
									{ href: "/shop", label: "shop" },
									{ href: "/presse", label: "presse" },
								].map((item) => (
                                    <Link
										key={item.href}
										href={item.href}
                                        className={`menu-link w-full font-title uppercase text-4xl sm:text-5xl md:text-6xl leading-none ${isAgenda ? 'menu-link-agenda' : ''} ${isStory ? 'menu-link-story' : ''}`}
										onClick={() => setOpen(false)}
									>
										<span>{item.label}</span>
									</Link>
								))}
							</nav>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}

