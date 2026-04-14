import "server-only";

import { headers } from "next/headers";
import {
    eventsFromAgendaJsonArray,
    getAllEvents,
    type EventItem,
} from "@/lib/api/events";
import bundledAgendaFallback from "./agenda-events-fallback.json";

function isAgendaHttpDebugEnabled(): boolean {
    return (
        process.env.SB_AGENDA_HTTP_DEBUG === "1" ||
        process.env.NEXT_PUBLIC_AGENDA_DEBUG === "1"
    );
}

function agendaHttpLog(scope: string, data: Record<string, unknown>): void {
    if (!isAgendaHttpDebugEnabled()) return;
    console.info(`[AgendaHTTP] ${scope}`, data);
}

/**
 * Charge les événements (APIs), puis si la liste est vide tente le JSON statique
 * servi par le même site (sans fs — requis pour Cloudflare Workers / OpenNext).
 */
export async function loadAgendaEventsWithFallback(): Promise<EventItem[]> {
    const primary = await getAllEvents();
    agendaHttpLog("agenda-loader:primary", { count: primary.length });
    if (primary.length > 0) {
        agendaHttpLog("agenda-loader:source", { source: "api" });
        return primary;
    }

    // Fallback déterministe embarqué (ne dépend ni du host/proxy ni d'un fetch interne).
    const bundledFallback = eventsFromAgendaJsonArray(bundledAgendaFallback);
    agendaHttpLog("agenda-loader:bundled-fallback", { count: bundledFallback.length });

    try {
        const h = await headers();
        const host = h.get("x-forwarded-host") ?? h.get("host");
        if (!host) {
            agendaHttpLog("agenda-loader:host-missing", { source: "bundled-fallback" });
            return bundledFallback;
        }
        const protoRaw = h.get("x-forwarded-proto") ?? "https";
        const proto = protoRaw.split(",")[0]!.trim();
        const res = await fetch(`${proto}://${host}/agenda/json/savage_block_partys_events.json`, {
            cache: "no-store",
        });
        agendaHttpLog("agenda-loader:file-fallback:response", {
            url: `${proto}://${host}/agenda/json/savage_block_partys_events.json`,
            status: res.status,
            ok: res.ok,
        });
        if (!res.ok) {
            agendaHttpLog("agenda-loader:source", { source: "bundled-fallback", reason: "file-fallback-http-not-ok" });
            return bundledFallback;
        }
        const json = await res.json();
        const fileFallback = eventsFromAgendaJsonArray(json);
        const useFileFallback = fileFallback.length > 0;
        agendaHttpLog("agenda-loader:file-fallback:payload", {
            count: fileFallback.length,
            selected: useFileFallback ? "file-fallback" : "bundled-fallback",
        });
        return useFileFallback ? fileFallback : bundledFallback;
    } catch {
        agendaHttpLog("agenda-loader:source", { source: "bundled-fallback", reason: "exception" });
        return bundledFallback;
    }
}
