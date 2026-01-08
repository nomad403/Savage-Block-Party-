"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useGlobalDynamicColors } from "../hooks/useGlobalDynamicColors";
import { usePagePrimaryColor, getPagePrimaryColor } from "../hooks/usePagePrimaryColor";
import HeaderPlayer from "./header-player";

export default function Header() {
    const [open, setOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);
    const pathname = usePathname();
    const isHome = pathname === "/";
    const isAgenda = pathname?.startsWith("/agenda");
    const isFamily = pathname?.startsWith("/family");
    const isPresse = pathname?.startsWith("/presse");
    
    // Utiliser les couleurs dynamiques globales
    const { colors, currentTheme } = useGlobalDynamicColors();
    const pagePrimaryColor = usePagePrimaryColor();
    
    // Debug: log pour vérifier les changements de couleur
    useEffect(() => {
        if (isHome) {
            const logoElement = document.querySelector('header svg[aria-label="Savage Block Party"]') as SVGElement;
            console.log('🎨 Header - Couleur logo changée:', { 
                primary: colors.primary,
                currentTheme,
                waveformColor: colors.waveformColor,
                fillApplied: logoElement?.style?.fill || 'non appliqué',
                computedFill: logoElement ? window.getComputedStyle(logoElement).fill : 'non trouvé'
            });
        }
    }, [colors.primary, currentTheme, isHome, colors.waveformColor]);
    
    // Couleur du header selon la page
    const headerBg = isHome ? "bg-transparent" : (isAgenda ? "bg-transparent" : "bg-transparent");

    // Fermer le menu lors d'un changement de route
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    // Notifier le player de l'état du menu
    useEffect(() => {
        const event = new CustomEvent('menuToggle', { detail: { isOpen: open } });
        window.dispatchEvent(event);
    }, [open]);

    // Notifier quand un item du menu est survolé (pour changer tous les éléments en noir)
    useEffect(() => {
        const event = new CustomEvent('menuItemHover', { 
            detail: { 
                isHovered: !!hoveredMenuItem,
                itemHref: hoveredMenuItem
            } 
        });
        window.dispatchEvent(event);
    }, [hoveredMenuItem]);

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

    const menuItems = [
        { href: "/", label: "home" },
        { href: "/agenda", label: "agenda" },
        { href: "/family", label: "family" },
        { href: "/shop", label: "shop" },
        { href: "/presse", label: "presse" },
    ];

    /**
     * ========================================
     * GESTION CENTRALISÉE DES COULEURS AU HOVER
     * ========================================
     * 
     * SOURCE UNIQUE DE VÉRITÉ : hoveredMenuItem (état local du header)
     * 
     * RÈGLES :
     * 1. Quand un bouton menu est survolé (hoveredMenuItem !== null) :
     *    - Logo → noir (#000000)
     *    - Texte menu → noir (#000000)
     *    - Overlay global → couleur primaire de la page survolée (via MenuOverlay)
     *    - Fond menu mobile → couleur primaire de la page survolée
     * 
     * 2. Quand aucun bouton n'est survolé (hoveredMenuItem === null) :
     *    - Logo → couleur primaire de la page actuelle
     *    - Texte menu → couleur primaire de la page actuelle
     *    - Overlay global → transparent (via MenuOverlay)
     *    - Fond menu mobile → transparent
     * 
     * COULEURS DES PAGES (source unique : getPagePrimaryColor) :
     * - / → #FF6A00 (orange)
     * - /agenda → #0080FF (bleu)
     * - /family → #22C55E (vert)
     * - /shop → #FF1744 (rouge)
     * - /presse → #A855F7 (violet)
     * 
     * ARCHITECTURE :
     * - Desktop : fonds colorés via CSS ::before (var(--dynamic-menu-hover-bg))
     * - Mobile : fond coloré via JS inline (mobileMenuBgColor)
     * - Overlay global : MenuOverlay (layout.tsx) écoute les événements CustomEvent
     */
    const logoColor = hoveredMenuItem ? "#000000" : pagePrimaryColor;
    const menuTextColor = hoveredMenuItem ? "#000000" : pagePrimaryColor;
    
    // Couleur du fond du menu mobile au hover (utilise getPagePrimaryColor comme source unique)
    const mobileMenuBgColor = hoveredMenuItem ? getPagePrimaryColor(hoveredMenuItem) : "transparent";
    
    // L'overlay global est géré par MenuOverlay (layout.tsx) qui écoute les événements CustomEvent
    // Le hook useMenuHover utilise getPagePrimaryColor pour déterminer la couleur

	return (
		<>
            {/* Overlay déplacé dans layout.tsx (MenuOverlay) pour être au-dessus de tous les stacking contexts */}

            <motion.header 
                className={`h-20 md:h-24 w-full z-[20000] fixed top-0 left-0 right-0 ${headerBg} ${hoveredMenuItem ? 'text-black' : ''}`}
                initial={{ y: 0 }}
                animate={{ y: (isFamily ? 0 : (isVisible ? 0 : -96)) }} // Sur family, toujours visible et fixe
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <div className="h-full flex items-center justify-between px-[clamp(16px,4vw,24px)]">
                    {/* Logo + Menu groupés à gauche */}
                    <div className="flex items-center gap-3 md:gap-4 lg:gap-6 shrink-0 relative z-[20001]">
                        {/* Logo - Protection maximale sur mobile */}
                        <Link 
                            href="/" 
                            className="flex items-center relative z-[20002] header-logo-mobile"
                        >
                            <svg 
                                viewBox="0 0 1731.22 745.69" 
                                className="w-[115px] h-[50px] md:w-[120px] md:h-[52px] relative z-[20003]"
                                style={{
                                    fill: logoColor,
                                    transition: 'fill 0.3s ease-in-out'
                                } as React.CSSProperties}
                                aria-label="Savage Block Party"
                            >
                                <path d="M992.17,459.76c-3.69,15.26-8.34,27.6-15.89,41.85-9.34-19.8-12.25-39.4-11.18-59.87l5.28-101.01-80.15,14.08c-24.69,44.18-47.93,84.37-82.75,121.65,8.38-42.35,28.92-75.48,45.47-112.42-27.63,6.61-61.65,8.33-80.53,23.23-23.31,21.33-36.69,49.15-61.9,68.49l-37.24,5.24c-4.87.69-14.43-10.75-13.86-15.63l6.92-59.47-45.68,3.76-33.52,136.77c-2.44,9.96-6.9,19.24-13.93,28.68-9.21-24.81-11.19-48.52-9.49-74.48l5.63-85.84-79.41,13.12c-24.85,41.39-47.19,82.74-82.25,120.4,5.22-42.7,27.57-71.84,43.57-110.35-38.99,2.58-59.33,20.19-93.2,18.7,28.34-33.94,83.02-52.57,120.26-69.41l85.7-184.16,39.15-3.7c4.99-.47,13.13.37,17.58,1.07,3.97-2.01,11.07-5.64,15.23-7.13,4.85-1.74,14.92,11.73,14.48,17.2-3.67,45.68-10.49,93.22-17.96,138.39,15.74,4.75,28.64,14.23,39.84,28.25l38.7-118.12c5.08-15.51,11.01-37.83,22.98-48.22,14.32-12.42,38.2-5.89,57.22-4.89-1.18,33.23-10.23,62.6-23.42,92.37l-29.52,66.65c-8.79,19.84-14.65,40.74-19.85,63.28l31.05-37.14c9.47-11.33,15.29-25.4,22.54-38.06,33.7-58.84,66.63-116.56,104.09-173.4l32.79-49.75c21.7-32.92,44.06-65.22,75.67-93.47-14.18,34.81-29.46,64.07-46.48,94.32l-52.66,93.57-90.16,147.19,84.59-38.6c30.41-59.83,57.76-120.05,85.47-182.99.13-3.06,56.11-7.09,57.35-3.16l11.32-7.34c3.55-2.3,14.13,5.74,15.28,9.74,2.63,9.19,2.5,24.06,1.13,33.8l-15.85,112.34,29.21,14.02,16.08-43.02c26.49-70.87,73.22-132.64,123.1-189.16,20.69-2.39,70.25,2.52,77.97,25.67,6.99,20.95-8.91,51.03-29.37,59.69-12.77-.76-25.82-12.03-32.92-22.41-59.27,50.86-153.52,179.74-138.59,264.6,26.47-23.47,49.45-46.76,70.5-72.29l61.06-74.03-38.56,16.82c-9.97,4.35-23.81,4.41-33.67.35,33.21-24.9,17.1-21.71,53.69-51.76,32.53-26.71,50.06-48.5,98.92-36.29,5.46,1.36,4.4,18.62,1.56,23.84l-67.71,124.31c-14.41,26.45-25.39,53.57-37.94,80.53l-43.75,93.97c-3.66-8.13-7.48-18.81-5.92-24.53l31.14-114.01-45.46,38.1c-16.03,13.44-31.67,17.92-53.37,13.88-11.26-2.1-24.64-8.24-24.2-22.61.49-15.8,1.61-26.94,3.34-47.12-6.74-.08-19.5,1.36-27.97,3.59l-29.55,122.31ZM928.12,295.67l48.25-11.03,10.54-88.79-26.37,45.17-32.42,54.65ZM526.17,349.78l48.44-11.53,11.2-91.55c-9.51,17.82-17.79,33.11-27.92,50.04l-31.72,53.04Z"/>
                                <path d="M1332.79,523.58c-2.79,2.09-12.63,1.76-15.59,2.34-3.55.69-3.25,11.88-5.95,14.29-24.85,22.24-46.32,41.89-75.47,35.86-6.96-1.44-25.35.28-28.25-5.98-11.59-24.99,54.38-163.66,67.27-197.62-6.12-19.16-47.18-17.49-47.97-40.52,21.57-35.41,57.66-51.61,94.33-67.87,14.64-26.47,26.89-55.45,39.52-86.51l-26.96-3.46c-20.41-25.77-25.64-17.59-36.77-33.93-13.81-20.27,118.24-67.12,131.78-71.85,41.21-14.4,53.76-13.15,99.52-24.91l53.35-13.71c34.08-8.76,67.67-15.76,102.41-22.19,15.75-2.92,28.86-13.33,47.2-3.13l-97.98,50.39c-8.29,4.27-25.04,7.03-31.97,11.24-46.57,28.26-88.8,52.41-139.59,72.75-6.76,2.71-9.63,19.88-11.72,26.75l-17.21,56.68,78.78-12.11c3.62-.56,11.08,1.96,13,3.55,2.57,2.12-2.11,8.72-5.01,11.61-32.74,32.61-66.31,58.52-108.06,79.12-5.54,2.73-16.36,11.95-19.24,17.47l-38.32,73.46-44.62,71.25-23.53,48.68,50.54-40.77,78.46-66.92c39.65-33.82,78.69-65.49,125.43-94.92-28.58,38.68-58.41,70.53-90.55,102.08l-27.14,26.64-27.53,27.5c-17.8,17.78-42.14,39.79-62.16,54.73Z"/>
                                <path d="M171.32,687.44c-35.95,20.91-130.29,72.22-171.32,54.65l32.69-14.14c9.21-3.98,15.14-9.61,22.89-14.52l156.05-98.99c22.69-14.39,138.56-105.53,132.4-139.66-29.27-2.58-82.19,19.47-115.71,18.96l-60.37-24.2c-15.26-34.19,33.7-97.42,55.76-126.98,21.62-28.96,45.21-39.9,74.99-79.88,28.82-38.68,76.39-85.64,128.55-65.65,15.68,6.01,41.33,6.52,54.18,17.67,21.75,18.87,11.32,47.56.12,68.15-11.58,21.3-32.78,72.8-61.61,51.48-4.79-3.55-7.78-15.35-7.61-22.74l1.14-48.85c-28.68,14.82-46.45,31.8-66.61,52.24l-30.28,30.7c-28.9,29.3-54.81,60.57-73.08,97.16l45.37-5.52c32.41-3.95,67.36.35,95.34,20.54,10,7.21,10.02,28.53,6.35,40-10.74,33.53-35.53,55.69-58.52,78.33-12.06,11.89-22.5,22.79-38.69,27.47-12.42,9.65-35.12,33.21-51.47,42.72l-70.59,41.06Z"/>
                            </svg>
                        </Link>

                        {/* Menu horizontal - desktop uniquement */}
                        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                                // NOTE : Sur desktop, les classes menu-link-* ne sont pas utilisées car les liens
                                // n'ont pas la classe .menu-link (pas de fond ::before). L'overlay global gère les couleurs.
                                // Ces classes sont conservées pour cohérence mais n'ont pas d'effet sur desktop.
                                const menuLinkClass = `font-title uppercase text-xs lg:text-sm tracking-wide transition-colors duration-200 opacity-100 ${isActive ? 'menu-item-active' : ''}`;
                                
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={menuLinkClass}
                                        style={{ 
                                            color: isActive ? '#000000' : menuTextColor 
                                        }}
                                        onMouseEnter={() => setHoveredMenuItem(item.href)}
                                        onMouseLeave={() => setHoveredMenuItem(null)}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Icône Panier + Player header - desktop uniquement, à droite */}
                    <div className="hidden md:flex items-center gap-3 shrink-0">
                        {/* Icône Panier - taille proportionnée au logo sur écrans moyens et grands */}
                        <Link 
                            href="/shop"
                            className="flex items-center justify-center transition-all duration-200 hover:opacity-80"
                            style={{ 
                                color: hoveredMenuItem ? '#000000' : pagePrimaryColor,
                                width: '36px', // md: proportionné au logo 120px
                                height: '36px'
                            }}
                            title="Shop"
                            onMouseEnter={() => setHoveredMenuItem("/shop")}
                            onMouseLeave={() => setHoveredMenuItem(null)}
                        >
                            <svg 
                                className="w-[24px] h-[24px] lg:w-[30px] lg:h-[30px]" 
                                viewBox="0 0 24 24" 
                                fill="currentColor"
                            >
                                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-9.5-14H1v2h2l3.6 7.59-1.35 2.45c-.15.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H7.5z"/>
                            </svg>
                        </Link>
                        <HeaderPlayer />
                    </div>

                    {/* Icône Panier + Hamburger menu - mobile uniquement, à droite - Protection maximale */}
                    <div className="md:hidden flex items-center gap-5 shrink-0 relative z-[20001]">
                        {/* Icône Panier - toujours visible sur mobile, taille agrandie pour proportionnalité avec burger */}
                        <Link 
                            href="/shop"
                            className="flex items-center justify-center transition-all duration-200 hover:opacity-80 relative z-[20002]"
                            style={{ 
                                color: hoveredMenuItem ? '#000000' : pagePrimaryColor,
                                width: '32px',
                                height: '32px'
                            }}
                            title="Shop"
                        >
                            <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-9.5-14H1v2h2l3.6 7.59-1.35 2.45c-.15.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H7.5z"/>
                            </svg>
                        </Link>
                        
                        {/* Bouton burger */}
                        <button 
                            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} 
                            className="flex items-center gap-2 relative z-[20002] header-burger-mobile" 
                            onClick={() => setOpen(!open)}
                        >
                            <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
                            <div className="relative w-[22px] h-[22px] z-[20003]">
                            {/* Barre du haut */}
                            <span 
                                className={`absolute left-0 right-0 top-0.5 block h-[1.5px] transition-all duration-300 ease-in-out ${
                                    open ? 'top-1/2 -translate-y-1/2 rotate-45' : ''
                                }`}
                                style={{ backgroundColor: logoColor }}
                            />
                            {/* Barre du milieu */}
                            <span 
                                className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 block h-[1.5px] transition-all duration-300 ease-in-out ${
                                    open ? 'opacity-0' : 'opacity-100'
                                }`}
                                style={{ backgroundColor: logoColor }}
                            />
                            {/* Barre du bas */}
                            <span 
                                className={`absolute left-0 right-0 bottom-0.5 block h-[1.5px] transition-all duration-300 ease-in-out ${
                                    open ? 'top-1/2 -translate-y-1/2 -rotate-45' : ''
                                }`}
                                style={{ backgroundColor: logoColor }}
                            />
					</div>
				</button>
                    </div>
                </div>
			</motion.header>

			{/* Menu mobile fullscreen */}
			<AnimatePresence>
				{open && (
					<>
						{/* Fond coloré - layer séparé (EN DESSOUS de tout) */}
						<motion.div
							key="menu-bg"
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
							className="fixed inset-0 z-[30] md:hidden pointer-events-none"
							style={{ 
								backgroundColor: mobileMenuBgColor,
								transition: 'background-color 0.3s ease'
							}}
						/>
						
						{/* Contenu du menu - layer séparé au-dessus du fond mais en dessous du header */}
						<motion.div
							key="menu-content"
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
							className="fixed inset-0 z-[40] md:hidden"
						>
							<div className="h-full w-full flex">
								<nav className="ml-auto h-full w-full flex flex-col justify-center items-end gap-0 pr-10 sm:pr-14 relative z-[41]">
									{menuItems.map((item) => {
										// Logique de couleur pour les boutons menu mobile :
										// - Bouton survolé → noir (#000000)
										// - Autres boutons → couleur du fond (mobileMenuBgColor) pour se fondre avec le fond
										// - Aucun hover → couleur primaire de la page actuelle
										let buttonColor: string;
										if (hoveredMenuItem === item.href) {
											// Bouton survolé : noir
											buttonColor = "#000000";
										} else if (hoveredMenuItem) {
											// Autre bouton quand un bouton est survolé : couleur du fond
											buttonColor = mobileMenuBgColor !== "transparent" ? mobileMenuBgColor : pagePrimaryColor;
										} else {
											// Aucun hover : couleur primaire de la page actuelle
											buttonColor = pagePrimaryColor;
										}
										
										return (
											<Link
												key={item.href}
												href={item.href}
												className={`menu-link w-full font-title uppercase text-4xl sm:text-5xl leading-none relative z-[42] ${isAgenda ? 'menu-link-agenda' : ''} ${isFamily ? 'menu-link-family' : ''} ${isPresse ? 'menu-link-presse' : ''}`}
												onClick={() => setOpen(false)}
												onMouseEnter={() => setHoveredMenuItem(item.href)}
												onMouseLeave={() => setHoveredMenuItem(null)}
											>
												<span className="relative z-[43]" style={{ 
													color: buttonColor,
													transition: 'color 0.3s ease'
												} as React.CSSProperties}>{item.label}</span>
											</Link>
										);
									})}
								</nav>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
}

