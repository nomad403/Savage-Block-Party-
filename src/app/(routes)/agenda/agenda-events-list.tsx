"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMenu } from "@/hooks/useMenu";
import type { EventItem } from "@/lib/api/events";

interface AgendaEventsListProps {
  events: EventItem[];
}

export default function AgendaEventsList({ events }: AgendaEventsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const { isMenuOpen } = useMenu();
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleExpand = (id: string) => {
    const event = events.find(e => e.id === id);
    const hasVideo = event?.image && event.image.includes('.webm');
    
    if (expandedId === id) {
      // Fermer l'item
      setExpandedId(null);
      setIsVideoMode(false);
    } else {
      // Ouvrir l'item
      setExpandedId(id);
      // Si l'événement n'a pas de vidéo attitrée, utiliser la vidéo teaser
      if (!hasVideo) {
        setIsVideoMode(true);
      } else {
        setIsVideoMode(false);
      }
    }
  };

  // Gérer la lecture de la vidéo
  useEffect(() => {
    if (isVideoMode && videoRef.current) {
      videoRef.current.play().catch(console.error);
    } else if (!isVideoMode && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isVideoMode]);

  return (
    <div className={`agenda-scroll relative transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${expandedId ? 'has-expanded' : ''}`}>
      {/* Vidéo teaser en fond quand en mode vidéo */}
      <AnimatePresence>
        {isVideoMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[5] pointer-events-none"
          >
            <video
              ref={videoRef}
              src="/agenda/videos/teaser.webm"
              loop
              muted
              playsInline
              className="w-full h-full object-cover filter-infrared"
            />
            {/* Overlay sombre pour améliorer la lisibilité */}
            <div className="absolute inset-0 bg-[#1f1f1f]/60"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`relative ${isVideoMode ? 'z-[10]' : ''}`}>
      {events.map((event, index) => {
        const eventDate = event.startsAt ? new Date(event.startsAt) : null;
        const formattedDate = eventDate 
          ? eventDate.toLocaleDateString("fr-FR", { 
          day: "numeric", 
          month: "long", 
          year: "numeric" 
            })
          : "";
        const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
        const isExpanded = expandedId === event.id;
        const shouldShow = !isVideoMode || isExpanded; // Afficher uniquement l'item étendu en mode vidéo
        
        // Format de date pour l'affichage (ex: "DECEMBER 3, 2025 AT 17:46 PM")
        const timeString = eventDate 
          ? eventDate.toLocaleTimeString("en-US", { 
              hour: "2-digit", 
              minute: "2-digit",
              hour12: true
            })
          : "";
        const displayDate = eventDate 
          ? `${eventDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase()}${timeString ? ` AT ${timeString.toUpperCase()}` : ""}`
          : "";
        
        return (
          <AnimatePresence key={event.id}>
            {shouldShow && (
              <motion.article
                initial={isVideoMode ? { opacity: 0, y: 20 } : false}
                animate={isVideoMode ? { opacity: 1, y: 0 } : {}}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="mb-8 md:mb-12"
              >
            <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                {/* Date en haut */}
                {displayDate && (
                  <div className="font-title text-xs md:text-sm mb-3 opacity-70">
                    {displayDate}
                  </div>
                )}
                
                {/* Titre principal */}
                <h2 className="font-title uppercase text-xl md:text-2xl lg:text-3xl mb-3 leading-tight">
                  {event.title}
                </h2>
                
                {/* Localisation si disponible */}
                  {event.location && (
                  <div className="font-text text-base md:text-lg mb-3 opacity-80">
                    {event.location}
                  </div>
                  )}
                </div>
              
              {/* Bouton expand/collapse */}
              {event.description && (
                <button
                  onClick={() => toggleExpand(event.id)}
                  className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label={isExpanded ? "Réduire" : "Développer"}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <motion.line 
                      x1="12" 
                      y1="5" 
                      x2="12" 
                      y2="19"
                      initial={false}
                      animate={{ 
                        scaleY: isExpanded ? 0 : 1,
                        opacity: isExpanded ? 0 : 1
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                    <motion.line 
                      x1="5" 
                      y1="12" 
                      x2="19" 
                      y2="12"
                      animate={{ 
                        scaleX: 1,
                        opacity: 1
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                  </svg>
                </button>
              )}
              </div>
              
            {/* Description expandable */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  {event.description && (
                    <div 
                      className="font-text text-sm md:text-base leading-relaxed pt-4"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  )}
                  
                  {/* Boutons d'action */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    {/* Bouton "Join the family" - toujours présent */}
                    <a
                      href="/family"
                      className="inline-flex items-center justify-center px-6 py-3 bg-[#0080FF] text-black font-title uppercase text-sm md:text-base hover:bg-[#0066CC] transition-colors duration-300"
                    >
                      join the family
                    </a>
                    
                    {/* Bouton "Get my ticket" - uniquement si la date n'est pas passée */}
                    {eventDate && eventDate > new Date() && event.url && (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-6 py-3 bg-[#0080FF] text-black font-title uppercase text-sm md:text-base hover:bg-[#0066CC] transition-colors duration-300"
                      >
                        get my ticket
                      </a>
                    )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            
            {/* Séparateur */}
            {index < events.length - 1 && !isVideoMode && (
              <div className="w-full border-b border-white/20 mt-8 md:mt-12"></div>
            )}
              </motion.article>
            )}
          </AnimatePresence>
        );
      })}
      </div>
    </div>
  );
}
