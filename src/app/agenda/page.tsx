import type { Metadata } from "next";
import { getAllEvents, type EventItem } from "@/lib/events";
import AgendaEventsList from "./agenda-events-list";

export const metadata: Metadata = {
  title: "Agenda — Savage Block Party",
};

export default async function AgendaPage() {
  const events: EventItem[] = await getAllEvents();

  return (
    <main id="agenda-root" className="min-h-screen" style={{ backgroundColor: '#1f1f1f', color: '#ffffff' }}>
      <div className="container-px pb-12 md:pb-16 agenda-container">
          <AgendaEventsList events={events} />
        </div>
    </main>
  );
}
