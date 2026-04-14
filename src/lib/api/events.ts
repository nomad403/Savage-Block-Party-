export type EventItem = {
    id: string;
    source: "shotgun" | "dice";
    title: string;
    description?: string;
    location?: string;
    url?: string;
    image?: string;
    startsAt?: string; // ISO
    endsAt?: string;   // ISO
};

// Secrets lus à l’exécution (obligatoire sur Cloudflare Workers : pas d’inlining vide au build)
function getShotgunOrganizerId(env: any): string {
    return (env.SB_SHOTGUN_ORGANIZER_ID || "").trim();
}
function getShotgunApiKey(env: any): string {
    return (env.SB_SHOTGUN_API_KEY || "").trim();
}
// Ancien endpoint conservé en fallback pour compatibilité
const SHOTGUN_SLUG = (process.env.NEXT_PUBLIC_SB_SHOTGUN_SLUG || process.env.SB_SHOTGUN_SLUG || 'savage-block-partys').trim();
const DICE_SLUG = (process.env.NEXT_PUBLIC_SB_DICE_SLUG || process.env.SB_DICE_SLUG || 'savage-block-partys-5kd8').trim();

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

function toIsoDate(input: any): string | undefined {
    if (!input) return undefined;
    if (typeof input === 'string') {
        // Common patterns; let Date parse the rest
        const d = new Date(input);
        if (!isNaN(d.getTime())) return d.toISOString();
        // Some sites provide YYYY-MM-DD without time
        const m = input.match(/\d{4}-\d{2}-\d{2}/);
        if (m) return new Date(m[0] + 'T00:00:00Z').toISOString();
        return undefined;
    }
    if (typeof input === 'number') {
        // seconds or ms
        const ms = input > 10_000_000_000 ? input : input * 1000;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) return d.toISOString();
        return undefined;
    }
    return undefined;
}

function safeJsonParse<T>(input: string): T | null {
    try { return JSON.parse(input) as T; } catch { return null; }
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** Texte brut Shotgun → HTML sûr pour dangerouslySetInnerHTML (retours ligne). */
function plainTextToHtml(text: string): string {
    return escapeHtml(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").join("<br/>");
}

function normalizeEventDescription(raw: unknown): string | undefined {
    if (typeof raw !== "string" || !raw.trim()) return undefined;
    const t = raw.trim();
    if (/<[a-z][\s\S]*>/i.test(t)) return t;
    return plainTextToHtml(t);
}

function formatShotgunLocation(e: any): string | undefined {
    const g = e?.geolocation;
    if (g && typeof g === "object") {
        const venue = typeof g.venue === "string" ? g.venue.trim() : "";
        const street = typeof g.street === "string" ? g.street.trim() : "";
        const city = typeof g.city === "string" ? g.city.trim() : "";
        if (venue && street) return `${venue} — ${street}`;
        if (venue && city) return `${venue}, ${city}`;
        if (street) return street;
        if (venue) return venue;
    }
    const v = e?.venue?.name || e?.venue_name || e?.location;
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Plus récent en premier ; événements sans date en fin de liste. */
export function sortEventsNewestFirst(events: EventItem[]): EventItem[] {
    return [...events].sort((a, b) => {
        const ta = a.startsAt ? new Date(a.startsAt).getTime() : null;
        const tb = b.startsAt ? new Date(b.startsAt).getTime() : null;
        if (ta === null && tb === null) return 0;
        if (ta === null) return 1;
        if (tb === null) return -1;
        return tb - ta;
    });
}

function extractJsonLd(html: string): any[] {
    const out: any[] = [];
    const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
        const json = safeJsonParse<any>(m[1]);
        if (!json) continue;
        if (Array.isArray(json)) out.push(...json);
        else if (json['@graph'] && Array.isArray(json['@graph'])) out.push(...json['@graph']);
        else out.push(json);
    }
    return out;
}

function mapJsonLdToEvents(items: any[], source: EventItem["source"]): EventItem[] {
    const events: EventItem[] = [];
    for (const it of items) {
        const type = it?.['@type'] || it?.type;
        if (!type) continue;
        const isEvent = Array.isArray(type) ? type.includes('Event') : (type === 'Event');
        if (!isEvent) continue;
        const offers = it.offers || {};
        const image = typeof it.image === 'string' ? it.image : (Array.isArray(it.image) ? it.image[0] : undefined);
        events.push({
            id: String(it['@id'] || it.url || it.name || Math.random()),
            source,
            title: it.name || "",
            description: it.description || (it.abstract ?? undefined),
            url: it.url || offers?.url,
            image,
            startsAt: toIsoDate(it.startDate || it.startTime),
            endsAt: toIsoDate(it.endDate || it.endTime),
        });
    }
    return events;
}

async function fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, {
        headers: {
            'user-agent': 'Mozilla/5.0 (compatible; SavageBlockPartyBot/1.0; +https://example.com)'
        },
        // Revalidate often but allow caching on the edge if deployed on Vercel
        cache: 'no-store'
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return await res.text();
}

function extractNextData(html: string): any | null {
    const m = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    if (!m) return null;
    return safeJsonParse<any>(m[1]);
}

function extractApolloState(html: string): any | null {
    const m = html.match(/window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\});/i);
    if (!m) return null;
    return safeJsonParse<any>(m[1]);
}

function deepCollectEvents(node: any, source: EventItem["source"], acc: EventItem[] = []): EventItem[] {
    const pushIfEvent = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        const title = obj.title || obj.name || obj.headline;
        const desc = obj.description || obj.summary || obj.subtitle;
        const image = obj.image || obj.artwork || obj.cover || obj.banner || obj.picture || obj.heroImage;
        const url = obj.url || obj.permalink || obj.shareUrl;
        const startRaw = obj.startDate || obj.start_time || obj.startsAt || obj.start || obj.date || obj.starts_at || obj.startTime;
        const endRaw = obj.endDate || obj.end_time || obj.endsAt || obj.end || obj.endTime;
        const start = toIsoDate(startRaw);
        const end = toIsoDate(endRaw);
        // Heuristic: require title and a parsed start date
        if (title && start) {
            acc.push({
                id: String(obj.id ?? url ?? title),
                source,
                title,
                description: typeof desc === 'string' ? desc : undefined,
                url: typeof url === 'string' ? url : undefined,
                image: typeof image === 'string' ? image : (Array.isArray(image) ? image[0] : undefined),
                startsAt: start,
                endsAt: end,
            });
        }
    };
    const walk = (x: any) => {
        if (!x || typeof x !== 'object') return;
        pushIfEvent(x);
        if (Array.isArray(x)) {
            for (const v of x) walk(v);
        } else {
            for (const k of Object.keys(x)) walk(x[k]);
        }
    };
    walk(node);
    return acc;
}

/** Parse le JSON public `public/agenda/json/...` (même schéma que l’export manuel). */
export function eventsFromAgendaJsonArray(json: unknown): EventItem[] {
    if (!Array.isArray(json) || json.length === 0) return [];
    const normalized = (json as any[]).map((e) => ({
        id: String(e.id || `${e.title}|${e.startsAt}`),
        source: e.source === "shotgun" || e.source === "dice" ? e.source : "shotgun",
        title: e.title || "",
        description: e.description || undefined,
        location: e.location || undefined,
        url: e.url || undefined,
        image: e.image || undefined,
        startsAt: toIsoDate(e.startsAt),
        endsAt: toIsoDate(e.endsAt),
    })) as EventItem[];
    return sortEventsNewestFirst(normalized);
}

export async function fetchShotgunEvents(): Promise<EventItem[]> {
    const mapShotgunEvent = (e: any, fallbackIdPrefix: string): EventItem => {
        const name = e?.name || e?.title || e?.event_name || "";
        const slug = e?.slug || e?.event_slug;
        const directUrl = typeof e?.url === "string" ? e.url.trim() : "";
        return {
            id: String(e?.id || e?.event_id || slug || `${fallbackIdPrefix}|${name}`),
            source: "shotgun",
            title: name,
            description: normalizeEventDescription(e?.description),
            location: formatShotgunLocation(e),
            url: directUrl || (slug ? `https://shotgun.live/events/${slug}` : undefined),
            image:
                e?.coverUrl ||
                e?.coverThumbnailUrl ||
                e?.banner_url ||
                e?.banner ||
                e?.image ||
                undefined,
            startsAt: toIsoDate(e?.start_time || e?.startTime || e?.starts_at || e?.startsAt || e?.date),
            endsAt: toIsoDate(e?.end_time || e?.endTime || e?.ends_at || e?.endsAt),
        };
    };

    const dedupeEvents = (items: EventItem[]): EventItem[] => {
        const seen = new Set<string>();
        const out: EventItem[] = [];
        for (const item of items) {
            const key = item.id ? `id:${item.id}` : `${(item.title || "").toLowerCase()}|${item.startsAt?.slice(0, 10) || ""}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(item);
        }
        return out;
    };

    const sortByStartsAt = (items: EventItem[]): EventItem[] =>
        items.sort((a, b) => new Date(a.startsAt ?? 0).getTime() - new Date(b.startsAt ?? 0).getTime());

    try {
        const earliest = new Date();
        earliest.setFullYear(earliest.getFullYear() - 6);
        agendaHttpLog("shotgun:init", {
            hasOrganizerId: Boolean(getShotgunOrganizerId(process.env)),
            hasApiKey: Boolean(getShotgunApiKey(process.env)),
            slug: SHOTGUN_SLUG,
            earliest: earliest.toISOString(),
        });

        // 1) Endpoint officiel /organizers/{id}/events?key=...
        const orgId = getShotgunOrganizerId(process.env);
        const apiKey = getShotgunApiKey(process.env);
        if (orgId && apiKey) {
            const out: EventItem[] = [];

            // A venir
            {
                const url = `https://smartboard-api.shotgun.live/api/shotgun/organizers/${orgId}/events?key=${encodeURIComponent(apiKey)}`;
                const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
                agendaHttpLog("shotgun:official:upcoming:response", {
                    status: res.status,
                    ok: res.ok,
                });
                if (res.ok) {
                    const json = await res.json();
                    const events = Array.isArray(json) ? json : (json?.events || json?.data || []);
                    agendaHttpLog("shotgun:official:upcoming:payload", {
                        count: Array.isArray(events) ? events.length : 0,
                    });
                    if (Array.isArray(events)) {
                        for (const e of events) {
                            const mapped = mapShotgunEvent(e, "upcoming");
                            const d = mapped.startsAt ? new Date(mapped.startsAt) : null;
                            if (d && d < earliest) continue;
                            out.push(mapped);
                        }
                    }
                }
            }

            // Passés (pagination documentée)
            {
                let page = 0;
                const limit = 100;
                let keep = true;
                while (keep && page <= 200) {
                    const url = `https://smartboard-api.shotgun.live/api/shotgun/organizers/${orgId}/events?key=${encodeURIComponent(apiKey)}&past_events=true&page=${page}&limit=${limit}`;
                    const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
                    agendaHttpLog("shotgun:official:past:response", {
                        page,
                        limit,
                        status: res.status,
                        ok: res.ok,
                    });
                    if (!res.ok) break;
                    const json = await res.json();
                    const events = Array.isArray(json) ? json : (json?.events || json?.data || []);
                    agendaHttpLog("shotgun:official:past:payload", {
                        page,
                        count: Array.isArray(events) ? events.length : 0,
                    });
                    if (!Array.isArray(events) || events.length === 0) break;

                    let addedThisPage = 0;
                    for (const e of events) {
                        const mapped = mapShotgunEvent(e, `past-${page}`);
                        const d = mapped.startsAt ? new Date(mapped.startsAt) : null;
                        if (d && d < earliest) {
                            keep = false;
                            break;
                        }
                        out.push(mapped);
                        addedThisPage += 1;
                    }
                    if (addedThisPage < limit) break;
                    page += 1;
                }
            }

            agendaHttpLog("shotgun:official:final", { count: out.length });
            return sortByStartsAt(dedupeEvents(out));
        }

        // 2) Fallback historique basé sur slug
        agendaHttpLog("shotgun:official:skipped", {
            reason: "missing-org-id-or-api-key",
            hasOrganizerId: Boolean(orgId),
            hasApiKey: Boolean(apiKey),
        });
        const statuses = ["upcoming", "past"];
        const out: EventItem[] = [];
        for (const status of statuses) {
            let page = 1;
            let keep = true;
            while (keep && page <= 200) {
                const url = `https://api.shotgun.live/v1/organizers/${SHOTGUN_SLUG}/events?status=${status}&page=${page}&per_page=100`;
                const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
                agendaHttpLog("shotgun:legacy:response", {
                    statusType: status,
                    page,
                    status: res.status,
                    ok: res.ok,
                });
                if (!res.ok) break;
                const json = await res.json();
                const events = (json?.events || json?.data || []);
                agendaHttpLog("shotgun:legacy:payload", {
                    statusType: status,
                    page,
                    count: Array.isArray(events) ? events.length : 0,
                });
                if (!Array.isArray(events) || events.length === 0) break;
                for (const e of events) {
                    const mapped = mapShotgunEvent(e, `${status}-${page}`);
                    const d = mapped.startsAt ? new Date(mapped.startsAt) : null;
                    if (d && d < earliest) {
                        keep = false;
                        break;
                    }
                    out.push(mapped);
                }
                page += 1;
            }
        }

        agendaHttpLog("shotgun:legacy:final", { count: out.length });
        return sortByStartsAt(dedupeEvents(out));
    } catch (err) {
        console.error("Shotgun error:", err);
        return [];
    }
}

export async function fetchDiceEvents(): Promise<EventItem[]> {
    try {
        const earliest = new Date(); earliest.setFullYear(earliest.getFullYear() - 6);
        const out: EventItem[] = [];
        let after: string | null = null;
        agendaHttpLog("dice:init", {
            slug: DICE_SLUG,
            earliest: earliest.toISOString(),
        });
        for (let i = 0; i < 20; i++) { // up to ~2000 events if page size=100
            const query = `
            query PromoterEvents($slug: String!, $first: Int!, $after: String) {
              promoter(slug: $slug) {
                events(first: $first, after: $after) {
                  pageInfo { hasNextPage endCursor }
                  edges { node { id name startAt endAt url images { url } } }
                }
              }
            }`;
            const res: Response = await fetch('https://api.dice.fm/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Origin': 'https://dice.fm', 'Accept': 'application/json' },
                body: JSON.stringify({ query, variables: { slug: DICE_SLUG, first: 100, after } }),
            });
            agendaHttpLog("dice:response", {
                page: i,
                after,
                status: res.status,
                ok: res.ok,
            });
            if (!res.ok) break;
            const json: any = await res.json();
            const data: any = json?.data?.promoter?.events;
            const edges = data?.edges || [];
            agendaHttpLog("dice:payload", {
                page: i,
                edges: Array.isArray(edges) ? edges.length : 0,
                hasNextPage: Boolean(data?.pageInfo?.hasNextPage),
            });
            for (const edge of edges) {
                const n = edge?.node;
                if (!n) continue;
                const startsAt = toIsoDate(n.startAt);
                const d = startsAt ? new Date(startsAt) : null;
                if (d && d < earliest) { after = null; break; }
                out.push({
                    id: String(n.id),
                    source: 'dice',
                    title: n.name || '',
                    url: n.url || undefined,
                    image: n.images?.[0]?.url,
                    startsAt,
                    endsAt: toIsoDate(n.endAt),
                });
            }
            if (!data?.pageInfo?.hasNextPage) break;
            after = data?.pageInfo?.endCursor || null;
        }
        agendaHttpLog("dice:final", { count: out.length });
        return out;
    } catch (err) {
        console.error('DICE error:', err);
        return [];
    }
}

export async function getAllEvents(): Promise<EventItem[]> {
    try {
        // Pas de fs ici : incompatible avec le bundle Worker OpenNext (même en import dynamique).

        // Remote sources (Shotgun + DICE)
        const [sg, dc] = await Promise.all([fetchShotgunEvents(), fetchDiceEvents()]);
        const normalizeTitle = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        const byKey: Record<string, EventItem> = {};
        for (const e of [...dc, ...sg]) {
            const day = e.startsAt?.slice(0,10) || '';
            const key = `${normalizeTitle(e.title)}|${day}`;
            byKey[key] = e;
        }
        const merged = sortEventsNewestFirst(Object.values(byKey));
        agendaHttpLog("all-events:merge", {
            shotgunCount: sg.length,
            diceCount: dc.length,
            mergedCount: merged.length,
        });
        return merged;
    } catch (err) {
        console.error("getAllEvents:", err);
        return [];
    }
}

export function pickUpcoming(events: EventItem[], now = new Date()): EventItem | undefined {
    const upcoming = events
        .filter(e => e.startsAt)
        .map(e => ({ e, t: new Date(e.startsAt as string).getTime() }))
        .sort((a,b) => a.t - b.t);
    const firstFuture = upcoming.find(x => x.t >= now.getTime());
    return (firstFuture?.e) || upcoming.at(-1)?.e || events[0];
}

export function eventsByDate(events: EventItem[], tz: string = 'Europe/Paris'): Record<string, EventItem[]> {
    const by: Record<string, EventItem[]> = {};
    for (const e of events) {
        if (!e.startsAt) continue;
        const key = (e.startsAt as string).slice(0,10); // UTC date string, consistent with calendar key
        (by[key] ||= []).push(e);
    }
    return by;
}

