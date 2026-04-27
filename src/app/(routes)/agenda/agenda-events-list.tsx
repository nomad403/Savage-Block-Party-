"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useMenu } from "@/hooks/useMenu";
import type { EventItem } from "@/lib/api/events";

interface AgendaEventsListProps {
  events: EventItem[];
}

function parseEventTimestamp(value?: string): number | null {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

function dayKeyInParis(ts: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ts));
}

type AgendaEventStatus = "upcoming" | "ongoing" | "past" | "invalid";

function getAgendaEventTiming(event: EventItem, nowTs: number) {
  const startTs = parseEventTimestamp(event.startsAt);
  const endTs = parseEventTimestamp(event.endsAt);
  if (startTs === null) {
    return {
      status: "invalid" as AgendaEventStatus,
      startTs,
      endTs,
      isUpcoming: false,
      isOngoing: false,
      shouldPulse: false,
      label: null as null | "soon" | "now",
      reason: "startTs-invalid-or-missing",
    };
  }

  const sameParisDayAsNow = dayKeyInParis(startTs) === dayKeyInParis(nowTs);
  const isOngoing =
    startTs <= nowTs && (endTs !== null ? endTs >= nowTs : sameParisDayAsNow);
  const isUpcoming = startTs > nowTs;
  const status: AgendaEventStatus = isOngoing
    ? "ongoing"
    : isUpcoming
      ? "upcoming"
      : "past";

  return {
    status,
    startTs,
    endTs,
    isUpcoming,
    isOngoing,
    shouldPulse: isUpcoming || isOngoing,
    label: isOngoing ? ("now" as const) : isUpcoming ? ("soon" as const) : null,
    reason:
      status === "ongoing"
        ? endTs !== null
          ? "start<=now<=end"
          : "same-paris-day-fallback-no-end"
        : status === "upcoming"
          ? "start>now"
          : "start<now-and-not-ongoing",
  };
}

/** Ressort partagé pour les animations layout (déplacements fluides à l’ouverture / fermeture du détail). */
const AGENDA_LAYOUT_SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 34,
  mass: 0.85,
};

export default function AgendaEventsList({ events }: AgendaEventsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const byEnv = process.env.NEXT_PUBLIC_AGENDA_DEBUG === "1";
    const searchParams = new URLSearchParams(window.location.search);
    const byQuery = Array.from(searchParams.keys()).some(
      (key) => key.toLowerCase() === "agendadebug",
    );
    const byHash = window.location.hash.toLowerCase().includes("agendadebug");
    const byStorage =
      window.localStorage.getItem("agendaDebug") === "1" ||
      window.localStorage.getItem("AgendaDebug") === "1";
    const enabled = byEnv || byQuery || byHash || byStorage;
    setIsDebugEnabled(enabled);

    console.info("[AgendaDebug] boot", {
      enabled,
      byEnv,
      byQuery,
      byHash,
      byStorage,
      url: window.location.href,
    });
  }, []);

  useEffect(() => {
    if (!isDebugEnabled) return;
    const nowTs = Date.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nowParis = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      dateStyle: "full",
      timeStyle: "long",
    }).format(new Date(nowTs));

    const rows = events.map((event) => {
      const timing = getAgendaEventTiming(event, nowTs);
      return {
        id: event.id,
        title: event.title,
        startsAt: event.startsAt ?? null,
        endsAt: event.endsAt ?? null,
        startTs: timing.startTs,
        endTs: timing.endTs,
        status: timing.status,
        isUpcoming: timing.isUpcoming,
        isOngoing: timing.isOngoing,
        shouldPulse: timing.shouldPulse,
        label: timing.label,
        reason: timing.reason,
      };
    });

    console.groupCollapsed("[AgendaDebug] statut des events");
    console.log("[AgendaDebug] now", new Date(nowTs).toISOString());
    console.log("[AgendaDebug] now@Europe/Paris", nowParis);
    console.log("[AgendaDebug] reduced-motion", reducedMotion);
    console.log("[AgendaDebug] timezone navigateur", Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.table(rows);
    console.log(
      "[AgendaDebug] count shouldPulse =",
      rows.filter((r) => r.shouldPulse).length,
      "/",
      rows.length,
    );
    console.groupEnd();

    requestAnimationFrame(() => {
      const pulseNodes = Array.from(
        document.querySelectorAll<HTMLElement>("#agenda-root .agenda-event-upcoming-typo"),
      );
      console.groupCollapsed("[AgendaDebug] état DOM/CSS pulse");
      console.log("[AgendaDebug] nodes avec classe pulse", pulseNodes.length);
      if (pulseNodes.length > 0) {
        const sample = pulseNodes[0];
        const styles = window.getComputedStyle(sample);
        console.log("[AgendaDebug] sample text", sample.textContent?.trim() ?? "");
        console.log("[AgendaDebug] animationName", styles.animationName);
        console.log("[AgendaDebug] animationDuration", styles.animationDuration);
        console.log("[AgendaDebug] animationPlayState", styles.animationPlayState);
        console.log("[AgendaDebug] computedColor", styles.color);
      }
      console.groupEnd();
    });
  }, [events, isDebugEnabled]);

  return (
    <div className={`agenda-scroll relative transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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

      <LayoutGroup>
      <div className={`relative ${isVideoMode ? 'z-[10]' : ''}`}>
      {events.map((event, index) => {
        const eventDate = event.startsAt ? new Date(event.startsAt) : null;
        const isExpanded = expandedId === event.id;
        const shouldShow = !isVideoMode || isExpanded; // Afficher uniquement l'item étendu en mode vidéo

        const agendaTz = "Europe/Paris";
        const displayDate =
          eventDate
            ? (() => {
                const datePart = eventDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: agendaTz,
                });
                const timePart = eventDate.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: agendaTz,
                });
                const withWeekday =
                  datePart.charAt(0).toUpperCase() + datePart.slice(1);
                return `${withWeekday} · ${timePart}`;
              })()
            : "";

        const timing = getAgendaEventTiming(event, Date.now());
        const isUpcomingOrOngoing = timing.shouldPulse;
        const eventStatusLabel = timing.label;
        const upcomingTypoClass = isUpcomingOrOngoing ? "agenda-event-upcoming-typo" : "";

        return (
          <AnimatePresence key={event.id}>
            {shouldShow && (
              <motion.article
                layout
                initial={isVideoMode ? { opacity: 0, y: 20 } : false}
                animate={isVideoMode ? { opacity: 1, y: 0 } : {}}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  layout: AGENDA_LAYOUT_SPRING,
                  opacity: { duration: 0.4, ease: "easeInOut" },
                  y: { duration: 0.4, ease: "easeInOut" },
                }}
                className="mb-8 md:mb-12"
              >
            <div className="flex items-start justify-between gap-4 mb-2">
                <motion.div
                  layout="position"
                  className="flex-1"
                  transition={{ layout: AGENDA_LAYOUT_SPRING }}
                >
                {/* Date en haut */}
                {displayDate && (
                  <div
                    className={`font-title text-xs md:text-sm mb-3 opacity-70 ${upcomingTypoClass}`}
                  >
                    {displayDate}
                  </div>
                )}
                
                {/* Titre principal */}
                <h2
                  className={`font-title uppercase text-xl md:text-2xl lg:text-3xl mb-3 leading-tight ${upcomingTypoClass}`}
                >
                  {event.title}
                </h2>
                
                {/* Localisation ; « · soon » à la suite si à venir */}
                {event.location ? (
                  <div className="font-text text-base md:text-lg mb-3 opacity-80">
                    <span className={upcomingTypoClass}>{event.location}</span>
                    {isUpcomingOrOngoing && eventStatusLabel && (
                      <span
                        className={`font-title text-[10px] md:text-[11px] uppercase tracking-[0.28em] whitespace-nowrap ${upcomingTypoClass}`}
                      >
                        {" "}
                        · {eventStatusLabel}
                      </span>
                    )}
                  </div>
                ) : (
                  isUpcomingOrOngoing && eventStatusLabel && (
                    <div className="font-text text-base md:text-lg mb-3 opacity-80">
                      <span
                        className={`font-title text-[10px] md:text-[11px] uppercase tracking-[0.28em] ${upcomingTypoClass}`}
                      >
                        · {eventStatusLabel}
                      </span>
                    </div>
                  )
                )}
                </motion.div>
              
              {/* Bouton expand/collapse */}
              {event.description && (
                <motion.div
                  layout="position"
                  className="flex-shrink-0"
                  transition={{ layout: AGENDA_LAYOUT_SPRING }}
                >
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
                </motion.div>
              )}
              </div>
              
            {/* Description expandable */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    layout
                    transition={{ layout: AGENDA_LAYOUT_SPRING }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.26, ease: "easeOut" }}
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
                          href="/presse#presse-contact-form"
                          className="agenda-detail-cta inline-flex items-center justify-center px-6 py-3 bg-[#0080FF] text-black font-title uppercase text-sm md:text-base transition-colors duration-300"
                        >
                          join the family
                        </a>
                        {eventDate && eventDate > new Date() && event.url && (
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="agenda-detail-cta inline-flex items-center justify-center px-6 py-3 bg-[#0080FF] text-black font-title uppercase text-sm md:text-base transition-colors duration-300"
                          >
                            get my tickets
                          </a>
                        )}
                      </div>
                    </motion.div>
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
      </LayoutGroup>
    </div>
  );
}
