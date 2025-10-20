import type { Metadata } from "next";
import { getAllEvents, pickUpcoming, eventsByDate, type EventItem } from "@/lib/events";
import AgendaGrid from "@/components/agenda-grid";

export const metadata: Metadata = {
  title: "Agenda — Savage Block Party",
};

function formatMonthYear(date: Date) {
  const s = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function AgendaPage() {
  const today = new Date();
  const monthYear = formatMonthYear(today);
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const events: EventItem[] = await getAllEvents();
  const featured = pickUpcoming(events, today);
  const byDate = eventsByDate(events);
  const featuredDesc = (featured?.description || "").replace(/<[^>]+>/g, "").trim();
  const monthKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
  // Pour le scroll vertical: empiler mois-1, mois courant, mois+1
  const monthOffsets = [-1, 0, 1];

  return (
    <main className="min-h-screen bg-yellow-400 text-black">
      <div className="container-px pt-16 pb-8">
        <div className="relative w-full min-h-[70vh]">
          <div className="absolute inset-0 grid-lines-13x7 pointer-events-none" aria-hidden />
          <AgendaGrid
            todayIso={today.toISOString()}
            weekDays={weekDays}
            byDate={byDate as any}
            featuredTitle={featured?.title}
            featuredImage={featured?.image}
            featuredDesc={featuredDesc}
          />
        </div>
        {/* Debug extraction (temporaire) */}
        <div className="mt-4 text-xs text-black/70 font-text">
          <span>Événements: {Object.values(byDate).reduce((n, a) => n + a.length, 0)}</span>
        </div>
      </div>
    </main>
  );
}

