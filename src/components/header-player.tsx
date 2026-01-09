"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGlobalDynamicColors } from "../hooks/useGlobalDynamicColors";
import { usePagePrimaryColor } from "../hooks/usePagePrimaryColor";
import { useMenuHover } from "../hooks/useMenuHover";

export default function HeaderPlayer() {
    const [isHovered, setIsHovered] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [trackTitle, setTrackTitle] = useState<string>("Savage Block Party");
    const [artistName, setArtistName] = useState<string>("Latest tracks");
    const pathname = usePathname();
    const isAgenda = pathname?.startsWith("/agenda");
    const isShop = pathname?.startsWith("/shop");
    
    // Utiliser les hooks centralisés
    const { colors } = useGlobalDynamicColors();
    const pagePrimaryColor = usePagePrimaryColor();
    const { isMenuHovered } = useMenuHover();

    // Écouter les événements du player SoundCloud
    useEffect(() => {
        const handlePlay = () => {
            console.log('🎵 HeaderPlayer: Play event received');
            setIsPlaying(true);
        };
        const handlePause = () => {
            console.log('🎵 HeaderPlayer: Pause event received');
            setIsPlaying(false);
        };
        const handleTrackChange = (event: CustomEvent) => {
            console.log('🎵 HeaderPlayer: Track change event received', event.detail);
            const title = event.detail?.title;
            const artist = event.detail?.artist;
            if (title) {
                setTrackTitle(title);
            }
            if (artist) {
                setArtistName(artist);
            }
        };

        window.addEventListener('soundcloud-play', handlePlay as EventListener);
        window.addEventListener('soundcloud-pause', handlePause as EventListener);
        window.addEventListener('soundcloud-track-change', handleTrackChange as EventListener);

        return () => {
            window.removeEventListener('soundcloud-play', handlePlay as EventListener);
            window.removeEventListener('soundcloud-pause', handlePause as EventListener);
            window.removeEventListener('soundcloud-track-change', handleTrackChange as EventListener);
        };
    }, []);

    // LOGIQUE GLOBALE : Si un menu est survolé, le fond devient noir, sinon couleur primaire
    const backgroundColor = isMenuHovered ? '#000000' : pagePrimaryColor;
    // Textes : blancs sur fond noir, noirs sur fond coloré
    // Exception page shop mobile : texte blanc au hover du menu (même si fond n'est pas noir)
    const textColor = (isMenuHovered || backgroundColor === '#000000' || isAgenda) ? '#FFFFFF' : '#000000';
    
    // Références pour forcer les couleurs avec !important sur la page shop mobile
    const titleRef = useRef<HTMLDivElement>(null);
    const artistRef = useRef<HTMLDivElement>(null);
    const prevButtonRef = useRef<HTMLButtonElement>(null);
    const nextButtonRef = useRef<HTMLButtonElement>(null);
    
    // Forcer les couleurs avec !important sur mobile au hover du menu
    useEffect(() => {
        // Détecter si on est sur mobile (avec gestion du resize)
        const checkMobile = () => {
            return typeof window !== 'undefined' && window.innerWidth <= 767;
        };
        
        const isMobile = checkMobile();
        
        // Sur toutes les pages mobile, forcer le texte et les boutons en blanc au hover du menu
        // car le fond devient noir (backgroundColor = '#000000' quand isMenuHovered)
        if (isMenuHovered && isMobile) {
            if (titleRef.current) {
                titleRef.current.style.setProperty('color', '#FFFFFF', 'important');
            }
            if (artistRef.current) {
                artistRef.current.style.setProperty('color', '#FFFFFF', 'important');
            }
            if (prevButtonRef.current) {
                prevButtonRef.current.style.setProperty('color', '#FFFFFF', 'important');
                // Forcer aussi les SVG à l'intérieur du bouton
                const svg = prevButtonRef.current.querySelector('svg');
                if (svg) {
                    svg.style.setProperty('color', '#FFFFFF', 'important');
                    svg.style.setProperty('fill', '#FFFFFF', 'important');
                }
            }
            if (nextButtonRef.current) {
                nextButtonRef.current.style.setProperty('color', '#FFFFFF', 'important');
                // Forcer aussi les SVG à l'intérieur du bouton
                const svg = nextButtonRef.current.querySelector('svg');
                if (svg) {
                    svg.style.setProperty('color', '#FFFFFF', 'important');
                    svg.style.setProperty('fill', '#FFFFFF', 'important');
                }
            }
        } else {
            // Restaurer les couleurs normales (basées sur textColor)
            if (titleRef.current) {
                titleRef.current.style.setProperty('color', textColor, 'important');
            }
            if (artistRef.current) {
                artistRef.current.style.setProperty('color', textColor, 'important');
            }
            if (prevButtonRef.current) {
                prevButtonRef.current.style.setProperty('color', textColor, 'important');
                const svg = prevButtonRef.current.querySelector('svg');
                if (svg) {
                    svg.style.setProperty('color', textColor, 'important');
                    svg.style.setProperty('fill', textColor, 'important');
                }
            }
            if (nextButtonRef.current) {
                nextButtonRef.current.style.setProperty('color', textColor, 'important');
                const svg = nextButtonRef.current.querySelector('svg');
                if (svg) {
                    svg.style.setProperty('color', textColor, 'important');
                    svg.style.setProperty('fill', textColor, 'important');
                }
            }
        }
    }, [isMenuHovered, textColor]);

    const handlePlayPause = () => {
        // Envoyer l'événement au player SoundCloud
        // L'état sera mis à jour via les événements soundcloud-play/pause
        window.dispatchEvent(new CustomEvent('soundcloud-play-pause'));
    };

    const handlePrevious = () => {
        window.dispatchEvent(new CustomEvent('soundcloud-previous'));
    };

    const handleNext = () => {
        window.dispatchEvent(new CustomEvent('soundcloud-next'));
    };

    return (
        <div className="flex items-center gap-1.5 md:gap-3">
            {/* Icône shop retirée - maintenant dans le header à côté du burger */}
            <div
                className="header-player flex items-center gap-1.5 md:gap-3 relative rounded-full px-2 py-1.5 md:px-4 md:py-2 transition-all duration-200"
                style={{ 
                    backgroundColor: backgroundColor,
                    opacity: 0.9
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Contrôles */}
                <div className="flex items-center gap-1 md:gap-2">
                {/* Bouton précédent - révélé au hover sur desktop, toujours visible sur mobile */}
                <motion.button
                    initial={{ opacity: 0, width: 0 }}
                    animate={{
                        opacity: isHovered ? 1 : 0,
                        width: isHovered ? 24 : 0,
                    }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    onClick={handlePrevious}
                    className="hidden md:flex h-6 items-center justify-center hover:opacity-80 transition-opacity overflow-hidden flex-shrink-0"
                    style={{ color: textColor, pointerEvents: isHovered ? 'auto' : 'none' }}
                    title="Précédent"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6V6zm11 6l-7-6v12l7-6z" />
                    </svg>
                </motion.button>
                
                {/* Bouton précédent mobile - toujours visible */}
                <button
                    ref={prevButtonRef}
                    onClick={handlePrevious}
                    className="md:hidden h-5 w-5 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
                    style={{ color: textColor }}
                    title="Précédent"
                >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6V6zm11 6l-7-6v12l7-6z" />
                    </svg>
                </button>

                {/* Bouton play - change de taille au hover sur desktop, taille fixe sur mobile */}
                <motion.button
                    animate={{
                        width: isHovered ? 24 : 32,
                        height: isHovered ? 24 : 32,
                    }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    onClick={handlePlayPause}
                    className="hidden md:flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0 rounded-full"
                    style={{ 
                        backgroundColor: '#FFFFFF',
                        color: '#000000'
                    }}
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <motion.div 
                            className="flex items-center"
                            animate={{
                                gap: isHovered ? "4px" : "6px",
                            }}
                            style={{ gap: isHovered ? 4 : 6 }}
                        >
                            <motion.div 
                                className="bg-black"
                                animate={{
                                    width: isHovered ? 3 : 4,
                                    height: isHovered ? 12 : 16,
                                }}
                                style={{ backgroundColor: '#000000' }}
                            />
                            <motion.div 
                                className="bg-black"
                                animate={{
                                    width: isHovered ? 3 : 4,
                                    height: isHovered ? 12 : 16,
                                }}
                                style={{ backgroundColor: '#000000' }}
                            />
                        </motion.div>
                    ) : (
                        <motion.div 
                            className="w-0 h-0 border-t-transparent border-b-transparent"
                            animate={{
                                borderLeftWidth: isHovered ? 6 : 10,
                                borderTopWidth: isHovered ? 4 : 7,
                                borderBottomWidth: isHovered ? 4 : 7,
                                marginLeft: isHovered ? 1 : 2,
                            }}
                            style={{ borderLeftColor: '#000000' }}
                        />
                    )}
                </motion.button>
                
                {/* Bouton play mobile - taille fixe compacte */}
                <button
                    onClick={handlePlayPause}
                    className="md:hidden w-7 h-7 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0 rounded-full"
                    style={{ 
                        backgroundColor: '#FFFFFF',
                        color: '#000000'
                    }}
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <div className="flex items-center gap-1">
                            <div className="bg-black w-1.5 h-2.5" />
                            <div className="bg-black w-1.5 h-2.5" />
                        </div>
                    ) : (
                        <div className="w-0 h-0 border-t-transparent border-b-transparent border-l-[6px] border-t-[4px] border-b-[4px] border-l-black ml-0.5" />
                    )}
                </button>

                {/* Bouton suivant - révélé au hover sur desktop, toujours visible sur mobile */}
                <motion.button
                    initial={{ opacity: 0, width: 0 }}
                    animate={{
                        opacity: isHovered ? 1 : 0,
                        width: isHovered ? 24 : 0,
                    }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    onClick={handleNext}
                    className="hidden md:flex h-6 items-center justify-center hover:opacity-80 transition-opacity overflow-hidden flex-shrink-0"
                    style={{ color: textColor, pointerEvents: isHovered ? 'auto' : 'none' }}
                    title="Suivant"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 6l7 6-7 6V6zm9 0h2v12h-2V6z" />
                    </svg>
                </motion.button>
                
                {/* Bouton suivant mobile - toujours visible */}
                <button
                    ref={nextButtonRef}
                    onClick={handleNext}
                    className="md:hidden h-5 w-5 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
                    style={{ color: textColor }}
                    title="Suivant"
                >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 6l7 6-7 6V6zm9 0h2v12h-2V6z" />
                    </svg>
                </button>
                </div>

                {/* Infos titre/artiste - visibles sur mobile maintenant qu'on est en bas */}
                <div className="flex flex-col min-w-0 max-w-[140px] md:max-w-[200px]">
                    <div 
                        ref={titleRef}
                        className="font-title text-[10px] md:text-xs leading-tight truncate"
                        style={{ color: textColor }}
                    >
                        {trackTitle}
                    </div>
                    <div 
                        ref={artistRef}
                        className="font-text text-[9px] md:text-[10px] mt-0.5 truncate opacity-70"
                        style={{ color: textColor }}
                    >
                        {artistName}
                    </div>
                </div>
            </div>
        </div>
    );
}

