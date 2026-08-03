"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePageContext } from "@/hooks/usePageContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useGlobalDynamicColors } from "@/hooks/useGlobalDynamicColors";
import { useMenuHover } from "@/hooks/useMenuHover";
import { soundCloudEvents } from "@/lib/events/app-events";
import { useAppEvent } from "@/hooks/useAppEvents";

export default function HeaderPlayer() {
    const [isHovered, setIsHovered] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [trackTitle, setTrackTitle] = useState<string>("Savage Block Party");
    const [artistName, setArtistName] = useState<string>("Latest tracks");
    // Utiliser le hook centralisé pour la détection de page
    const { isAgenda, isShop } = usePageContext();
    const isMobile = useIsMobile();
    
    // Utiliser les hooks centralisés
    const { colors } = useGlobalDynamicColors();

    // Écouter les événements du player SoundCloud
    useAppEvent('soundcloud-play', () => {
            console.log('🎵 HeaderPlayer: Play event received');
            setIsPlaying(true);
    });

    useAppEvent('soundcloud-pause', () => {
            console.log('🎵 HeaderPlayer: Pause event received');
            setIsPlaying(false);
    });

    useAppEvent('soundcloud-track-change', (event) => {
            console.log('🎵 HeaderPlayer: Track change event received', event.detail);
        const title = event.detail.title;
        const artist = event.detail.artist;
            if (title) {
                setTrackTitle(title);
            }
            if (artist) {
                setArtistName(artist);
            }
    });

    // LOGIQUE CENTRALISÉE : Utiliser les couleurs depuis useGlobalDynamicColors
    // Toute la logique de couleur est centralisée dans useGlobalDynamicColors
    // Cela garantit la cohérence et évite les conflits
    const backgroundColor = colors.playerBgColor;
    const textColor = colors.playerTextColor; // Couleur centralisée et robuste
    
    // Les couleurs sont appliquées via styles inline sur chaque élément
    // Les classes CSS conditionnelles (shop-item-selected, menu-hovered) gèrent les cas spéciaux
    // Plus besoin de manipulation DOM directe avec setProperty

    const handlePlayPause = () => {
        // Optimistic UI — confirmé ensuite par soundcloud-play/pause
        setIsPlaying((prev) => !prev);
        soundCloudEvents.playPause();
    };

    const handlePrevious = () => {
        soundCloudEvents.previous();
    };

    const handleNext = () => {
        soundCloudEvents.next();
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
            onMouseEnter={() => {
                if (isMobile) return;
                setIsHovered(true);
                soundCloudEvents.playerHover(true);
            }}
            onMouseLeave={() => {
                if (isMobile) return;
                setIsHovered(false);
                soundCloudEvents.playerHover(false);
            }}
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
                        className="font-title text-[10px] md:text-xs leading-tight truncate"
                        style={{ color: textColor }}
                >
                    {trackTitle}
                </div>
                <div 
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

