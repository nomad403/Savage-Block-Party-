/**
 * Script du teaser portfolio — scènes, légendes craft, actions.
 * Durées totales ~50–60s (réglables ici uniquement).
 */

export type DemoAction =
	| { type: "wait"; ms: number }
	| { type: "navigate"; path: string }
	| { type: "hoverMenu"; href: string | null }
	| { type: "hoverPlayer"; active: boolean }
	| { type: "scroll"; to: "top" | "bottom" | number; behavior?: ScrollBehavior }
	| { type: "clickSelector"; selector: string }
	| { type: "dispatchFamilyVisible"; visible: boolean }
	| { type: "shopItemHover"; productId: number | null }
	| { type: "shopItemSelect"; selected: boolean };

export type DemoScene = {
	id: string;
	path: string;
	durationMs: number;
	caption: string;
	/** Sous-titre craft plus court (optionnel) */
	note?: string;
	actions: DemoAction[];
};

export const DEMO_QUERY = "demo";
export const DEMO_CHROME_QUERY = "chrome";

export const DEMO_SCENES: DemoScene[] = [
	{
		id: "home",
		path: "/",
		durationMs: 7000,
		caption: "Expérience immersive — identité forte, pas un template.",
		note: "Hero vidéo plein écran, brand first.",
		actions: [
			{ type: "navigate", path: "/" },
			{ type: "wait", ms: 900 },
			{ type: "hoverMenu", href: "/family" },
			{ type: "wait", ms: 1200 },
			{ type: "hoverMenu", href: "/agenda" },
			{ type: "wait", ms: 1000 },
			{ type: "hoverMenu", href: null },
			{ type: "wait", ms: 2500 },
		],
	},
	{
		id: "player",
		path: "/",
		durationMs: 8000,
		caption: "UX audio sur-mesure — waveform vivante, timeline utile.",
		note: "Loading animé → hover → expand timeline.",
		actions: [
			{ type: "navigate", path: "/" },
			{ type: "wait", ms: 1500 },
			{ type: "hoverPlayer", active: true },
			{ type: "wait", ms: 2800 },
			{ type: "hoverPlayer", active: false },
			{ type: "wait", ms: 1500 },
			{ type: "hoverPlayer", active: true },
			{ type: "wait", ms: 1800 },
			{ type: "hoverPlayer", active: false },
		],
	},
	{
		id: "family",
		path: "/family",
		durationMs: 10000,
		caption: "Médias plein écran + UI dockée — interaction scénarisée.",
		note: "Scroll, dropdowns Family, sélection.",
		actions: [
			{ type: "navigate", path: "/family" },
			{ type: "wait", ms: 1200 },
			{ type: "scroll", to: "bottom", behavior: "smooth" },
			{ type: "wait", ms: 2200 },
			{ type: "dispatchFamilyVisible", visible: true },
			{ type: "wait", ms: 800 },
			{
				type: "clickSelector",
				selector: ".family-dropdowns-container button",
			},
			{ type: "wait", ms: 2500 },
			{
				type: "clickSelector",
				selector: ".family-dropdowns-container button",
			},
			{ type: "wait", ms: 1200 },
		],
	},
	{
		id: "shop",
		path: "/shop",
		durationMs: 7000,
		caption: "Direction produit — teaser shop, couleurs système.",
		note: "Coming soon orchestré, pas une grille générique.",
		actions: [
			{ type: "navigate", path: "/shop" },
			{ type: "wait", ms: 1000 },
			{ type: "hoverMenu", href: "/shop" },
			{ type: "wait", ms: 1400 },
			{ type: "hoverMenu", href: null },
			{ type: "shopItemHover", productId: 1 },
			{ type: "wait", ms: 1600 },
			{ type: "shopItemHover", productId: null },
			{ type: "wait", ms: 1800 },
		],
	},
	{
		id: "agenda",
		path: "/agenda",
		durationMs: 7000,
		caption: "Agenda vivant — data & pulse événementiel.",
		note: "Liste dynamique, UI événementielle.",
		actions: [
			{ type: "navigate", path: "/agenda" },
			{ type: "wait", ms: 1200 },
			{ type: "scroll", to: 420, behavior: "smooth" },
			{ type: "wait", ms: 2000 },
			{ type: "scroll", to: 900, behavior: "smooth" },
			{ type: "wait", ms: 2000 },
			{ type: "scroll", to: "top", behavior: "smooth" },
		],
	},
	{
		id: "presse",
		path: "/presse",
		durationMs: 7000,
		caption: "Direction éditoriale — logos, typo, reveals.",
		note: "Composition presse, pas un formulaire stock.",
		actions: [
			{ type: "navigate", path: "/presse" },
			{ type: "wait", ms: 1400 },
			{ type: "scroll", to: 280, behavior: "smooth" },
			{ type: "wait", ms: 2200 },
			{ type: "scroll", to: 560, behavior: "smooth" },
			{ type: "wait", ms: 2000 },
		],
	},
	{
		id: "outro",
		path: "/",
		durationMs: 6000,
		caption: "Conçu, pas assemblé — expérience numérique pérenne.",
		note: "Savage Block Party × nomad403",
		actions: [
			{ type: "navigate", path: "/" },
			{ type: "wait", ms: 800 },
			{ type: "hoverPlayer", active: true },
			{ type: "wait", ms: 2000 },
			{ type: "hoverPlayer", active: false },
			{ type: "wait", ms: 1500 },
			{ type: "hoverMenu", href: "/family" },
			{ type: "wait", ms: 1000 },
			{ type: "hoverMenu", href: null },
		],
	},
];

export function getTotalDurationMs(scenes: DemoScene[] = DEMO_SCENES): number {
	return scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
}
