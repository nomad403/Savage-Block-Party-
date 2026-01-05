import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		formats: ["image/avif", "image/webp"],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "i.ytimg.com",
				port: "",
				pathname: "/vi/**",
			},
		],
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	webpack: (config) => {
		// Ajouter le loader pour les fichiers GLSL
		config.module.rules.push({
			test: /\.(glsl|vert|frag)$/,
			type: 'asset/source',
		});
		return config;
	},
};

export default nextConfig;
