"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	useEffect(() => {
		// Ne pas initialiser Lenis sur la home (vidéo fullscreen) et agenda (scroll natif)
		if (pathname === "/" || pathname?.startsWith("/agenda")) return;

		const lenis = new Lenis({
			smoothWheel: true,
			duration: 1.2,
			easing: (t: number) => 1 - Math.pow(1 - t, 3),
		});

		let rafId = 0;
		function raf(time: number) {
			lenis.raf(time);
			rafId = requestAnimationFrame(raf);
		}
		render();
		function render() {
			rafId = requestAnimationFrame(raf);
		}

		return () => {
			cancelAnimationFrame(rafId);
			lenis.destroy();
		};
	}, [pathname]);

	return <>{children}</>;
}
