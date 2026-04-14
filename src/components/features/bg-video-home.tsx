"use client";

import { useEffect } from "react";
import { usePageContext } from "@/hooks/usePageContext";

export default function BgVideoHome() {
	const { isHome } = usePageContext();

	useEffect(() => {
		if (isHome) {
			document.body.style.overflow = "hidden";
			document.documentElement.style.overflow = "hidden";
			document.body.classList.add("no-scroll");
			document.documentElement.classList.add("no-scroll");
		} else {
			// Pour toutes les autres pages, activer le scroll
			document.body.style.overflow = "";
			document.body.style.overflowY = "auto";
			document.documentElement.style.overflow = "";
			document.documentElement.style.overflowY = "auto";
			document.body.classList.remove("no-scroll");
			document.documentElement.classList.remove("no-scroll");
		}
		return () => {
			document.body.style.overflow = "";
			document.body.style.overflowY = "auto";
			document.documentElement.style.overflow = "";
			document.documentElement.style.overflowY = "auto";
			document.body.classList.remove("no-scroll");
			document.documentElement.classList.remove("no-scroll");
		};
	}, [isHome]);

	if (!isHome) return null;

	return (
		<div className="fixed inset-0 z-0 pointer-events-none">
			<video
				className="absolute top-1/2 left-1/2 filter-infrared"
				style={{
					width: "120vw",
					height: "67.5vw",
					minWidth: "213.33vh",
					minHeight: "120vh",
					transform: "translate(-50%, -50%) scale(1.1)",
					objectFit: "cover",
				}}
				autoPlay
				muted
				loop
				playsInline
				preload="auto"
				aria-label="Savage Block Party background video"
			>
				<source src="/home/videos/savage_home_page_teaser.webm" type="video/webm" />
			</video>
		</div>
	);
}

