"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPagePrimaryColor } from "@/hooks/usePagePrimaryColor";

const INTERACTIVE_SELECTOR = [
	"a",
	"button",
	"[role='button']",
	"input",
	"select",
	"textarea",
	"label",
	"summary",
	".cursor-pointer",
].join(",");

function shouldEnableBlendCursor(): boolean {
	if (typeof window === "undefined") return false;
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
	return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export default function MixBlendCursor() {
	const IDLE_DELAY_MS = 260;
	const IDLE_MOVE_EPSILON = 1.25;
	const pathname = usePathname();
	const cursorRef = useRef<HTMLDivElement | null>(null);
	const rafRef = useRef<number | null>(null);
	const idleTimerRef = useRef<number | null>(null);
	const targetRef = useRef({ x: 0, y: 0 });
	const posRef = useRef({ x: 0, y: 0 });
	const lastMoveRef = useRef({ x: -9999, y: -9999 });
	const visibleRef = useRef(false);
	const [enabled, setEnabled] = useState(false);
	const [visible, setVisible] = useState(false);
	const [isInteractive, setIsInteractive] = useState(false);
	const [isIdle, setIsIdle] = useState(false);

	const pageColor = useMemo(() => getPagePrimaryColor(pathname), [pathname]);

	useEffect(() => {
		setEnabled(shouldEnableBlendCursor());
	}, []);

	useEffect(() => {
		if (!enabled) return;
		const node = cursorRef.current;
		if (!node) return;

		const update = () => {
			const dx = targetRef.current.x - posRef.current.x;
			const dy = targetRef.current.y - posRef.current.y;
			posRef.current.x += dx * 0.18;
			posRef.current.y += dy * 0.18;
			node.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%)`;
			rafRef.current = window.requestAnimationFrame(update);
		};

		const onMove = (event: MouseEvent) => {
			targetRef.current.x = event.clientX;
			targetRef.current.y = event.clientY;
			const dx = event.clientX - lastMoveRef.current.x;
			const dy = event.clientY - lastMoveRef.current.y;
			const movedEnough = Math.hypot(dx, dy) >= IDLE_MOVE_EPSILON;
			if (movedEnough) {
				lastMoveRef.current.x = event.clientX;
				lastMoveRef.current.y = event.clientY;
				if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
				setIsIdle(false);
				idleTimerRef.current = window.setTimeout(() => {
					setIsIdle(true);
				}, IDLE_DELAY_MS);
			}
			if (!visibleRef.current) {
				posRef.current.x = event.clientX;
				posRef.current.y = event.clientY;
				visibleRef.current = true;
				setVisible(true);
			}
		};

		const onLeave = () => {
			if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
			setIsIdle(false);
			visibleRef.current = false;
			setVisible(false);
		};
		const onEnter = () => {
			lastMoveRef.current.x = -9999;
			lastMoveRef.current.y = -9999;
			visibleRef.current = true;
			setVisible(true);
		};

		const onHoverState = (event: Event) => {
			const target = event.target as Element | null;
			setIsInteractive(Boolean(target?.closest(INTERACTIVE_SELECTOR)));
		};

		document.body.classList.add("has-mix-blend-cursor");
		document.addEventListener("mousemove", onMove, { passive: true });
		document.addEventListener("mouseover", onHoverState, { passive: true });
		document.addEventListener("focusin", onHoverState, { passive: true });
		document.addEventListener("mouseleave", onLeave);
		document.addEventListener("mouseenter", onEnter);
		rafRef.current = window.requestAnimationFrame(update);

		return () => {
			document.body.classList.remove("has-mix-blend-cursor");
			document.removeEventListener("mousemove", onMove);
			document.removeEventListener("mouseover", onHoverState);
			document.removeEventListener("focusin", onHoverState);
			document.removeEventListener("mouseleave", onLeave);
			document.removeEventListener("mouseenter", onEnter);
			if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
			if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
		};
	}, [enabled]);

	if (!enabled) return null;

	return (
		<div
			ref={cursorRef}
			className={`mix-blend-cursor ${visible ? "is-visible" : ""} ${isInteractive ? "is-interactive" : ""} ${isIdle ? "is-idle" : ""}`}
			style={{ backgroundColor: pageColor }}
			aria-hidden
		/>
	);
}
