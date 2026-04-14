import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.css";
import "./styles/fonts.css";
import "./styles/iframes.css";
import "./styles/scrollbar.css";
import "./styles/utilities.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header, Footer } from "@/components/layout";
import { BgVideoHome } from "@/components/features";
import { SoundCloudPlayer } from "@/components/player";
import { CustomScrollbar, MixBlendCursor } from "@/components/ui";
import { DynamicColorProvider } from "@/components/providers";
import { MenuOverlay } from "@/components/menu";

const isVercelHost = Boolean(process.env.VERCEL);

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Savage Block Party",
	description: "Collectif — site en construction",
	metadataBase: new URL("https://example.com"),
	openGraph: {
		title: "Savage Block Party",
		description: "Collectif — site en construction",
		url: "https://example.com",
		siteName: "Savage Block Party",
		images: [
			{
				url: "/og.jpg",
				width: 1200,
				height: 630,
				alt: "Savage Block Party",
			},
		],
		type: "website",
	},
	manifest: "/manifest.webmanifest",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="fr">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<DynamicColorProvider />
				<div className="noise-overlay" aria-hidden />
				<BgVideoHome />
			{/* Overlay global au plus haut niveau pour être au-dessus de tous les stacking contexts */}
			<MenuOverlay />
				<MixBlendCursor />
					<Header />
					{children}
					<SoundCloudPlayer />
				<CustomScrollbar />
					<Footer />
				{isVercelHost ? (
					<>
						<Analytics />
						<SpeedInsights />
					</>
				) : null}
			</body>
		</html>
	);
}
