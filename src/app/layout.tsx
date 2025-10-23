import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/providers/lenis-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import BgVideoHome from "@/components/bg-video-home";
import SoundCloudPlayer from "@/components/soundcloud-player-simple";
import CustomScrollbar from "@/components/custom-scrollbar";

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
				<div className="noise-overlay" aria-hidden />
				<BgVideoHome />
				<LenisProvider>
					<Header />
					{children}
					<SoundCloudPlayer />
					<CustomScrollbar />
				</LenisProvider>
				<Footer />
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
