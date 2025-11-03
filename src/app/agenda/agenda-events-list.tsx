"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMenu } from "@/hooks/useMenu";
import type { EventItem } from "@/lib/events";

interface AgendaEventsListProps {
  events: EventItem[];
}

export default function AgendaEventsList({ events }: AgendaEventsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { isMenuOpen } = useMenu();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className={`transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {events.map((event, index) => {
        const eventDate = event.startsAt ? new Date(event.startsAt).toLocaleDateString("fr-FR", { 
          day: "numeric", 
          month: "long", 
          year: "numeric" 
        }) : "";
        const capitalizedDate = eventDate.charAt(0).toUpperCase() + eventDate.slice(1);
        const isExpanded = expandedId === event.id;
        
        return (
          <div key={event.id}>
            <div className={`px-8 md:px-12 pb-4 pt-4 transition-colors duration-300 ${isExpanded ? 'bg-cyan-400' : 'bg-transparent'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-title text-sm md:text-base mb-2">{capitalizedDate}</div>
                  <h3 className="font-title uppercase text-xl md:text-2xl mb-2">{event.title}</h3>
                  {event.location && (
                    <div className="font-text text-base md:text-lg">{event.location}</div>
                  )}
                </div>
                <button
                  onClick={() => toggleExpand(event.id)}
                  className="ml-4 flex-shrink-0 w-8 h-8 flex items-center justify-center hover:opacity-80 transition-opacity"
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
                    className="transition-transform duration-300"
                  >
                    {isExpanded ? (
                      <>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </>
                    ) : (
                      <>
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </>
                    )}
                  </svg>
                </button>
              </div>
              
              <AnimatePresence>
                {isExpanded && event.description && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden pt-4"
                  >
                    <div className="font-text text-base md:text-lg">
                      {event.description}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Image sur mobile uniquement */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden md:hidden"
                  >
                    <div className="w-full h-[40vh] mt-4">
                      <img 
                        src="/agenda/photo/vignette.jpeg" 
                        alt="Agenda" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="w-full border-b-2 border-black"></div>
          </div>
        );
      })}
    </div>
  );
}

