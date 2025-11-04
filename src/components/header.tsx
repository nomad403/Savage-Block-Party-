"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useGlobalDynamicColors } from "../hooks/useGlobalDynamicColors";

export default function Header() {
    const [open, setOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const pathname = usePathname();
    const isHome = pathname === "/";
    const isAgenda = pathname?.startsWith("/agenda");
    const isStory = pathname?.startsWith("/story");
    const isFamily = pathname?.startsWith("/family");
    const isPresse = pathname?.startsWith("/presse");
    
    // Utiliser les couleurs dynamiques globales
    const { colors, currentTheme, isTransitioning } = useGlobalDynamicColors();
    
    const barColor = isHome ? "bg-yellow-400" : (isFamily ? "bg-green-500" : (isPresse ? "bg-purple-500" : "bg-black")); // couleur dynamique sur home, vert sur family, violet sur presse, noir ailleurs
    const logoClass = isHome ? "logo-tint-yellow" : (isStory ? "logo-tint-cyan" : (isFamily ? "logo-tint-green" : (isPresse ? "logo-tint-purple" : "logo-tint-black")));
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

    // Gérer la visibilité du header au scroll sur mobile
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Seulement sur mobile (écrans < 768px)
            if (window.innerWidth >= 768) {
                setIsVisible(true);
                return;
            }

            // Masquer quand on scroll vers le bas, montrer quand on scroll vers le haut ou au top
            if (currentScrollY < 10) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else if (currentScrollY < lastScrollY) {
                setIsVisible(true);
            }
            
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

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
            <motion.header 
                className={`container-px h-24 flex items-center z-[60] relative ${headerBg} ${isAgenda ? 'shadow-lg' : ''}`}
                initial={{ y: 0 }}
                animate={{ y: isVisible ? 0 : -96 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <div className="w-1/3 flex items-center">
                    {!isHome && (
                        <span className={`font-title uppercase tracking-wide text-sm ${isAgenda ? "text-black" : (isStory ? "text-cyan-400" : (isFamily ? "text-green-500" : (isPresse ? "text-purple-500" : "text-black")))}`}>
                            {pageLabel}
                        </span>
                    )}
                </div>
                <div className="w-1/3 flex justify-center">
                    <Image className={logoClass} src="/home/images/logo_orange.png" alt="Savage Block Party" width={180} height={45} priority />
                </div>
                <div className="w-1/3 flex justify-end">
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
                                    open ? 'top-1/2 -translate-y-1/2 rotate-45' : ''
                                }`}
                                style={{ backgroundColor: isHome ? colors.primary : (isStory ? '#22D3EE' : (isFamily ? '#22C55E' : (isPresse ? '#A855F7' : '#000000'))) }}
                            />
                            {/* Barre du milieu */}
                            <span 
                                className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 block h-[2px] transition-all duration-300 ease-in-out ${
                                    open ? 'opacity-0' : 'opacity-100'
                                }`}
                                style={{ backgroundColor: isHome ? colors.primary : (isStory ? '#22D3EE' : (isFamily ? '#22C55E' : (isPresse ? '#A855F7' : '#000000'))) }}
                            />
                            {/* Barre du bas */}
                            <span 
                                className={`absolute left-0 right-0 bottom-1 block h-[2px] transition-all duration-300 ease-in-out ${
                                    open ? 'top-1/2 -translate-y-1/2 -rotate-45' : ''
                                }`}
                                style={{ backgroundColor: isHome ? colors.primary : (isStory ? '#22D3EE' : (isFamily ? '#22C55E' : (isPresse ? '#A855F7' : '#000000'))) }}
                            />
					</div>
				</button>
                </div>
			</motion.header>

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
                                        className={`menu-link w-full font-title uppercase text-4xl sm:text-5xl md:text-6xl leading-none ${isAgenda ? 'menu-link-agenda' : ''} ${isStory ? 'menu-link-story' : ''} ${isFamily ? 'menu-link-family' : ''} ${isPresse ? 'menu-link-presse' : ''}`}
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

