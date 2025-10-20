import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{ url: "https://example.com/", lastModified: new Date() },
		{ url: "https://example.com/manifeste", lastModified: new Date() },
		{ url: "https://example.com/collectif", lastModified: new Date() },
		{ url: "https://example.com/agenda", lastModified: new Date() },
		{ url: "https://example.com/galerie", lastModified: new Date() },
		{ url: "https://example.com/contact", lastModified: new Date() },
	];
}

