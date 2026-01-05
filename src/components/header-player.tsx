"use client";

import { useEffect, useState } from "react";
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
    const textColor = (isMenuHovered || backgroundColor === '#000000' || isAgenda) ? '#FFFFFF' : '#000000';

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
        <div className="flex items-center gap-3">
            {/* Icône shop - visible sur toutes les pages */}
            <Link 
                href="/shop"
                className="flex items-center justify-center transition-all duration-200 hover:opacity-80"
                style={{ 
                    color: isMenuHovered ? '#000000' : pagePrimaryColor,
                    width: '58px',
                    height: '58px'
                }}
                title="Shop"
            >
                <svg width="29" height="29" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-9.5-14H1v2h2l3.6 7.59-1.35 2.45c-.15.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H7.5z"/>
                </svg>
            </Link>

            <div
                className="header-player flex items-center gap-3 relative rounded-full px-4 py-2 transition-all duration-200"
                style={{ 
                    backgroundColor: backgroundColor,
                    opacity: 0.9
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Contrôles */}
                <div className="flex items-center gap-2">
                {/* Bouton précédent - révélé au hover */}
                <motion.button
                    initial={{ opacity: 0, width: 0 }}
                    animate={{
                        opacity: isHovered ? 1 : 0,
                        width: isHovered ? 24 : 0,
                    }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    onClick={handlePrevious}
                    className="h-6 flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden flex-shrink-0"
                    style={{ color: textColor, pointerEvents: isHovered ? 'auto' : 'none' }}
                    title="Précédent"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6V6zm11 6l-7-6v12l7-6z" />
                    </svg>
                </motion.button>

                {/* Bouton play - change de taille au hover */}
                <motion.button
                    animate={{
                        width: isHovered ? 24 : 32,
                        height: isHovered ? 24 : 32,
                    }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    onClick={handlePlayPause}
                    className="flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0 rounded-full"
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

                {/* Bouton suivant - révélé au hover */}
                <motion.button
                    initial={{ opacity: 0, width: 0 }}
                    animate={{
                        opacity: isHovered ? 1 : 0,
                        width: isHovered ? 24 : 0,
                    }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    onClick={handleNext}
                    className="h-6 flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden flex-shrink-0"
                    style={{ color: textColor, pointerEvents: isHovered ? 'auto' : 'none' }}
                    title="Suivant"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 6l7 6-7 6V6zm9 0h2v12h-2V6z" />
                    </svg>
                </motion.button>
                </div>

                {/* Infos titre/artiste - toujours visibles */}
                <div className="flex flex-col min-w-0 max-w-[200px]">
                    <div 
                        className="font-title text-xs leading-tight truncate"
                        style={{ color: textColor }}
                    >
                        {trackTitle}
                    </div>
                    <div 
                        className="font-text text-[10px] mt-0.5 truncate opacity-70"
                        style={{ color: textColor }}
                    >
                        {artistName}
                    </div>
                </div>
            </div>
        </div>
    );
}

