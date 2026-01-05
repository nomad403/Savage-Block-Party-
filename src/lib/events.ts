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

// Configurable slugs via env; fallbacks are guesses
const SHOTGUN_SLUG = (process.env.NEXT_PUBLIC_SB_SHOTGUN_SLUG || process.env.SB_SHOTGUN_SLUG || 'savage-block-partys').trim();
const DICE_SLUG = (process.env.NEXT_PUBLIC_SB_DICE_SLUG || process.env.SB_DICE_SLUG || 'savage-block-partys-5kd8').trim();

// Local JSON fallback reader (server-only)
import { readFile } from 'fs/promises';
import path from 'path';

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

export async function fetchShotgunEvents(): Promise<EventItem[]> {
    try {
        const earliest = new Date(); earliest.setFullYear(earliest.getFullYear() - 6);
        const statuses = ['upcoming', 'past'];
        const out: EventItem[] = [];
        for (const status of statuses) {
            let page = 1; let keep = true; const seen = new Set<string>();
            while (keep && page <= 200) {
                const url = `https://api.shotgun.live/v1/organizers/${SHOTGUN_SLUG}/events?status=${status}&page=${page}&per_page=100`;
                const res = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
                if (!res.ok) break;
                const json = await res.json();
                const events = (json?.events || json?.data || []);
                if (!Array.isArray(events) || events.length === 0) break;
                for (const e of events) {
                    const startsAt = toIsoDate(e.start_time || e.startTime || e.starts_at);
                    const d = startsAt ? new Date(startsAt) : null;
                    if (d && d < earliest) { keep = false; break; }
                    const key = `${(e.name||'').toLowerCase()}|${startsAt?.slice(0,10)}`;
                    if (seen.has(key)) continue; seen.add(key);
                    out.push({
                        id: String(e.id || e.slug || key),
                        source: 'shotgun',
                        title: e.name || e.title || '',
                        description: e.description || undefined,
                        url: e.slug ? `https://shotgun.live/events/${e.slug}` : (e.url || undefined),
                        image: e.banner_url || e.image || undefined,
                        startsAt,
                        endsAt: toIsoDate(e.end_time || e.endTime || e.ends_at),
                    });
                }
                page += 1;
            }
        }
        return out;
    } catch (err) {
        console.error('Shotgun error:', err);
        return [];
    }
}

export async function fetchDiceEvents(): Promise<EventItem[]> {
    try {
        const earliest = new Date(); earliest.setFullYear(earliest.getFullYear() - 6);
        const out: EventItem[] = [];
        let after: string | null = null;
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
            if (!res.ok) break;
            const json: any = await res.json();
            const data: any = json?.data?.promoter?.events;
            const edges = data?.edges || [];
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
        return out;
    } catch (err) {
        console.error('DICE error:', err);
        return [];
    }
}

export async function getAllEvents(): Promise<EventItem[]> {
    // 1) Local JSON fallback if present (PRIORITY)
    try {
        const filePath = path.join(process.cwd(), 'public', 'agenda', 'json', 'savage_block_partys_events.json');
        const raw = await readFile(filePath, 'utf8');
        const json = JSON.parse(raw);
        if (Array.isArray(json) && json.length > 0) {
            const normalized = (json as any[]).map((e) => ({
                id: String(e.id || `${e.title}|${e.startsAt}`),
                source: (e.source === 'shotgun' || e.source === 'dice') ? e.source : 'shotgun',
                title: e.title || '',
                description: e.description || undefined,
                location: e.location || undefined,
                url: e.url || undefined,
                image: e.image || undefined,
                startsAt: toIsoDate(e.startsAt),
                endsAt: toIsoDate(e.endsAt),
            })) as EventItem[];
            // Tri pour cohérence
            normalized.sort((a,b) => new Date(a.startsAt ?? 0).getTime() - new Date(b.startsAt ?? 0).getTime());
            return normalized;
        }
    } catch {}

    // 2) Remote sources (fallback if no local JSON)
    const [sg, dc] = await Promise.all([fetchShotgunEvents(), fetchDiceEvents()]);
    // Fusion: si deux events même jour avec titres proches, on privilégie Shotgun
    const normalizeTitle = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const byKey: Record<string, EventItem> = {};
    for (const e of [...dc, ...sg]) { // DICE puis Shotgun (Shotgun écrase)
        const day = e.startsAt?.slice(0,10) || '';
        const key = `${normalizeTitle(e.title)}|${day}`;
        byKey[key] = e; // Shotgun passera en dernier et prendra la priorité
    }
    const merged = Object.values(byKey);
    // Sort by start date when available
    merged.sort((a,b) => new Date(a.startsAt ?? 0).getTime() - new Date(b.startsAt ?? 0).getTime());
    return merged;
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


