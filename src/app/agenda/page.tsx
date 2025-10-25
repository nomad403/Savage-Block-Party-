import type { Metadata } from "next";
import { getAllEvents, pickUpcoming, eventsByDate, type EventItem } from "@/lib/events";
import AgendaGrid from "@/components/agenda-grid";
import GalleryFlash from "@/components/gallery-flash";

export const metadata: Metadata = {
  title: "Agenda — Savage Block Party",
};

function formatMonthYear(date: Date) {
  const s = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function AgendaPage() {
  const today = new Date();
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const events: EventItem[] = await getAllEvents();
  const featured = pickUpcoming(events, today);
  const byDate = eventsByDate(events);
  const featuredDesc = (featured?.description || "").replace(/<[^>]+>/g, "").trim();

  return (
    <main className="bg-yellow-400 text-black">
      <div className="container-px pt-16">
        <div className="relative w-full min-h-[70vh]">
          <div className="absolute inset-0 grid-lines-13x7 pointer-events-none" aria-hidden />
          <AgendaGrid
            todayIso={today.toISOString()}
            weekDays={weekDays}
            byDate={byDate}
            featuredTitle={featured?.title}
            featuredImage={featured?.image}
            featuredDesc={featuredDesc}
          />
        </div>
      </div>
      
      {/* Galerie flash avec vidéo dancer.webm - collée au calendrier */}
      <GalleryFlash />
    </main>
  );
}

