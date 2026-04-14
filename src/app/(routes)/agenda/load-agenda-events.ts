import "server-only";

import { headers } from "next/headers";
import {
    eventsFromAgendaJsonArray,
    getAllEvents,
    type EventItem,
} from "@/lib/api/events";
import bundledAgendaFallback from "./agenda-events-fallback.json";

/**
 * Charge les événements (APIs), puis si la liste est vide tente le JSON statique
 * servi par le même site (sans fs — requis pour Cloudflare Workers / OpenNext).
 */
export async function loadAgendaEventsWithFallback(): Promise<EventItem[]> {
    const primary = await getAllEvents();
    if (primary.length > 0) return primary;

    // Fallback déterministe embarqué (ne dépend ni du host/proxy ni d'un fetch interne).
    const bundledFallback = eventsFromAgendaJsonArray(bundledAgendaFallback);

    try {
        const h = await headers();
        const host = h.get("x-forwarded-host") ?? h.get("host");
        if (!host) return bundledFallback;
        const protoRaw = h.get("x-forwarded-proto") ?? "https";
        const proto = protoRaw.split(",")[0]!.trim();
        const res = await fetch(`${proto}://${host}/agenda/json/savage_block_partys_events.json`, {
            cache: "no-store",
        });
        if (!res.ok) return bundledFallback;
        const json = await res.json();
        const fileFallback = eventsFromAgendaJsonArray(json);
        return fileFallback.length > 0 ? fileFallback : bundledFallback;
    } catch {
        return bundledFallback;
    }
}
