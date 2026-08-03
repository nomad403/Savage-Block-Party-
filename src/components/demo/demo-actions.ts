/**
 * Helpers non invasifs pour orchestrer le teaser portfolio.
 * S'appuie sur les events app existants — ne modifie pas les pages.
 */

import {
	familyEvents,
	menuEvents,
	shopEvents,
	soundCloudEvents,
} from "@/lib/events/app-events";
import type { DemoAction } from "./demo-script";
import { DEMO_QUERY } from "./demo-script";

export type DemoNavigateFn = (path: string) => void;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}
		const id = window.setTimeout(() => resolve(), ms);
		const onAbort = () => {
			window.clearTimeout(id);
			reject(new DOMException("Aborted", "AbortError"));
		};
		signal?.addEventListener("abort", onAbort, { once: true });
	});
}

export function withDemoQuery(path: string, chromeHidden?: boolean): string {
	const url = new URL(path, "http://local.demo");
	url.searchParams.set(DEMO_QUERY, "1");
	// chrome=1 = témoin visible ; par défaut (absent) = capture site seul
	if (chromeHidden === false) {
		url.searchParams.set("chrome", "1");
	} else {
		url.searchParams.delete("chrome");
	}
	return `${url.pathname}${url.search}${url.hash}`;
}

export async function runDemoAction(
	action: DemoAction,
	opts: {
		navigate: DemoNavigateFn;
		signal?: AbortSignal;
		chromeHidden?: boolean;
	}
): Promise<void> {
	const { navigate, signal, chromeHidden } = opts;
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	switch (action.type) {
		case "wait":
			await sleep(action.ms, signal);
			return;

		case "navigate":
			navigate(withDemoQuery(action.path, chromeHidden));
			await sleep(450, signal);
			return;

		case "hoverMenu":
			if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
				return;
			}
			if (action.href) {
				menuEvents.itemHover(true, action.href);
			} else {
				menuEvents.itemHover(false, null);
			}
			return;

		case "hoverPlayer": {
			if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
				return;
			}
			soundCloudEvents.playerHover(action.active);
			const player = document.querySelector(".header-player") as HTMLElement | null;
			if (player) {
				player.dispatchEvent(
					new MouseEvent(action.active ? "mouseenter" : "mouseleave", {
						bubbles: true,
						cancelable: true,
						view: window,
					})
				);
			}
			return;
		}

		case "scroll": {
			const behavior = action.behavior ?? "smooth";
			if (action.to === "top") {
				window.scrollTo({ top: 0, behavior });
			} else if (action.to === "bottom") {
				window.scrollTo({
					top: document.documentElement.scrollHeight,
					behavior,
				});
			} else {
				window.scrollTo({ top: action.to, behavior });
			}
			return;
		}

		case "clickSelector": {
			const el = document.querySelector(action.selector) as HTMLElement | null;
			if (!el) {
				console.warn(`[demo] selector manquant: ${action.selector}`);
				return;
			}
			el.click();
			return;
		}

		case "dispatchFamilyVisible":
			familyEvents.dropdownOpen(action.visible);
			return;

		case "shopItemHover":
			shopEvents.itemHovered(action.productId !== null, action.productId);
			return;

		case "shopItemSelect":
			shopEvents.itemSelected(action.selected);
			return;

		default:
			return;
	}
}

export async function runDemoActions(
	actions: DemoAction[],
	opts: {
		navigate: DemoNavigateFn;
		signal?: AbortSignal;
		chromeHidden?: boolean;
		isPaused?: () => boolean;
	}
): Promise<void> {
	const { navigate, signal, chromeHidden, isPaused } = opts;

	for (const action of actions) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

		while (isPaused?.()) {
			await sleep(80, signal);
		}

		try {
			await runDemoAction(action, { navigate, signal, chromeHidden });
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				throw error;
			}
			console.warn("[demo] action échouée (skip soft)", action, error);
		}
	}
}
