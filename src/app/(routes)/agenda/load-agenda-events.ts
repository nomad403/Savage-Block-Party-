import "server-only";

import { headers } from "next/headers";
import {
    eventsFromAgendaJsonArray,
    getAllEvents,
    type EventItem,
} from "@/lib/api/events";

/**
 * Charge les événements (APIs), puis si la liste est vide tente le JSON statique
 * servi par le même site (sans fs — requis pour Cloudflare Workers / OpenNext).
 */
export async function loadAgendaEventsWithFallback(): Promise<EventItem[]> {
    const primary = await getAllEvents();
    if (primary.length > 0) return primary;

    try {
        const h = await headers();
        const host = h.get("x-forwarded-host") ?? h.get("host");
        if (!host) return [];
        const protoRaw = h.get("x-forwarded-proto") ?? "https";
        const proto = protoRaw.split(",")[0]!.trim();
        const res = await fetch(`${proto}://${host}/agenda/json/savage_block_partys_events.json`, {
            cache: "no-store",
        });
        if (!res.ok) return [];
        const json = await res.json();
        return eventsFromAgendaJsonArray(json);
    } catch {
        return [];
    }
}
