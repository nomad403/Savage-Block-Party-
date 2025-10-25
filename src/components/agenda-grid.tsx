"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type EventItem = {
    id: string;
    title: string;
    image?: string;
    startsAt?: string;
    url?: string;
};

export default function AgendaGrid({
    todayIso,
    weekDays,
    byDate,
    featuredTitle,
    featuredImage,
    featuredDesc,
}: {
    todayIso: string;
    weekDays: string[];
    byDate: Record<string, EventItem[]>;
    featuredTitle?: string;
    featuredImage?: string;
    featuredDesc?: string;
}) {
    const today = useMemo(() => new Date(todayIso), [todayIso]);
    const baseYear = today.getFullYear();
    const baseMonth = today.getMonth();
    const [offsets, setOffsets] = useState<number[]>(() => Array.from({ length: 36 }, (_, i) => i - 18)); // ~3 ans seulement
    const [activeIndex, setActiveIndex] = useState<number>(18); // index du mois courant dans offsets
    const scrollRef = useRef<HTMLDivElement>(null);
    const touchStartYRef = useRef<number | null>(null);
    const didCenterRef = useRef(false);
    const initializingRef = useRef(true);
    const userInteractedRef = useRef(false);
    const [openKey, setOpenKey] = useState<string | null>(null);
    const [openEvents, setOpenEvents] = useState<EventItem[]>([]);
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);

    const makeThumb = (title: string) => {
        const text = (title || 'Event').slice(0, 14);
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='%23FACC15'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23000' font-weight='700'>${text.replace(/&/g,'&amp;')}</text></svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    const [monthText, yearText] = useMemo(() => {
        const d = new Date(baseYear, baseMonth + offsets[activeIndex], 1);
        const m = d.toLocaleDateString("fr-FR", { month: "long" });
        const y = String(d.getFullYear());
        const mm = m.charAt(0).toUpperCase() + m.slice(1);
        return [mm, y];
    }, [activeIndex, baseMonth, baseYear]); // Supprimé offsets de la dépendance

    const prevIndexRef = useRef(activeIndex);
    const [direction, setDirection] = useState(1);
    useEffect(() => {
        const prev = prevIndexRef.current;
        setDirection(activeIndex >= prev ? 1 : -1);
        prevIndexRef.current = activeIndex;
    }, [activeIndex]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const center = () => {
            if (didCenterRef.current) return;
            const h = el.clientHeight;
            if (h > 0) {
                el.scrollTop = h * activeIndex;
                didCenterRef.current = true;
                // Autoriser onScroll après le recadrage initial
                setTimeout(() => { initializingRef.current = false; }, 0);
            }
        };
        // essayer après paint
        requestAnimationFrame(center);
        // recenter si la hauteur change après montage
        const ro = new ResizeObserver(center);
        ro.observe(el);
        return () => ro.disconnect();
    }, [activeIndex]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const extendIfNeeded = (currIndex: number) => {
            if (!userInteractedRef.current) return;
            
            const buffer = 6; // marge réduite
            const batch = 12; // ajoute 12 mois à la fois (~1 an)
            
            if (currIndex < buffer) {
                setOffsets((prev) => {
                    const first = prev[0];
                    const prepend = Array.from({ length: batch }, (_, i) => first - batch + i);
                    requestAnimationFrame(() => {
                        el.scrollTop += batch * el.clientHeight;
                        setActiveIndex((idx) => idx + batch);
                    });
                    return [...prepend, ...prev];
                });
            }
            if (currIndex > offsets.length - buffer) {
                setOffsets((prev) => {
                    const last = prev[prev.length - 1];
                    const append = Array.from({ length: batch }, (_, i) => last + i + 1);
                    return [...prev, ...append];
                });
            }
        };

        let scrollTimeout: NodeJS.Timeout | null = null;
        const onScroll = () => {
            if (initializingRef.current) return;
            
            // Throttling plus agressif
            if (scrollTimeout) return;
            
            scrollTimeout = setTimeout(() => {
                const h = el.clientHeight;
                const top = el.scrollTop;
                const idx = Math.round(top / h);
                const clamped = Math.max(0, Math.min(offsets.length - 1, idx));
                
                if (clamped !== activeIndex) {
                    setActiveIndex(clamped);
                    // Étendre seulement si nécessaire
                    if (clamped < 6 || clamped > offsets.length - 6) {
                        extendIfNeeded(clamped);
                    }
                }
                scrollTimeout = null;
            }, 50); // Réduit à 20fps
        };

        const smoothToIndex = (nextIndex: number) => {
            const h = el.clientHeight;
            const target = Math.max(0, Math.min(offsets.length - 1, nextIndex)) * h;
            
            // Utiliser requestAnimationFrame pour un scroll plus fluide
            requestAnimationFrame(() => {
                el.scrollTo({ 
                    top: target, 
                    behavior: 'smooth' 
                });
            });
        };

        let wheelTimeout: NodeJS.Timeout;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            userInteractedRef.current = true;
            
            // Délai plus long pour éviter les scrolls multiples
            clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(() => {
                const dir = Math.sign(e.deltaY);
                const h = el.clientHeight;
                const curr = Math.round(el.scrollTop / h);
                
                const nextIndex = Math.max(0, Math.min(offsets.length - 1, curr + (dir > 0 ? 1 : -1)));
                smoothToIndex(nextIndex);
            }, 200);
        };

        const onTouchStart = (e: TouchEvent) => {
            userInteractedRef.current = true;
            touchStartYRef.current = e.touches[0]?.clientY ?? null;
        };
        const onTouchEnd = (e: TouchEvent) => {
            const start = touchStartYRef.current;
            if (start == null) return;
            const end = e.changedTouches[0]?.clientY ?? start;
            const dy = start - end;
            const threshold = 30; // petit geste suffit
            if (Math.abs(dy) < threshold) {
                // snap au plus proche
                const h = el.clientHeight;
                const curr = Math.round(el.scrollTop / h);
                extendIfNeeded(curr);
                smoothToIndex(curr);
                return;
            }
            const dir = Math.sign(dy);
            const h = el.clientHeight;
            const curr = Math.round(el.scrollTop / h);
            extendIfNeeded(curr);
            smoothToIndex(curr + (dir > 0 ? 1 : -1));
        };

        el.addEventListener('scroll', onScroll, { passive: true });
        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchend', onTouchEnd, { passive: true });
        return () => {
            clearTimeout(wheelTimeout);
            if (scrollTimeout) clearTimeout(scrollTimeout);
            el.removeEventListener('scroll', onScroll);
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchend', onTouchEnd);
        };
    }, [activeIndex, offsets.length]);

    return (
        <div className="absolute inset-0 grid grid-cols-13 grid-rows-7">
            {/* Ligne 1 */}
            <div className="col-span-3 relative flex items-center px-4">
                <div className="absolute bg-yellow-400" style={{ left: 1, right: 1, top: 1, bottom: 1, pointerEvents: 'none', zIndex: 0 }} aria-hidden />
                <div className="relative z-10 overflow-hidden min-w-0">
                    <AnimatePresence initial={false} mode="popLayout">
                        <motion.div
                            key={activeIndex}
                            initial={{ x: direction * 80, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -direction * 80, opacity: 0 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                            className="font-title uppercase text-3xl sm:text-4xl leading-none"
                        >
                            <span className="block">{monthText}</span>
                            <span className="block">{yearText}</span>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            {weekDays.map((d) => (
                <div key={d} className="flex items-center justify-center font-title uppercase text-xs tracking-wide">
                    {d}
                </div>
            ))}
            <div className="col-span-3 relative flex items-center px-4 justify-end">
                <div className="absolute bg-yellow-400" style={{ left: 1, right: 1, top: 1, bottom: 1, pointerEvents: 'none', zIndex: 0 }} aria-hidden />
                <h2 className="relative z-10 font-title uppercase text-xl leading-none text-right">{featuredTitle || "Titre évènement"}</h2>
            </div>

            {/* Bloc fusionné 3x6 gauche */}
            <div className="row-[2/8] col-[1/4] relative overflow-hidden">
                <div className="absolute bg-yellow-400" style={{ left: 1, right: 1, top: 1, bottom: 1, pointerEvents: 'none', zIndex: 0 }} aria-hidden />
                <div
                    style={{
                        position: 'absolute',
                        top: '-1px',
                        left: '-1px',
                        right: '-1px',
                        bottom: '-1px',
                        width: 'calc(100% + 2px)',
                        height: 'calc(100% + 2px)',
                        backgroundImage: `url(${featuredImage || '/agenda/photo/vignette.jpeg'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        margin: 0,
                        padding: 0,
                        border: 'none',
                        outline: 'none',
                        display: 'block',
                        fontSize: 0,
                        lineHeight: 0
                    }}
                    aria-hidden
                />
            </div>

            {/* Bloc fusionné 3x6 droite */}
            <div className="row-[2/8] col-[11/14] relative">
                <div className="absolute bg-yellow-400" style={{ left: 1, right: 1, top: 1, bottom: 1, pointerEvents: 'none', zIndex: 0 }} aria-hidden />
                {featuredDesc && (
                    <div className="relative z-10 p-3 pr-4 overflow-hidden">
                        <p className="font-text text-sm text-black/80 leading-snug whitespace-pre-line">{featuredDesc}</p>
                    </div>
                )}
            </div>

            {/* Centre scrollable vertical: 3 mois empilés */}
            <div className="row-[2/8] col-[4/11] relative">
                <div
                    ref={scrollRef}
                    className="absolute inset-0 overflow-y-auto no-scrollbar"
                    style={{
                        height: "100%",
                        scrollSnapType: "y proximity",
                        scrollBehavior: 'smooth',
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'auto',
                        display: "block",
                        verticalAlign: "top"
                    }}
                    data-lenis-prevent data-lenis-prevent-wheel data-lenis-prevent-touch
                >
                    {offsets.map((offset, i) => {
                        const base = new Date(baseYear, baseMonth + offset, 1);
                        const monthKeyLocal = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}`;
                        const raw = base.getDay();
                        const mondayIndex = (raw + 6) % 7;
                        const daysInMonth = new Date(base.getFullYear(), base.getMonth()+1, 0).getDate();
                        const todayYMD = new Date().toISOString().slice(0,10);
                        return (
                            <div
                                key={monthKeyLocal}
                                className="grid grid-cols-7 w-full"
                                style={{
                                    height: "100%",
                                    minHeight: "100%",
                                    scrollSnapAlign: "start",
                                    borderCollapse: "collapse",
                                    gap: 0,
                                    margin: 0,
                                    padding: 0,
                                    gridTemplateRows: "repeat(6, 1fr)",
                                    alignContent: "stretch",
                                    alignItems: "stretch"
                                }}
                            >
                                {Array.from({ length: 7 * 6 }).map((_, idx) => {
                                    const dayNum = idx - mondayIndex + 1;
                                    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
                                    const cellDateUtc = inMonth ? new Date(Date.UTC(base.getFullYear(), base.getMonth(), dayNum)) : null;
                                    const key = cellDateUtc ? cellDateUtc.toISOString().slice(0,10) : '';
                                    const dayEvents = (key && byDate[key]) || [];
                                    const isToday = inMonth && key === todayYMD;
                                    const first = dayEvents[0];
                                    const imgSrc = first ? (first.image || '/agenda/photo/vignette.jpeg') : '';
                                    return (
                                        <div
                                            key={`${monthKeyLocal}-${idx}`}
                                            className="relative overflow-hidden calendar-case"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                display: "block",
                                                boxSizing: "border-box",
                                                verticalAlign: "top"
                                            }}
                                        >
                                            {/* Fond bleu pour le jour en cours */}
                                            {isToday && (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        backgroundColor: '#079fce',
                                                        margin: 0,
                                                        padding: 0,
                                                        border: 'none',
                                                        outline: 'none',
                                                        display: 'block',
                                                        fontSize: 0,
                                                        lineHeight: 0,
                                                        zIndex: 1
                                                    }}
                                                    aria-hidden
                                                />
                                            )}
                                            {inMonth && (
                                                <>
                                                    {/* Image d'arrière-plan */}
                                                    {dayEvents.length > 0 && (
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                backgroundImage: `url(${imgSrc})`,
                                                                backgroundSize: 'cover',
                                                                backgroundPosition: 'center',
                                                                backgroundRepeat: 'no-repeat',
                                                                margin: 0,
                                                                padding: 0,
                                                                border: 'none',
                                                                outline: 'none',
                                                                display: 'block',
                                                                fontSize: 0,
                                                                lineHeight: 0
                                                            }}
                                                            aria-hidden
                                                        />
                                                    )}
                                                    {/* Animation dancer.webm pour cases vides au hover */}
                                                    {dayEvents.length === 0 && hoveredCell === key && (
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                backgroundColor: '#079fce',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                zIndex: 5
                                                            }}
                                                        >
                                                            <video
                                                                src="/general/dancer.webm"
                                                                autoPlay
                                                                loop
                                                                muted
                                                                playsInline
                                                                style={{
                                                                    width: '120%',
                                                                    height: '120%',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                            {/* Titre "join the family" avec flèche */}
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    left: '8px',
                                                                    top: '50%',
                                                                    transform: 'translateY(-50%)',
                                                                    color: '#FACC15',
                                                                    fontSize: '8px',
                                                                    fontWeight: 'bold',
                                                                    fontFamily: 'sans-serif',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.5px',
                                                                    zIndex: 10,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'flex-start',
                                                                    gap: '2px'
                                                                }}
                                                            >
                                                                <span>join the</span>
                                                                <span>family</span>
                                                                <div
                                                                    style={{
                                                                        width: '0',
                                                                        height: '0',
                                                                        borderLeft: '3px solid transparent',
                                                                        borderRight: '3px solid transparent',
                                                                        borderTop: '4px solid #FACC15',
                                                                        marginTop: '2px'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Numéro du jour en surimpression */}
                                                    <span className={`absolute top-1 left-1 text-[10px] font-text z-20 pointer-events-none ${
                                                        isToday ? 'text-yellow-400' : (dayEvents.length > 0 ? 'text-yellow-400' : 'text-black')
                                                    }`}>{dayNum}</span>
                                                    {dayEvents.length > 1 && (
                                                        <span className="absolute bottom-1 right-1 text-[9px] bg-black text-yellow-400 px-1 rounded-sm z-20 pointer-events-none">
                                                            +{dayEvents.length - 1}
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        aria-label={dayEvents.length > 0 ? `Voir ${dayEvents.length} événement(s) le ${key}` : `Jour ${dayNum}`}
                                                        onClick={() => { if (dayEvents.length > 0) { setOpenKey(key); setOpenEvents(dayEvents); } }}
                                                        onMouseEnter={() => setHoveredCell(key)}
                                                        onMouseLeave={() => setHoveredCell(null)}
                                                        className="absolute inset-0 z-30"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Modal événements du jour */}
            {openKey && (
                <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={() => { setOpenKey(null); setOpenEvents([]); }}>
                    <div className="bg-yellow-400 text-black rounded-md max-w-xl w-full p-4 relative" onClick={(e) => e.stopPropagation()}>
                        <button className="absolute right-3 top-3" aria-label="Fermer" onClick={() => { setOpenKey(null); setOpenEvents([]); }}>×</button>
                        <h3 className="font-title uppercase text-xl mb-3">{openKey}</h3>
                        <div className="space-y-3">
                            {openEvents.map((ev) => (
                                <a key={ev.id} href={ev.url || '#'} target="_blank" rel="noopener" className="flex gap-3 items-center hover:opacity-90">
                                    <img src={ev.image || makeThumb(ev.title)} alt={ev.title} className="w-12 h-12 object-cover rounded" />
                                    <div className="min-w-0">
                                        <div className="font-text font-semibold truncate">{ev.title}</div>
                                        {ev.startsAt && (
                                            <div className="text-xs text-black/70">{new Date(ev.startsAt).toLocaleString('fr-FR')}</div>
                                        )}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


