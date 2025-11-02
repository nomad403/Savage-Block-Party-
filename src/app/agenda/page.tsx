import type { Metadata } from "next";
import { getAllEvents, pickUpcoming, eventsByDate, type EventItem } from "@/lib/events";
import AgendaGrid from "@/components/agenda-grid";
import GalleryFlash from "@/components/gallery-flash";
import MenuAwareSection from "@/components/menu-aware-section";

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

  // Textes des commandements pour les bannières
  const commandmentBanners = [
    "DANS UNE BOUTEILLE EN PLASTIQUE, TON BREUVAGE TU RAMÈNERAS.",
    "LE GARDIEN DE TON FRÈRE TU SERAS, SUR TOUT LE MONDE TU VEILLERAS.",
    "LA LOCALISATION POUR TOI ET TON GROUPE D'AMIS TU GARDERAS.",
    "COMME TU ES TU VIENDRAS. DANS UN TROU, UN GRILLAGE, COMME TOUT LE MONDE, TU PASSERAS.",
    "AUX ABORDS DU LIEU, DISCRET TU RESTERAS.",
    "LE LIEU TU RESPECTERAS, DANS UNE POUBELLE TES DÉCHETS TU JETTERAS.",
    "TOUT COMPORTEMENT IRRESPECTUEUX (BAGARRES, ATTOUCHEMENTS) : LA SORTIE TU PRENDRAS.",
    "LES OBJETS TROUVÉS À L'ORGA TU RAMÈNERAS.",
    "TES AMIS TU AVERTIRAS ET TON DÉPART DE LA SOIRÉE TU PRÉVOIRAS.",
    "EN CAS DE PROBLÈMES, UN SAVER (ORGA) TU PRÉVIENDRAS."
  ];

  return (
    <main className="bg-yellow-400 text-black">
      <div className="container-px pt-16 pb-20">
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
      
      {/* Bannière de séparation 1 */}
      <section className="w-full bg-cyan-400 text-black py-4 relative overflow-hidden">
        <MenuAwareSection>
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {/* Texte défilant */}
            <div className="flex items-center gap-8 whitespace-nowrap animate-scroll-text w-full">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="font-title uppercase text-2xl sm:text-3xl md:text-4xl">
                  {commandmentBanners[0]}
                </span>
              ))}
            </div>
          </div>
        </MenuAwareSection>
      </section>
      
      {/* Galerie flash avec vidéo dancer.webm - collée au calendrier */}
      <GalleryFlash />
    </main>
  );
}

